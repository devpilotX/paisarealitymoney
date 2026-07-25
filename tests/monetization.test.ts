/**
 * Monetization configuration audit tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/monetization.test.ts
 *
 * Pins the exact production misconfiguration found on 2026-07-26 so it cannot
 * come back unnoticed: publisher id set, both slot ids empty, Razorpay on a
 * test key. That combination served zero ads and could take no money for two
 * months without a single warning anywhere.
 */

import { monetizationStatus, formatMonetizationReport } from '../src/lib/monetization';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); }
  else { failed++; console.error(`  FAIL ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

const LIVE = 'rzp_live_abc123';
const TEST = 'rzp_test_abc123';

test('the exact production state on 2026-07-26 is reported as a problem', () => {
  const s = monetizationStatus({
    NEXT_PUBLIC_ADSENSE_PUB_ID: '6484525483464374',
    NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT: '',
    NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT: '',
    RAZORPAY_KEY_ID: TEST,
    RAZORPAY_KEY_SECRET: 'secret',
  });
  assert(s.adsense.pubIdSet, 'publisher id is detected');
  assert(s.adsense.slotsSet === 0, 'no slot ids are detected');
  assert(s.adsense.manualUnitsWork === false, 'manual ad units are reported as not working');
  assert(s.adsense.libraryLoads === true, 'the library still loads, which is what makes Auto ads possible');
  assert(s.razorpay.mode === 'test', 'Razorpay is reported as test mode');
  assert(s.issues.length === 2, `two issues are raised (got ${s.issues.length})`);
  assert(s.issues.some((i) => i.area === 'razorpay' && i.severity === 'blocker'), 'a test key is a blocker, not a warning');
  assert(s.issues.some((i) => i.area === 'adsense' && i.severity === 'warning'), 'missing slot ids are a warning');
});

test('a fully configured site raises nothing', () => {
  const s = monetizationStatus({
    NEXT_PUBLIC_ADSENSE_PUB_ID: '6484525483464374',
    NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT: '1234567890',
    NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT: '0987654321',
    RAZORPAY_KEY_ID: LIVE,
    RAZORPAY_KEY_SECRET: 'secret',
  });
  assert(s.issues.length === 0, `no issues (got ${s.issues.map((i) => i.area).join(', ')})`);
  assert(s.adsense.manualUnitsWork, 'manual units work with slot ids present');
  assert(s.razorpay.mode === 'live', 'live key is detected');
  assert(s.canEarn, 'the site can earn');
});

test('no publisher id is a blocker, and nothing can earn from ads', () => {
  const s = monetizationStatus({ RAZORPAY_KEY_ID: TEST, RAZORPAY_KEY_SECRET: 'secret' });
  assert(s.adsense.libraryLoads === false, 'the library does not load without a publisher id');
  assert(s.issues.some((i) => i.area === 'adsense' && i.severity === 'blocker'), 'missing publisher id is a blocker');
  assert(s.canEarn === false, 'with test Razorpay and no ads, nothing can earn');
});

test('whitespace-only values count as missing', () => {
  const s = monetizationStatus({
    NEXT_PUBLIC_ADSENSE_PUB_ID: '   ',
    NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT: '  ',
    RAZORPAY_KEY_ID: '  ',
    RAZORPAY_KEY_SECRET: '  ',
  });
  assert(s.adsense.pubIdSet === false, 'blank publisher id is treated as unset');
  assert(s.adsense.slotsSet === 0, 'blank slot id is treated as unset');
  assert(s.razorpay.configured === false, 'blank Razorpay keys are treated as unset');
});

test('an unrecognised Razorpay key prefix is reported as unknown, not assumed live', () => {
  const s = monetizationStatus({ RAZORPAY_KEY_ID: 'something_else', RAZORPAY_KEY_SECRET: 'secret' });
  assert(s.razorpay.mode === 'unknown', 'mode is unknown');
  assert(s.canEarn === false, 'an unknown mode is not counted as able to earn');
});

test('every issue carries an actionable fix', () => {
  const s = monetizationStatus({ RAZORPAY_KEY_ID: TEST, RAZORPAY_KEY_SECRET: 'secret' });
  assert(s.issues.every((i) => i.fix.trim().length > 20), 'each issue explains what to do about it');
});

test('the report names the problem areas', () => {
  const report = formatMonetizationReport(monetizationStatus({
    NEXT_PUBLIC_ADSENSE_PUB_ID: '6484525483464374',
    RAZORPAY_KEY_ID: TEST,
    RAZORPAY_KEY_SECRET: 'secret',
  }));
  assert(report.includes('monetization'), 'report is tagged so it can be grepped in pm2 logs');
  assert(/razorpay/i.test(report), 'report mentions Razorpay');
  assert(/adsense/i.test(report), 'report mentions AdSense');
});

console.log(`\n================================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
