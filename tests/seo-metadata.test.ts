/**
 * Length-aware metadata builders — pure logic tests (no DB, no network).
 * Run: npx ts-node --project tsconfig.scripts.json tests/seo-metadata.test.ts
 *
 * Guards the two limits Google actually enforces: ~60 chars for a title and
 * ~155 for a meta description. The templates these replaced put 242 of 312
 * scheme titles over 60 (max 108) and hard-truncated 253 descriptions
 * mid-sentence, cutting the call to action off entirely.
 */

import {
  buildRecordTitle,
  buildRecordDescription,
  TITLE_LIMIT,
  DESCRIPTION_LIMIT,
} from '../src/lib/seo';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

// Real names taken from the schemes table, shortest and longest in the family.
const SHORT = 'Annapurna Scheme';                                                  // 16
const MEDIUM = 'Aswasakiranam Scheme (Kerala)';                                    // 29
const LONG = 'Credit Guarantee Fund for Micro and Small Enterprises (CGTMSE)';     // 62
const LONGEST = 'National Pension Scheme for Traders and Self-Employed (Laghu Vyapari Maandhan)'; // 78

test('buildRecordTitle: richest suffix that fits is chosen', () => {
  assert(buildRecordTitle(SHORT) === 'Annapurna Scheme 2026: Eligibility & Benefits',
    `short name gets the full benefits suffix (got "${buildRecordTitle(SHORT)}")`);
  assert(buildRecordTitle(MEDIUM) === 'Aswasakiranam Scheme (Kerala) 2026: Eligibility & Benefits',
    `29-char name still fits the benefits suffix (got "${buildRecordTitle(MEDIUM)}")`);
});

test('buildRecordTitle: never exceeds the limit unless the name alone does', () => {
  for (const n of [SHORT, MEDIUM, LONG, LONGEST]) {
    const t = buildRecordTitle(n);
    const ok = t.length <= TITLE_LIMIT || t === n;
    assert(ok, `"${n.slice(0, 30)}..." -> ${t.length} chars, within limit or bare name`);
  }
});

test('buildRecordTitle: falls back to the bare name rather than clipping it', () => {
  assert(buildRecordTitle(LONGEST) === LONGEST, 'a 78-char name is returned intact, not truncated');
  assert(buildRecordTitle(LONG) === LONG, 'a 62-char name is returned intact');
});

test('buildRecordTitle: only claims Apply Online when the record supports it', () => {
  const withApply = buildRecordTitle(SHORT, { canApplyOnline: true });
  const without = buildRecordTitle(SHORT, { canApplyOnline: false });
  assert(withApply.includes('Apply Online'), `canApplyOnline true includes the claim (got "${withApply}")`);
  assert(!without.includes('Apply Online'), 'canApplyOnline false never claims it');
  assert(withApply.length <= TITLE_LIMIT, `apply variant still fits (${withApply.length})`);
});

test('buildRecordTitle: a long name never gains a false Apply Online claim', () => {
  const t = buildRecordTitle(LONGEST, { canApplyOnline: true });
  assert(!t.includes('Apply Online'), 'no room for the suffix, so no claim is made');
});

test('buildRecordDescription: CTA appended only when it fits entirely', () => {
  const short = buildRecordDescription('Monthly pension for persons with disability in West Bengal.', 'Manabik');
  assert(short.endsWith('Check who qualifies and how to apply.'), `CTA present (got "${short}")`);
  assert(short.length <= DESCRIPTION_LIMIT, `within limit (${short.length})`);
});

test('buildRecordDescription: CTA is all-or-nothing, never half-cut', () => {
  const nearLimit = 'x'.repeat(130); // 130 + 37 CTA = 167 > 155
  const d = buildRecordDescription(nearLimit, 'Scheme');
  assert(d === nearLimit, 'summary kept whole and CTA dropped entirely rather than clipped');
  assert(!d.includes('Check who'), 'no partial CTA fragment');
});

test('buildRecordDescription: never exceeds the limit', () => {
  for (const len of [45, 76, 118, 132, 155, 200, 400]) {
    const d = buildRecordDescription('y'.repeat(len), 'Scheme');
    assert(d.length <= DESCRIPTION_LIMIT, `summary of ${len} -> description ${d.length} chars`);
  }
});

test('buildRecordDescription: over-long summary is ellipsised, not silently cut', () => {
  const d = buildRecordDescription('z'.repeat(400), 'Scheme');
  assert(d.endsWith('...'), 'ends with an ellipsis so truncation is visible');
  assert(d.length === DESCRIPTION_LIMIT, `exactly at the limit (${d.length})`);
});

test('buildRecordDescription: null or blank summary falls back to the name', () => {
  assert(buildRecordDescription(null, 'Palanhar Yojana').startsWith('Palanhar Yojana'),
    'null summary uses the record name');
  assert(buildRecordDescription('   ', 'Palanhar Yojana').startsWith('Palanhar Yojana'),
    'whitespace-only summary uses the record name');
});

test('buildRecordDescription: collapses stray whitespace from database text', () => {
  const d = buildRecordDescription('Monthly   pension\n\nfor  farmers.', 'Scheme');
  assert(!/\s{2,}/.test(d), `no double spaces or newlines remain (got "${d}")`);
});

console.log(`\n================================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
