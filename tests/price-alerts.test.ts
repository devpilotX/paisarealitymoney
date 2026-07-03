/**
 * Price alerts — pure trigger/validation logic tests (no DB, no email).
 * Run: npx ts-node --project tsconfig.scripts.json tests/price-alerts.test.ts
 */

import {
  alertShouldFire,
  isSaneTarget,
  isAlertCommodity,
  isAlertDirection,
  ALERT_LIMITS,
} from '../src/lib/price-alerts-core';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

test('alertShouldFire: below-direction (buy signal)', () => {
  assert(alertShouldFire('below', 11000, 10999.99), 'fires just under target');
  assert(alertShouldFire('below', 11000, 11000), 'fires exactly at target (inclusive)');
  assert(!alertShouldFire('below', 11000, 11000.01), 'holds just above target');
  assert(!alertShouldFire('below', 11000, 12500), 'holds well above target');
});

test('alertShouldFire: above-direction (sell signal)', () => {
  assert(alertShouldFire('above', 12000, 12000), 'fires exactly at target (inclusive)');
  assert(alertShouldFire('above', 12000, 12350.5), 'fires above target');
  assert(!alertShouldFire('above', 12000, 11999.99), 'holds just below target');
});

test('alertShouldFire: garbage inputs never fire', () => {
  assert(!alertShouldFire('below', 11000, 0), 'zero price never fires');
  assert(!alertShouldFire('below', 11000, -5), 'negative price never fires');
  assert(!alertShouldFire('below', NaN, 10000), 'NaN target never fires');
  assert(!alertShouldFire('above', 11000, NaN), 'NaN price never fires');
});

test('isSaneTarget: bounds per commodity', () => {
  assert(isSaneTarget('gold_24k', 11500), 'gold 11,500/g is sane');
  assert(isSaneTarget('gold_22k', 1000), 'gold lower bound inclusive');
  assert(!isSaneTarget('gold_24k', 999), 'gold 999/g rejected (typo guard)');
  assert(!isSaneTarget('gold_24k', 100001), 'gold above 1L/g rejected');
  assert(isSaneTarget('silver', 190), 'silver 190/g is sane');
  assert(!isSaneTarget('silver', 9), 'silver below 10 rejected');
  assert(!isSaneTarget('silver', 2001), 'silver above 2,000 rejected');
  assert(!isSaneTarget('silver', NaN), 'NaN rejected');
  assert(!isSaneTarget('gold_24k', -100), 'negative rejected');
});

test('type guards', () => {
  assert(isAlertCommodity('gold_24k') && isAlertCommodity('gold_22k') && isAlertCommodity('silver'), 'valid commodities pass');
  assert(!isAlertCommodity('platinum') && !isAlertCommodity('') && !isAlertCommodity(null), 'invalid commodities fail');
  assert(isAlertDirection('below') && isAlertDirection('above'), 'valid directions pass');
  assert(!isAlertDirection('equals') && !isAlertDirection(undefined), 'invalid directions fail');
});

test('plan limits', () => {
  assert(ALERT_LIMITS.free === 3, 'free plan: 3 active alerts');
  assert(ALERT_LIMITS.premium === 15, 'premium plan: 15 active alerts');
  assert(ALERT_LIMITS.premium > ALERT_LIMITS.free, 'premium strictly higher');
});

console.log(`\n${'='.repeat(40)}\nPASSED: ${passed}  FAILED: ${failed}\n`);
if (failed > 0) process.exitCode = 1;
