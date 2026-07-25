/**
 * Sitemap lastmod tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/sitemap-dates.test.ts
 *
 * Guards both failure modes: a page that changed but claims it did not, and a
 * sitemap that bumps every date on every deploy until Google ignores the field.
 */

import { resolveLastModified, TEMPLATE_UPDATED } from '../src/lib/sitemap-dates';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); }
  else { failed++; console.error(`  FAIL ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

const TEMPLATE = '2026-07-26';
const NOW = new Date('2026-07-27T00:00:00.000Z').getTime();
const day = (iso: string) => iso.slice(0, 10);

test('a record older than the template reports the template date', () => {
  const out = resolveLastModified('2026-07-20T23:35:47.095Z', TEMPLATE, NOW);
  assert(day(out) === '2026-07-26', `got ${day(out)}, the page changed even though the row did not`);
});

test('a record newer than the template keeps its own date', () => {
  const out = resolveLastModified('2026-07-26T18:00:00.000Z', TEMPLATE, NOW);
  assert(out === '2026-07-26T18:00:00.000Z', `got ${out}, real data freshness is not thrown away`);
});

test('a missing or unusable timestamp falls back to the template date', () => {
  for (const v of [null, undefined, '', 'not a date']) {
    const out = resolveLastModified(v as string | null, TEMPLATE, NOW);
    assert(day(out) === '2026-07-26', `${JSON.stringify(v) ?? 'undefined'} gives the template date`);
  }
});

test('Date objects work as well as strings, since pg returns both', () => {
  const out = resolveLastModified(new Date('2026-07-26T12:00:00.000Z'), TEMPLATE, NOW);
  assert(out === '2026-07-26T12:00:00.000Z', `got ${out}`);
});

test('a future timestamp is clamped to now, never advertised', () => {
  const out = resolveLastModified('2027-01-01T00:00:00.000Z', TEMPLATE, NOW);
  assert(new Date(out).getTime() === NOW, `clamped to now (got ${out})`);
});

test('the result is always a valid ISO instant', () => {
  for (const v of [null, '2026-07-20', new Date('2026-07-26'), 'rubbish']) {
    const out = resolveLastModified(v as string | Date | null, TEMPLATE, NOW);
    assert(!Number.isNaN(new Date(out).getTime()) && out.endsWith('Z'), `${String(v)} yields a valid ISO instant`);
  }
});

test('the shipped template date is a real date and not in the future of itself', () => {
  const t = new Date(TEMPLATE_UPDATED).getTime();
  assert(!Number.isNaN(t), `TEMPLATE_UPDATED parses (${TEMPLATE_UPDATED})`);
  assert(TEMPLATE_UPDATED.length === 10, 'it is a plain date, so it stays stable between deploys');
});

console.log(`\n================================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
