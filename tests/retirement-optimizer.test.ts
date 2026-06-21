/**
 * Retirement Corpus & Withdrawal Optimizer — test suite (24 cases)
 * Run: npx ts-node --project tsconfig.scripts.json tests/retirement-optimizer.test.ts
 *
 * Coverage:
 *  - Deterministic engine == closed-form FV / growing-annuity (to the rupee)
 *  - Monte Carlo MEAN converges to the deterministic value
 *  - Success probability monotonic in SIP (common random numbers)
 *  - Inverse solvers (required SIP / required corpus) correctness
 *  - Edge cases: FIRE, zero/negative real return, already-sufficient, age 100, post-retirement income
 *  - Glide-path monotonicity, intra-year SIP factor, percentile helper
 */

import {
  type RetirementInputs,
  DEFAULT_INPUTS,
  runSimulation,
  analyzeRetirement,
  deterministicCorpusAtRetirement,
  closedFormAccumulation,
  closedFormRequiredCorpus,
  solveRequiredSIP,
  solveRequiredCorpus,
  equityFractionAtAge,
  monthlySipYearFactor,
  fixedReturnFutureValue,
  annualExpenseAtAge,
  percentile,
} from '../src/lib/retirement-optimizer';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}

function approx(a: number, b: number, relTol: number): boolean {
  if (b === 0) return Math.abs(a) < relTol;
  return Math.abs(a - b) / Math.abs(b) <= relTol;
}

