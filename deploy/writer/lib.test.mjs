// Run: node --test deploy/writer/   (Node 24: imports the TypeScript publishing rules directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractJson, tidyTypography, pageText, quoteFound, parseDetector, assess } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

test('extractJson reads a fenced block, bare braces, and refuses junk', () => {
  assert.deepEqual(extractJson('Here:\n```json\n{"a":1}\n```\nthanks'), { a: 1 });
  assert.deepEqual(extractJson('noise {"skip": true, "reason": "x"} tail'), { skip: true, reason: 'x' });
  assert.equal(extractJson('```json\n{broken\n```'), null);
  assert.equal(extractJson('[1,2]'), null);
});

test('tidyTypography straightens quotes and keeps em dashes for the model to fix', () => {
  assert.equal(tidyTypography('\u201cIt\u2019s\u201d 2025\u201326\u00a0ok\u2026'), '"It\'s" 2025-26 ok...');
  assert.ok(tidyTypography('a \u2014 b').includes('\u2014'));
});

test('quote matching survives markup, entities, rupee signs and line breaks, not a different sentence', () => {
  const html = `<html><head><title>x</title><script>var a=1</script></head><body><nav>Home | About</nav>
    <p>The Reserve Bank of India has decided to keep the policy repo rate unchanged at <b>5.50&nbsp;per cent</b>.</p>
    <p>The limit is &#8377;1,50,000 per&nbsp;financial
    year under Section 80C.</p></body></html>`;
  const text = pageText(html);
  assert.ok(quoteFound('decided to keep the policy repo rate unchanged at 5.50 per cent', text));
  assert.ok(quoteFound('The limit is Rs 1,50,000 per financial year under Section 80C', text));
  assert.ok(quoteFound('The limit is \u20b91,50,000 per financial year under Section 80C', text));
  assert.ok(!quoteFound('decided to cut the policy repo rate to 5.25 per cent with immediate effect', text));
  assert.ok(!quoteFound('repo rate', text), 'too short to count');
  assert.ok(!text.includes('var a'), 'scripts are dropped');
});

test('parseDetector reads severities from the real detector', () => {
  // The detector exits 1 when it finds something, which is the point of this input.
  const r = spawnSync(process.env.PYTHON || 'python3', [join(HERE, 'skills/human-prose/scripts/ai_tells.py'), '--strict'], {
    input: 'It is a testament to the vibrant tapestry \u2014 truly pivotal.\n\nI hope this helps!\n', encoding: 'utf8',
  });
  assert.equal(r.status, 1, r.stderr);
  const out = r.stdout;
  const d = parseDetector(out);
  assert.ok(d.findings.length > 0, out);
  assert.ok(d.high + d.medium > 0);
}, );

test('parseDetector on a fixed sample', () => {
  const d = parseDetector('high   <stdin>:3  [chatter] "I hope this helps"\nmedium <stdin>:1  [em-dash] 1 em dash\nlow    <stdin>:9  [sign-off] x\n\nscanned 1 file(s): 1 high, 1 medium, 1 low');
  assert.equal(d.high, 1); assert.equal(d.medium, 1); assert.equal(d.low, 1);
  assert.equal(d.findings[0].line, 3);
});

const clean = { findings: [], high: 0, medium: 0, low: 0 };
const okValidation = { ok: true };
const src = [{ url: 'https://www.rbi.org.in/a', reachable: true, official: true }, { url: 'https://www.livemint.com/b', reachable: true, official: false }];
const claims = (n, bad = 0) => Array.from({ length: n }, (_, i) => ({ claim: `c${i}`, source_url: i % 2 ? 'https://www.livemint.com/b' : 'https://www.rbi.org.in/a', quote: 'q', verified: i >= bad, reason: 'quote not on page' }));

test('assess publishes only when every check passes', () => {
  assert.equal(assess({ article: { content: 'x' }, validation: okValidation, detector: clean, sourceChecks: src, claimChecks: claims(6) }).publishable, true);
  const unverified = assess({ article: {}, validation: okValidation, detector: clean, sourceChecks: src, claimChecks: claims(6, 1) }, true);
  assert.equal(unverified.publishable, false, 'one unverified claim blocks publishing, even on the last attempt');
  assert.ok(unverified.problems.some((p) => /not found on its source/.test(p)));
  const high = assess({ article: {}, validation: okValidation, detector: { findings: [{ severity: 'high', rule: 'chatter', line: 1, detail: 'x' }], high: 1, medium: 0, low: 0 }, sourceChecks: src, claimChecks: claims(6) }, true);
  assert.equal(high.publishable, false, 'high style findings are never accepted');
  const twoMedium = { findings: [], high: 0, medium: 2, low: 0 };
  assert.equal(assess({ article: {}, validation: okValidation, detector: twoMedium, sourceChecks: src, claimChecks: claims(6) }, false).publishable, false);
  assert.equal(assess({ article: {}, validation: okValidation, detector: twoMedium, sourceChecks: src, claimChecks: claims(6) }, true).publishable, true, 'two medium findings tolerated on the final attempt');
  const dead = assess({ article: {}, validation: okValidation, detector: clean, sourceChecks: [{ ...src[0], reachable: false, status: '404' }, src[1]], claimChecks: claims(6) });
  assert.equal(dead.publishable, false);
  const newsOnly = assess({ article: {}, validation: okValidation, detector: clean, sourceChecks: src, claimChecks: claims(6).map((c) => ({ ...c, source_url: 'https://www.livemint.com/b' })) });
  assert.equal(newsOnly.publishable, false, 'needs two facts confirmed on an official page');
  const invalid = assess({ article: {}, validation: { ok: false, errors: ['metaTitle too long'] }, detector: clean, sourceChecks: src, claimChecks: claims(6) });
  assert.equal(invalid.publishable, false);
  assert.ok(invalid.problems[0].includes('metaTitle'));
});
