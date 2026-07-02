/**
 * Real Return Checker — engine unit tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/real-return.test.ts
 *
 * Every expected value below is derived from closed-form math, not from the
 * engine itself, so these tests actually catch solver regressions.
 */

import {
  irr,
  npv,
  buildFlows,
  futureValueOfPayments,
  analyzeOffer,
  INFLATION_PCT,
  type CashFlow,
  type OfferInput,
} from '../src/lib/real-return';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}
function close(actual: number | null, expected: number, tol: number): boolean {
  return actual !== null && Math.abs(actual - expected) <= tol;
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

function offer(partial: Partial<OfferInput>): OfferInput {
  return {
    mode: 'lumpsum',
    lumpsumPaid: 0,
    annualPayment: 0,
    payingYears: 0,
    maturityYear: 0,
    maturityAmount: 0,
    moneybacks: [],
    ...partial,
  };
}

test('irr: two-flow closed forms', () => {
  // (121/100)^(1/2) - 1 = 10% exactly
  assert(close(irr([{ t: 0, amount: -100 }, { t: 2, amount: 121 }]), 0.10, 1e-9), 'pay 100, get 121 in 2y = 10.000%');
  // 2^(1/10) - 1 = 7.17735%
  assert(close(irr([{ t: 0, amount: -1000 }, { t: 10, amount: 2000 }]), 0.0717735, 1e-6), 'double in 10 years = 7.177%');
  // 0.8^(1/5) - 1 = -4.3648%
  assert(close(irr([{ t: 0, amount: -1000 }, { t: 5, amount: 800 }]), -0.043648, 1e-5), 'get back 80% after 5y = -4.365%');
});

test('irr: annuity-due reproduces its construction rate', () => {
  // 10 payments of 100 at t=0..9; FV at t=10 at 8% (annuity-due):
  // 100 * ((1.08^10 - 1)/0.08) * 1.08 = 1564.549
  const flows: CashFlow[] = [];
  for (let y = 0; y < 10; y++) flows.push({ t: y, amount: -100 });
  flows.push({ t: 10, amount: 1564.549 });
  assert(close(irr(flows), 0.08, 1e-5), '10x100 payments, 1564.55 at year 10 = 8.000%');
});

test('irr: degenerate inputs return null', () => {
  assert(irr([{ t: 0, amount: -100 }, { t: 5, amount: -100 }]) === null, 'all outflows -> null');
  assert(irr([{ t: 0, amount: 100 }, { t: 5, amount: 100 }]) === null, 'all inflows -> null');
  assert(irr([{ t: 0, amount: -100 }]) === null, 'single flow -> null');
});

test('irr: npv at the solved rate is ~0 for a moneyback structure', () => {
  const flows: CashFlow[] = [
    { t: 0, amount: -50000 }, { t: 1, amount: -50000 }, { t: 2, amount: -50000 },
    { t: 3, amount: -50000 }, { t: 4, amount: -50000 },
    { t: 5, amount: 60000 }, { t: 10, amount: 60000 }, { t: 15, amount: 200000 },
  ];
  const rate = irr(flows);
  assert(rate !== null, 'moneyback IRR solvable');
  assert(rate !== null && Math.abs(npv(flows, rate)) < 1e-6, 'npv(irr) ~ 0');
});

test('buildFlows: endowment structure', () => {
  const flows = buildFlows(offer({ mode: 'endowment', annualPayment: 50000, payingYears: 15, maturityYear: 20, maturityAmount: 1400000 }));
  assert(flows.length === 16, '15 payments + 1 maturity = 16 flows');
  assert(flows.filter((f) => f.amount < 0).length === 15, '15 outflows');
  assert(flows[0]?.t === 0 && flows[14]?.t === 14, 'payments at t=0..14 (start of year)');
  assert(flows[15]?.t === 20 && flows[15]?.amount === 1400000, 'maturity at t=20');
});

test('futureValueOfPayments: closed form', () => {
  // 1000 today at 7.1% for 10 years = 1000 * 1.071^10 = 1985.49
  const flows: CashFlow[] = [{ t: 0, amount: -1000 }, { t: 10, amount: 1 }];
  assert(close(futureValueOfPayments(flows, 7.1, 10), 1985.49, 0.5), '1000 at 7.1% for 10y = ~1985');
});

test('analyzeOffer: the classic endowment pitch (pay 7.5L, get 14L!)', () => {
  const a = analyzeOffer(offer({ mode: 'endowment', annualPayment: 50000, payingYears: 15, maturityYear: 20, maturityAmount: 1400000 }));
  assert(a.valid, 'valid offer');
  assert(a.totalPaid === 750000, 'total paid 7.5L');
  assert(a.totalReceived === 1400000, 'total received 14L');
  assert(close(a.multiple, 1.87, 0.01), 'multiple ~1.87x (the agent number)');
  // Hand-solved: IRR ~4.77% — an offer sold as "almost doubles your money"
  assert(a.irrPct !== null && a.irrPct > 4.5 && a.irrPct < 5.0, `real return ~4.77% (got ${a.irrPct}%)`);
  assert(a.verdict.band === 'below-inflation', 'verdict: below inflation');
  assert(a.redFlags.length > 0, 'endowment pattern produces red flags');
  const ppf = a.benchmarks.find((b) => b.name === 'PPF');
  assert(ppf !== undefined && ppf.futureValue > a.totalReceived, 'same payments in PPF beat the offer');
});

test('analyzeOffer: verdict bands', () => {
  const double6 = analyzeOffer(offer({ mode: 'lumpsum', lumpsumPaid: 100000, maturityYear: 6, maturityAmount: 200000 }));
  // 2^(1/6)-1 = 12.246%
  assert(close(double6.irrPct, 12.25, 0.05), 'double in 6y = ~12.25%');
  assert(double6.verdict.band === 'competitive', 'double in 6y: competitive band');

  const double4 = analyzeOffer(offer({ mode: 'lumpsum', lumpsumPaid: 100000, maturityYear: 4, maturityAmount: 200000 }));
  // 2^(1/4)-1 = 18.92%
  assert(double4.verdict.band === 'too-good', 'double in 4y: too-good band');
  assert(double4.redFlags.some((f) => f.includes('RBI') || f.includes('SEBI')), 'fraud-check flag present');

  const loss = analyzeOffer(offer({ mode: 'lumpsum', lumpsumPaid: 100000, maturityYear: 5, maturityAmount: 90000 }));
  assert(loss.verdict.band === 'loss', 'get back less: loss band');

  const invalid = analyzeOffer(offer({ mode: 'lumpsum', lumpsumPaid: 100000, maturityYear: 5, maturityAmount: 0 }));
  assert(!invalid.valid && invalid.verdict.band === 'invalid', 'no payout: invalid');
});

test('analyzeOffer: doubling time and buying power', () => {
  const a = analyzeOffer(offer({ mode: 'lumpsum', lumpsumPaid: 1000, maturityYear: 10, maturityAmount: 2000 }));
  // ln2 / ln(1.0717735) = 10.0000
  assert(close(a.doublingYears, 10, 0.05), 'doubling time ~10y at 7.18%');
  // 2000 / 1.06^10 = 2000 / 1.790847 = 1116.79
  assert(close(a.receivedTodayValue, 1116.79, 0.5), `2000 in 10y is ~1117 today at ${INFLATION_PCT}% inflation`);
});

test('analyzeOffer: moneyback payouts raise IRR vs same-total endowment', () => {
  const endow = analyzeOffer(offer({ mode: 'endowment', annualPayment: 50000, payingYears: 10, maturityYear: 15, maturityAmount: 900000 }));
  const mb = analyzeOffer(offer({
    mode: 'moneyback', annualPayment: 50000, payingYears: 10, maturityYear: 15, maturityAmount: 700000,
    moneybacks: [{ year: 4, amount: 100000 }, { year: 8, amount: 100000 }],
  }));
  assert(endow.irrPct !== null && mb.irrPct !== null, 'both solvable');
  assert(endow.irrPct !== null && mb.irrPct !== null && mb.irrPct > endow.irrPct, 'earlier payouts = higher IRR (same 9L total)');
});

console.log(`\n${'='.repeat(40)}\nPASSED: ${passed}  FAILED: ${failed}\n`);
if (failed > 0) process.exitCode = 1;
