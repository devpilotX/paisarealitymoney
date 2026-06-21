/**
 * Home Loan Prepay vs Invest Optimizer — test suite (26 cases)
 * Run: npx ts-node --project tsconfig.scripts.json tests/prepay-vs-invest.test.ts
 */

import {
  type PrepayInvestInputs,
  DEFAULT_INPUTS,
  computeEMI,
  buildAmortization,
  effectiveAfterTaxRate,
  capitalGainsTax,
  deterministicFutureValue,
  certaintyEquivalent,
  analyzePrepayVsInvest,
} from '../src/lib/prepay-vs-invest';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function approx(a: number, b: number, rel: number): boolean {
  if (b === 0) return Math.abs(a) < rel;
  return Math.abs(a - b) / Math.abs(b) <= rel;
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

// ---------------------------------------------------------------------------

test('1. computeEMI matches the standard formula to the rupee', () => {
  assert(Math.abs(computeEMI(5000000, 9, 240) - 44986) <= 2, `₹50L/9%/240mo EMI ≈ ₹44,986 (got ${Math.round(computeEMI(5000000, 9, 240))})`);
  assert(Math.abs(computeEMI(4000000, 9, 180) - 40572) <= 2, `₹40L/9%/180mo EMI ≈ ₹40,572 (got ${Math.round(computeEMI(4000000, 9, 180))})`);
  assert(computeEMI(1200000, 0, 12) === 100000, 'zero-rate EMI = principal/months');
});

test('2. Amortization: principal fully repaid, totalPaid = principal + interest', () => {
  const a = buildAmortization(4000000, 9, 180);
  const principalRepaid = a.yearly.reduce((s, y) => s + y.principalPaid, 0);
  assert(Math.abs(principalRepaid - 4000000) <= 2, `principal repaid ≈ ₹40L (got ${Math.round(principalRepaid)})`);
  assert(Math.abs(a.totalPaid - (4000000 + a.totalInterest)) <= 5, 'total paid = principal + total interest');
  assert(a.payoffMonths === 180, 'no-prepay payoff at full tenure');
});

test('3. Prepayment cuts both total interest and tenure', () => {
  const base = buildAmortization(4000000, 9, 180);
  const pre = buildAmortization(4000000, 9, 180, { extraMonthly: 25000 });
  assert(pre.totalInterest < base.totalInterest, `interest falls (${Math.round(pre.totalInterest)} < ${Math.round(base.totalInterest)})`);
  assert(pre.payoffMonths < 180, `tenure cut to ${pre.payoffMonths} months`);
});

test('4. Lump-sum prepay reduces total interest', () => {
  const base = buildAmortization(4000000, 9, 180);
  const lump = buildAmortization(4000000, 9, 180, { lumpSum: 1000000 });
  assert(lump.totalInterest < base.totalInterest, 'lump sum lowers interest');
  assert(lump.payoffMonths < 180, 'lump sum shortens tenure');
});

test('5. Effective rate — NEW regime has no shield (effective = nominal)', () => {
  const e = effectiveAfterTaxRate({ ...DEFAULT_INPUTS, taxRegime: 'new', annualRatePct: 9 });
  assert(!e.shieldApplies, 'shield does not apply in new regime');
  assert(e.effectiveAfterTaxRatePct === 9, 'effective == nominal 9%');
});

test('6. Effective rate — OLD regime, small loan (interest < ₹2L) ≈ rate×(1−slab)', () => {
  const e = effectiveAfterTaxRate({ ...DEFAULT_INPUTS, taxRegime: 'old', claimSec24b: true, marginalSlabPct: 31.2, outstandingPrincipal: 1000000, annualRatePct: 9, remainingTenureMonths: 180, horizonYears: 15 });
  assert(approx(e.effectiveAfterTaxRatePct, 9 * (1 - 0.312), 0.05), `effective ≈ 6.19% (got ${e.effectiveAfterTaxRatePct.toFixed(2)})`);
});

test('7. Effective rate — OLD regime, large loan (interest ≫ ₹2L) stays close to nominal', () => {
  const e = effectiveAfterTaxRate({ ...DEFAULT_INPUTS, taxRegime: 'old', claimSec24b: true, marginalSlabPct: 31.2, outstandingPrincipal: 10000000, annualRatePct: 9, remainingTenureMonths: 180, horizonYears: 15 });
  assert(e.effectiveAfterTaxRatePct > 7.8 && e.effectiveAfterTaxRatePct < 9, `effective ${e.effectiveAfterTaxRatePct.toFixed(2)}% between 7.8 and 9`);
});

test('8. CGT — equity LTCG 12.5% over ₹1.25L exemption', () => {
  assert(capitalGainsTax(300000, 'equity', 10, 31.2) === (300000 - 125000) * 0.125, 'gain ₹3L → ₹21,875 LTCG');
  assert(capitalGainsTax(100000, 'equity', 10, 31.2) === 0, 'gain below ₹1.25L → no tax');
});

test('9. CGT — debt taxed at slab; equity STCG 20% under 1 year', () => {
  assert(capitalGainsTax(300000, 'debt', 10, 30) === 90000, 'debt ₹3L gain @30% = ₹90,000');
  assert(capitalGainsTax(300000, 'equity', 0.5, 31.2) === 60000, 'equity <1yr STCG 20% = ₹60,000');
});

test('10. deterministicFutureValue matches known SIP answer (10k/mo, 12%, 30yr ≈ 3.08 cr)', () => {
  const fv = deterministicFutureValue(0, 10000, 12, 30);
  assert(approx(fv, 30800000, 0.01), `FV ${Math.round(fv)} within 1% of 3.08 cr`);
});

test('11. Invest side with volatility=0 collapses to the deterministic after-tax FV', () => {
  const inp: PrepayInvestInputs = { ...DEFAULT_INPUTS, volatilityPct: 0, numSimulations: 200, lumpSum: 500000, monthlySurplus: 20000, horizonYears: 12, vehicle: 'equity' };
  const a = analyzePrepayVsInvest(inp);
  const gross = deterministicFutureValue(500000, 20000, inp.expectedReturnPct, 12);
  const basis = 500000 + 20000 * 12 * 12;
  const net = gross - capitalGainsTax(gross - basis, 'equity', 12, inp.marginalSlabPct);
  assert(approx(a.investDistribution.p10, a.investDistribution.p90, 1e-9), 'all paths identical when vol=0');
  assert(approx(a.investDistribution.mean, net, 1e-6), `mean ${Math.round(a.investDistribution.mean)} == deterministic net ${Math.round(net)}`);
});

test('12. Probability investing beats prepaying is monotonic in expected return', () => {
  let prev = -1; let mono = true;
  for (const ret of [4, 7, 9, 12, 16, 20]) {
    const p = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, expectedReturnPct: ret, numSimulations: 4000 }).probInvestBeatsPrepay;
    if (p < prev - 1e-9) mono = false;
    prev = p;
  }
  assert(mono, 'P(invest beats prepay) never decreases as expected return rises');
});

