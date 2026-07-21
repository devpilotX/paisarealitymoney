/**
 * Metal drift monitor — pure logic tests (no network).
 * Run: npx ts-node --project tsconfig.scripts.json tests/price-drift.test.ts
 *
 * Fixtures copy the GoodReturns India markup shape (tags + rupee entities).
 */

import { assessDrift, parseGold24kPerGram, parseSilverPerGram } from '../src/lib/price-drift';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

test('assessDrift: within band does not flag', () => {
  const d = assessDrift('gold', 14291, 14422, 4);
  assert(d !== null, 'returns a result');
  assert(d!.driftPct === -0.9, `drift is -0.9% (got ${d!.driftPct})`);
  assert(d!.exceeds === false, '-0.9% is inside the +/-4% band');
});

test('assessDrift: breaches band positive and negative', () => {
  assert(assessDrift('gold', 105, 100, 4)!.exceeds === true, '+5% exceeds 4%');
  assert(assessDrift('silver', 95, 100, 4)!.exceeds === true, '-5% exceeds 4%');
  assert(assessDrift('gold', 103, 100, 4)!.exceeds === false, '+3% within 4%');
});

test('assessDrift: threshold boundary is inclusive (exactly 4% not flagged)', () => {
  const d = assessDrift('gold', 104, 100, 4);
  assert(d!.driftPct === 4, 'drift is exactly 4%');
  assert(d!.exceeds === false, 'exactly at threshold is not a breach');
});

test('assessDrift: rejects non-positive or non-finite inputs', () => {
  assert(assessDrift('gold', 0, 100, 4) === null, 'zero ours -> null');
  assert(assessDrift('gold', 100, 0, 4) === null, 'zero reference -> null');
  assert(assessDrift('gold', Number.NaN, 100, 4) === null, 'NaN ours -> null');
  assert(assessDrift('gold', -5, 100, 4) === null, 'negative ours -> null');
});

test('parseGold24kPerGram: parses dealer markup and entities', () => {
  const html = `<div><p>Today's gold price in India stands at <span class="rate">₹14,422</span> per gram for 24 karat gold (99.9% purity), and <b>₹13,220</b> per gram for 22 karat.</p></div>`;
  assert(parseGold24kPerGram(html) === 14422, `24k parsed as 14422 (got ${parseGold24kPerGram(html)})`);
  const entity = `<td>&#8377;14,347</td> per gram for 24 Carat gold`;
  assert(parseGold24kPerGram(entity) === 14347, 'rupee HTML entity (&#8377;) parsed');
});

test('parseGold24kPerGram: rejects garbage and out-of-range', () => {
  assert(parseGold24kPerGram('<html>maintenance</html>') === null, 'no rate on unrelated HTML');
  assert(parseGold24kPerGram('₹5 per gram for 24 karat') === null, 'absurd low value rejected (< 5000)');
  assert(parseGold24kPerGram('') === null, 'empty input -> null');
});

test('parseSilverPerGram: parses per-gram and ignores per-kg', () => {
  const html = `<p>The price of silver in India today is <span>₹235</span> per gram and ₹2,35,000 per kilogram.</p>`;
  assert(parseSilverPerGram(html) === 235, `silver parsed as 235/g (got ${parseSilverPerGram(html)})`);
  assert(parseSilverPerGram('<html>maintenance page</html>') === null, 'garbage -> null');
});

console.log(`\n${'='.repeat(40)}\nPASSED: ${passed}  FAILED: ${failed}\n`);
if (failed > 0) process.exitCode = 1;