function test(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

/** Build inputs with all volatility set to zero and a single constant return R (deterministic). */
function deterministicInputs(R: number, over: Partial<RetirementInputs> = {}): RetirementInputs {
  return {
    ...DEFAULT_INPUTS,
    equityReturnPct: R, equityVolPct: 0,
    debtReturnPct: R, debtVolPct: 0,
    goldReturnPct: R, goldVolPct: 0,
    glidePath: 'none',
    annualStepUpPct: 0,
    includeEPF: false,
    includeNPS: false,
    ...over,
  };
}

// ---------------------------------------------------------------------------

test('1. monthlySipYearFactor: r=0 gives 12; r=12% near 12.77 (annuity-due)', () => {
  assert(monthlySipYearFactor(0) === 12, 'factor at r=0 is exactly 12');
  const f = monthlySipYearFactor(0.12);
  assert(f > 12.7 && f < 12.85, `factor at 12% (${f.toFixed(4)}) ~ 12.77`);
});

test('2. closedFormAccumulation: 10k/mo, 12%, 30yr ~ Rs 3.08 crore (known SIP answer)', () => {
  const fv = closedFormAccumulation(0, 10000, 12, 0, 30);
  assert(approx(fv, 30800000, 0.01), `FV (${Math.round(fv)}) within 1% of 3.08 cr`);
});

test('3. Deterministic engine == closed-form accumulation (no step-up)', () => {
  const inp = deterministicInputs(11, { currentCorpus: 500000, monthlySIP: 20000, startEquityPct: 100 });
  const engine = deterministicCorpusAtRetirement(inp);
  const closed = closedFormAccumulation(500000, 20000, 11, 0, 30);
  assert(approx(engine, closed, 1e-6), `engine ${Math.round(engine)} == closed ${Math.round(closed)}`);
});

test('4. Deterministic engine == closed-form accumulation (WITH 8% step-up)', () => {
  const inp = deterministicInputs(12, { currentCorpus: 0, monthlySIP: 10000, startEquityPct: 100, annualStepUpPct: 8 });
  const engine = deterministicCorpusAtRetirement(inp);
  const closed = closedFormAccumulation(0, 10000, 12, 8, 30);
  assert(approx(engine, closed, 1e-6), `stepped engine ${Math.round(engine)} == closed ${Math.round(closed)}`);
});

test('5. Monte Carlo MEAN of corpus-at-retirement converges to deterministic', () => {
  const inp: RetirementInputs = { ...DEFAULT_INPUTS, numSimulations: 20000, includeEPF: false, includeNPS: false };
  const sim = runSimulation(inp);
  const det = deterministicCorpusAtRetirement(inp);
  assert(approx(sim.corpusAtRetirement.mean, det, 0.06),
    `MC mean ${Math.round(sim.corpusAtRetirement.mean)} ~ deterministic ${Math.round(det)} (<=6%)`);
});

test('6. Median corpus < mean corpus (positive skew of compounded returns)', () => {
  const sim = runSimulation({ ...DEFAULT_INPUTS, numSimulations: 10000 });
  assert(sim.corpusAtRetirement.p50 < sim.corpusAtRetirement.mean,
    `median ${Math.round(sim.corpusAtRetirement.p50)} < mean ${Math.round(sim.corpusAtRetirement.mean)}`);
});

test('7. Success probability is monotonic non-decreasing in SIP', () => {
  const sips = [0, 5000, 10000, 20000, 40000, 80000];
  let prev = -1;
  let monotonic = true;
  for (const s of sips) {
    const p = runSimulation({ ...DEFAULT_INPUTS, monthlySIP: s, numSimulations: 4000 }).successProbability;
    if (p < prev - 1e-9) monotonic = false;
    prev = p;
  }
  assert(monotonic, 'success% never decreases as SIP increases');
});

test('8. Success probability is deterministic for a fixed seed (reproducible)', () => {
  const a = runSimulation({ ...DEFAULT_INPUTS, numSimulations: 5000 }).successProbability;
  const b = runSimulation({ ...DEFAULT_INPUTS, numSimulations: 5000 }).successProbability;
  assert(a === b, `repeated runs identical (${a} === ${b})`);
});

test('9. closedFormRequiredCorpus: inflation == return => W * years', () => {
  const pv = closedFormRequiredCorpus(1200000, 7, 7, 30);
  assert(approx(pv, 1200000 * 30, 1e-9), `PV (${Math.round(pv)}) == 12L*30`);
});

test('10. closedFormRequiredCorpus: 12L/yr, 0% inflation, 8% return, 30yr ~ 1.46 cr', () => {
  const pv = closedFormRequiredCorpus(1200000, 0, 8, 30);
  assert(approx(pv, 14600000, 0.02), `PV (${Math.round(pv)}) within 2% of 1.46 cr`);
});

test('11. Deterministic decumulation: starting at closed-form corpus survives, just below fails', () => {
  // Constant 7% post-return, 6% inflation, no other income, retire at 60, end 90.
  const inp = deterministicInputs(7, {
    currentAge: 60, retirementAge: 60, endAge: 90,
    currentMonthlyExpense: 100000, medicalExpenseSharePct: 0, generalInflationPct: 6,
    monthlySIP: 0, currentCorpus: 0, numSimulations: 1,
  });
  const firstWithdrawal = annualExpenseAtAge(inp, 60);
  const required = closedFormRequiredCorpus(firstWithdrawal, 6, 7, 30);
  const ok = runSimulation({ ...inp, currentCorpus: required * 1.001 });
  const fail = runSimulation({ ...inp, currentCorpus: required * 0.98 });
  assert(ok.successProbability === 1, 'corpus at (just above) closed-form PV survives to 90');
  assert(fail.successProbability === 0, 'corpus 2% below closed-form PV runs out');
});

test('12. solveRequiredSIP: achieved probability meets target', () => {
  const inp: RetirementInputs = { ...DEFAULT_INPUTS, desiredSuccessProbabilityPct: 85, currentCorpus: 500000 };
  const sol = solveRequiredSIP(inp);
  assert(sol.converged, 'solver converged');
  assert(sol.achievedProbability >= 0.85 - 0.03, `achieved ${(sol.achievedProbability * 100).toFixed(1)}% >= ~85%`);
  assert(sol.value > 0, 'required SIP positive when starting corpus is modest');
});

test('13. solveRequiredSIP: returns 0 when corpus already sufficient', () => {
  const inp: RetirementInputs = {
    ...DEFAULT_INPUTS, currentCorpus: 500000000 /* 50 cr */, monthlySIP: 0,
    desiredSuccessProbabilityPct: 90,
  };
  const sol = solveRequiredSIP(inp);
  assert(sol.value === 0, 'no SIP needed with a 50 cr head start');
  assert(sol.achievedProbability >= 0.9, 'already meets target');
});

test('14. Higher target success probability requires a higher (or equal) SIP', () => {
  const base: RetirementInputs = { ...DEFAULT_INPUTS, currentCorpus: 300000 };
  const s80 = solveRequiredSIP({ ...base, desiredSuccessProbabilityPct: 80 }).value;
  const s95 = solveRequiredSIP({ ...base, desiredSuccessProbabilityPct: 95 }).value;
  assert(s95 >= s80, `SIP for 95% (${s95}) >= SIP for 80% (${s80})`);
});

test('15. solveRequiredCorpus >= deterministic PV (sequence-risk buffer)', () => {
  const inp: RetirementInputs = { ...DEFAULT_INPUTS, currentAge: 60, retirementAge: 60, endAge: 90, desiredSuccessProbabilityPct: 90 };
  const required = solveRequiredCorpus(inp);
  const firstWithdrawal = annualExpenseAtAge(inp, 60);
  const detPv = closedFormRequiredCorpus(firstWithdrawal, inp.generalInflationPct, inp.minEquityPct / 100 * inp.equityReturnPct + (1 - inp.minEquityPct / 100) * inp.debtReturnPct, 30);
  assert(required > detPv * 0.8, `required corpus ${Math.round(required)} is in a sane range vs det PV ${Math.round(detPv)}`);
  assert(required > 0, 'required corpus positive');
});

test('16. Edge: zero real return (return == inflation) still computes, success in [0,1]', () => {
  const inp = deterministicInputs(6, { generalInflationPct: 6, medicalInflationPct: 6, medicalExpenseSharePct: 0 });
  const sim = runSimulation({ ...inp, numSimulations: 2000 });
  assert(sim.successProbability >= 0 && sim.successProbability <= 1, 'success probability in [0,1]');
  assert(Number.isFinite(sim.corpusAtRetirement.p50), 'median corpus is finite');
});

test('17. Edge: negative real return (5% return vs 8% inflation) hurts success', () => {
  const low = runSimulation({ ...DEFAULT_INPUTS, equityReturnPct: 5, debtReturnPct: 5, goldReturnPct: 5, generalInflationPct: 8, medicalInflationPct: 8, numSimulations: 3000 });
  const high = runSimulation({ ...DEFAULT_INPUTS, generalInflationPct: 8, medicalInflationPct: 8, numSimulations: 3000 });
  assert(low.successProbability <= high.successProbability, 'lower returns => lower success');
  assert(Number.isFinite(low.terminalCorpus.p50), 'no NaN with negative real returns');
});

test('18. Edge: FIRE (retire at 45, live to 90) needs more than retiring at 60', () => {
  const fire = solveRequiredSIP({ ...DEFAULT_INPUTS, retirementAge: 45, endAge: 90, currentCorpus: 1000000 });
  const normal = solveRequiredSIP({ ...DEFAULT_INPUTS, retirementAge: 60, endAge: 90, currentCorpus: 1000000 });
  assert(fire.value > normal.value, `FIRE SIP (${fire.value}) > normal SIP (${normal.value})`);
});

test('19. Edge: planning to age 100 is at least as hard as age 90', () => {
  const to90 = runSimulation({ ...DEFAULT_INPUTS, endAge: 90, numSimulations: 4000 }).successProbability;
  const to100 = runSimulation({ ...DEFAULT_INPUTS, endAge: 100, numSimulations: 4000 }).successProbability;
  assert(to100 <= to90 + 1e-9, `success to 100 (${to100}) <= success to 90 (${to90})`);
});

test('20. Post-retirement income reduces the required corpus', () => {
  const inp: RetirementInputs = { ...DEFAULT_INPUTS, currentAge: 60, retirementAge: 60, endAge: 90, desiredSuccessProbabilityPct: 90 };
  const without = solveRequiredCorpus({ ...inp, postRetirementMonthlyIncome: 0, postRetirementIncomeYears: 0 });
  const withIncome = solveRequiredCorpus({ ...inp, postRetirementMonthlyIncome: 25000, postRetirementIncomeYears: 10 });
  assert(withIncome < without, `with part-time income (${Math.round(withIncome)}) < without (${Math.round(without)})`);
});

test('21. Glide path: equity fraction is non-increasing with age', () => {
  const inp: RetirementInputs = { ...DEFAULT_INPUTS, glidePath: 'age-based-100' };
  const e30 = equityFractionAtAge(inp, 30);
  const e50 = equityFractionAtAge(inp, 50);
  const e70 = equityFractionAtAge(inp, 70);
  assert(e30 > e50 && e50 > e70, `equity de-risks: ${(e30 * 100).toFixed(0)}% > ${(e50 * 100).toFixed(0)}% > ${(e70 * 100).toFixed(0)}%`);
  assert(equityFractionAtAge(inp, 95) >= inp.minEquityPct / 100 - 1e-9, 'equity never falls below the floor');
});

test('22. Glide path custom-linear hits the floor at retirement age', () => {
  const inp: RetirementInputs = { ...DEFAULT_INPUTS, glidePath: 'custom-linear', startEquityPct: 80, minEquityPct: 30, currentAge: 30, retirementAge: 60 };
  assert(approx(equityFractionAtAge(inp, 30), 0.8, 1e-9), 'starts at 80%');
  assert(approx(equityFractionAtAge(inp, 60), 0.3, 1e-9), 'ends at 30% floor');
  assert(approx(equityFractionAtAge(inp, 45), 0.55, 1e-9), 'midpoint at 55%');
});

test('23. fixedReturnFutureValue (EPF): matches closed-form for lump + monthly', () => {
  const fv = fixedReturnFutureValue(500000, 7200, 8.25, 20);
  const closed = closedFormAccumulation(500000, 7200, 8.25, 0, 20);
  assert(approx(fv, closed, 1e-6), `EPF FV (${Math.round(fv)}) == closed form (${Math.round(closed)})`);
});

test('24. percentile helper: p0/p50/p100 on 1..101 are exact', () => {
  const arr = Array.from({ length: 101 }, (_, i) => i);
  assert(percentile(arr, 0) === 0, 'p0 = 0');
  assert(percentile(arr, 0.5) === 50, 'p50 = 50');
  assert(percentile(arr, 1) === 100, 'p100 = 100');
});

test('25. analyzeRetirement returns a coherent full bundle', () => {
  const a = analyzeRetirement({ ...DEFAULT_INPUTS, numSimulations: 3000 });
  assert(a.base.fanChart.length === DEFAULT_INPUTS.endAge - DEFAULT_INPUTS.currentAge + 1, 'fan chart spans every age');
  assert(a.requiredCorpusToday < a.requiredCorpusAtRetirement, 'today value < nominal-at-retirement value');
  assert(a.safeAnnualWithdrawalToday >= 0, 'safe withdrawal is non-negative');
  assert(a.requiredMonthlySIP.value >= 0, 'required SIP non-negative');
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