test('13. Probability is always within [0,1]', () => {
  const a = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, numSimulations: 3000 });
  assert(a.probInvestBeatsPrepay >= 0 && a.probInvestBeatsPrepay <= 1, `P=${a.probInvestBeatsPrepay.toFixed(3)} in [0,1]`);
});

test('14. Certainty equivalent: γ=0 equals the mean (risk-neutral)', () => {
  const vals = [100, 200, 300, 400, 500];
  assert(approx(certaintyEquivalent(vals, 0), 300, 1e-9), 'CE(γ=0) = mean = 300');
});

test('15. Certainty equivalent ≤ mean for risk-averse γ (Jensen)', () => {
  const vals = [50, 100, 200, 400, 800];
  const m = vals.reduce((s, v) => s + v, 0) / vals.length;
  assert(certaintyEquivalent(vals, 2) < m, `CE(γ=2)=${certaintyEquivalent(vals, 2).toFixed(0)} < mean ${m}`);
  assert(certaintyEquivalent(vals, 1) < m, 'log-utility CE < mean');
});

test('16. Certainty equivalent is non-increasing in risk aversion', () => {
  const vals = [50, 100, 200, 400, 1600];
  const ce0 = certaintyEquivalent(vals, 0);
  const ce1 = certaintyEquivalent(vals, 1);
  const ce3 = certaintyEquivalent(vals, 3);
  assert(ce0 >= ce1 && ce1 >= ce3, `CE decreasing: ${ce0.toFixed(0)} ≥ ${ce1.toFixed(0)} ≥ ${ce3.toFixed(0)}`);
});

test('17. Breakeven return ties the deterministic invest value to the prepay value', () => {
  const inp: PrepayInvestInputs = { ...DEFAULT_INPUTS, numSimulations: 1000 };
  const a = analyzePrepayVsInvest(inp);
  const r = a.breakevenReturnPct;
  assert(r !== null, 'breakeven exists');
  if (r !== null) {
    const years = Math.round(inp.horizonYears);
    const gross = deterministicFutureValue(inp.lumpSum, inp.monthlySurplus, r, years);
    const basis = inp.lumpSum + inp.monthlySurplus * 12 * years;
    const net = gross - capitalGainsTax(gross - basis, inp.vehicle, years, inp.marginalSlabPct);
    assert(approx(net, a.prepayValue, 0.01), `net invest @breakeven ${Math.round(net)} ≈ prepay ${Math.round(a.prepayValue)}`);
  }
});

