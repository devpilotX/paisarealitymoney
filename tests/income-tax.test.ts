/**
 * Income tax, secret comparison and client-IP tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/income-tax.test.ts
 *
 * Expected figures are worked by hand from the FY 2026-27 slabs (unchanged by
 * Budget 2026), including the Section 87A marginal relief just above Rs 12 lakh
 * that the calculator used to miss.
 */
import { NextRequest } from 'next/server';
import { calcNewRegimeTax, calcOldRegimeTax } from '../src/lib/income-tax';
import { secretMatches } from '../src/lib/secret-compare';
import { getClientIp } from '../src/lib/rate-limit';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); }
  else { failed++; console.error(`  FAIL ${msg}`); }
}
function eq(actual: number, expected: number, msg: string): void {
  assert(actual === expected, `${msg} (expected ${expected}, got ${actual})`);
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

test('new regime: nil tax up to Rs 12 lakh taxable', () => {
  eq(calcNewRegimeTax(0), 0, 'zero income');
  eq(calcNewRegimeTax(1275000), 0, 'gross 12.75L = taxable exactly 12L');
});

test('new regime: marginal relief just above Rs 12 lakh', () => {
  // taxable 12,05,000: slab tax 60,750, capped at 5,000 over the threshold, plus 4% cess
  eq(calcNewRegimeTax(1280000), 5200, 'gross 12.8L pays only the excess plus cess');
  // taxable 12,70,000: slab 70,500, relief cap 70,000 applies
  eq(calcNewRegimeTax(1345000), 72800, 'gross 13.45L still inside relief');
  // taxable 13,00,000: slab 75,000 is below the 1,00,000 cap, so full slab tax
  eq(calcNewRegimeTax(1375000), 78000, 'gross 13.75L past relief pays full slab tax');
});

test('new regime: upper slabs', () => {
  // taxable 24L: 20k + 40k + 60k + 80k + 1L = 3,00,000; plus cess
  eq(calcNewRegimeTax(2475000), 312000, 'taxable 24L');
  // taxable 30L: 3L + 30% of 6L = 4,80,000; plus cess
  eq(calcNewRegimeTax(3075000), 499200, 'taxable 30L');
});

test('new regime: surcharge with marginal relief at Rs 50 lakh', () => {
  // taxable 50L: 3L + 30% of 26L = 10,80,000, no surcharge
  eq(calcNewRegimeTax(5075000), 1123200, 'taxable exactly 50L, no surcharge');
  // taxable 50.1L: slab 10,83,000 * 1.10 = 11,91,300, relief caps at 10,80,000 + 10,000 = 10,90,000
  eq(calcNewRegimeTax(5085000), 1133600, 'taxable 50.1L capped by marginal relief');
});

test('old regime', () => {
  // gross 5.5L, only standard deduction 50k: taxable 5L, rebate applies
  eq(calcOldRegimeTax(550000, 0, 0, 0, 0, 'general'), 0, 'taxable 5L is nil');
  // gross 10.5L, taxable 10L: 12,500 + 1,00,000 = 1,12,500; plus cess
  eq(calcOldRegimeTax(1050000, 0, 0, 0, 0, 'general'), 117000, 'taxable 10L general');
  // senior: 10,000 + 1,00,000 = 1,10,000; plus cess
  eq(calcOldRegimeTax(1050000, 0, 0, 0, 0, 'senior'), 114400, 'taxable 10L senior');
  // 80C capped at 1.5L even when more is entered
  eq(calcOldRegimeTax(1200000, 300000, 0, 0, 0, 'general'), calcOldRegimeTax(1200000, 150000, 0, 0, 0, 'general'), '80C cap');
});

test('secretMatches', () => {
  assert(secretMatches('abc', 'abc'), 'equal strings match');
  assert(!secretMatches('abd', 'abc'), 'different strings do not match');
  assert(!secretMatches('abc', 'abcd'), 'different lengths do not match');
  assert(!secretMatches('', ''), 'empty expected fails closed');
  assert(!secretMatches('x', undefined), 'unset expected fails closed');
  assert(!secretMatches(null, 'x'), 'missing provided fails');
});

test('getClientIp ignores a forged first X-Forwarded-For hop', () => {
  const req = (h: Record<string, string>): NextRequest => new NextRequest('http://localhost/api/x', { headers: h });
  eq(Number(getClientIp(req({ 'x-real-ip': '203.0.113.9', 'x-forwarded-for': '1.2.3.4, 203.0.113.9' })) === '203.0.113.9'), 1, 'x-real-ip wins');
  eq(Number(getClientIp(req({ 'x-forwarded-for': '1.2.3.4, 198.51.100.7' })) === '198.51.100.7'), 1, 'last XFF hop, not the client-supplied first');
  eq(Number(getClientIp(req({})) === 'unknown'), 1, 'no headers gives unknown');
});

console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