test('18. Higher loan rate raises the breakeven required return', () => {
  const lo = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, annualRatePct: 7, numSimulations: 500 }).breakevenReturnPct ?? 0;
  const hi = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, annualRatePct: 11, numSimulations: 500 }).breakevenReturnPct ?? 0;
  assert(hi > lo, `breakeven at 11% (${hi.toFixed(2)}) > at 7% (${lo.toFixed(2)})`);
});

test('19. Hybrid (risk-neutral): all-invest when the expected return clearly wins', () => {
  const a = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, riskAversion: 0, expectedReturnPct: 16, numSimulations: 3000 });
  assert(a.optimalInvestFraction >= 0.9, `f* ≈ 1 (got ${a.optimalInvestFraction})`);
});

test('20. Hybrid (risk-neutral): all-prepay when investing clearly loses', () => {
  const a = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, riskAversion: 0, expectedReturnPct: 3, annualRatePct: 9, numSimulations: 3000 });
  assert(a.optimalInvestFraction <= 0.1, `f* ≈ 0 (got ${a.optimalInvestFraction})`);
});

test('21. Hybrid: optimal invest fraction is non-increasing in risk aversion', () => {
  const f0 = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, riskAversion: 0, numSimulations: 4000 }).optimalInvestFraction;
  const f3 = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, riskAversion: 3, numSimulations: 4000 }).optimalInvestFraction;
  const f8 = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, riskAversion: 8, numSimulations: 4000 }).optimalInvestFraction;
  assert(f0 >= f3 && f3 >= f8, `f* non-increasing in γ: ${f0} ≥ ${f3} ≥ ${f8}`);
});

test('22. Reproducible for a fixed seed', () => {
  const a = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, numSimulations: 3000 }).probInvestBeatsPrepay;
  const b = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, numSimulations: 3000 }).probInvestBeatsPrepay;
  assert(a === b, `identical runs (${a} === ${b})`);
});

test('23. After-tax interest saved ≤ nominal interest saved (shield is lost on prepay)', () => {
  const oldRegime = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, taxRegime: 'old', claimSec24b: true, marginalSlabPct: 31.2, numSimulations: 500 });
  assert(oldRegime.afterTaxInterestSaved <= oldRegime.interestSaved + 1, 'after-tax saved ≤ nominal saved');
  assert(oldRegime.tenureCutMonths > 0, `tenure cut by ${oldRegime.tenureCutMonths} months`);
  const newRegime = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, taxRegime: 'new', numSimulations: 500 });
  assert(approx(newRegime.afterTaxInterestSaved, newRegime.interestSaved, 1e-6), 'no shield => after-tax saved == nominal saved');
});

test('24. Edge: surplus smaller than EMI still computes a valid result', () => {
  const a = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, monthlySurplus: 2000, numSimulations: 1000 });
  assert(Number.isFinite(a.prepayValue) && a.prepayValue > 0, 'prepay value finite & positive');
  assert(['invest', 'prepay', 'hybrid'].includes(a.verdict), `verdict is valid (${a.verdict})`);
});

test('25. Edge: prepayment penalty lowers the prepay value', () => {
  const noPen = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, prepaymentPenaltyPct: 0, numSimulations: 500 }).prepayValue;
  const withPen = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, prepaymentPenaltyPct: 2, numSimulations: 500 }).prepayValue;
  assert(withPen < noPen, `penalty reduces prepay value (${Math.round(withPen)} < ${Math.round(noPen)})`);
});

test('26. analyze() returns a coherent bundle', () => {
  const a = analyzePrepayVsInvest({ ...DEFAULT_INPUTS, numSimulations: 3000 });
  assert(a.investDistribution.p10 <= a.investDistribution.p50 && a.investDistribution.p50 <= a.investDistribution.p90, 'percentiles ordered');
  assert(a.investHistogram.length > 0, 'histogram populated');
  assert(a.optimalInvestFraction >= 0 && a.optimalInvestFraction <= 1, 'f* in [0,1]');
  assert(a.hybridCurve.length === 21, 'hybrid curve has 21 grid points');
  assert(a.emi > 0, 'EMI computed');
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
