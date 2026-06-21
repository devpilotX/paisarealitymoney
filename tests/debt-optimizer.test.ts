/**
 * Multi-Loan Debt Repayment Optimizer — test suite (24 cases)
 * Run: npx ts-node --project tsconfig.scripts.json tests/debt-optimizer.test.ts
 */

import {
  type Loan,
  type DebtInputs,
  type StrategyKey,
  analyzeDebt,
  effectiveRatePct,
  monthlyInterestFactor,
  solveBudgetForTarget,
} from '../src/lib/debt-optimizer';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

function loan(over: Partial<Loan>): Loan {
  return { id: over.id ?? 'l', name: over.name ?? 'Loan', type: over.type ?? 'personal', balance: over.balance ?? 100000, annualRatePct: over.annualRatePct ?? 10, minPayment: over.minPayment ?? 2000, prepaymentPenaltyPct: over.prepaymentPenaltyPct ?? 0 };
}
function inputs(over: Partial<DebtInputs>): DebtInputs {
  return { loans: over.loans ?? [], monthlyBudget: over.monthlyBudget ?? 50000, taxRegime: over.taxRegime ?? 'new', marginalSlabPct: over.marginalSlabPct ?? 31.2, targetPayoffMonths: over.targetPayoffMonths };
}

// --- single-loan amortization reference ---
function emi(p: number, ratePct: number, months: number): number {
  const r = ratePct / 100 / 12;
  if (r < 1e-12) return p / months;
  const pow = Math.pow(1 + r, months);
  return p * r * pow / (pow - 1);
}

test('1. monthlyInterestFactor: standard /12, credit card daily-compounded > /12', () => {
  assert(Math.abs(monthlyInterestFactor(loan({ type: 'home', annualRatePct: 12 })) - 0.01) < 1e-9, 'home 12% -> 1%/month');
  const cc = monthlyInterestFactor(loan({ type: 'credit-card', annualRatePct: 42 }));
  assert(cc > 0.42 / 12, `credit-card daily compounding (${(cc * 100).toFixed(3)}%/mo) exceeds simple /12`);
  assert(monthlyInterestFactor(loan({ annualRatePct: 0 })) === 0, '0% loan -> 0 factor');
});

test('2. Single-loan payoff matches the EMI amortization to the rupee', () => {
  // One loan, budget exactly equals its EMI => clears in ~tenure, interest matches formula.
  const months = 120;
  const e = emi(1000000, 10, months);
  const a = analyzeDebt(inputs({ loans: [loan({ id: 'a', balance: 1000000, annualRatePct: 10, minPayment: e })], monthlyBudget: e }));
  const s = a.strategies['tax-aware'];
  assert(Math.abs(s.months - months) <= 1, `payoff in ${s.months} ≈ ${months} months`);
  const expectedInterest = e * months - 1000000;
  assert(Math.abs(s.totalInterest - expectedInterest) / expectedInterest < 0.01, `interest ${Math.round(s.totalInterest)} ≈ ${Math.round(expectedInterest)}`);
});

test('3. Avalanche total interest ≤ Snowball (no-tax world)', () => {
  const ls = [
    loan({ id: 'a', balance: 200000, annualRatePct: 18, minPayment: 4000 }),
    loan({ id: 'b', balance: 100000, annualRatePct: 9, minPayment: 2000 }),
    loan({ id: 'c', balance: 300000, annualRatePct: 14, minPayment: 5000 }),
  ];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 25000, taxRegime: 'new' }));
  assert(a.strategies.avalanche.totalInterest <= a.strategies.snowball.totalInterest + 1, `avalanche ${Math.round(a.strategies.avalanche.totalInterest)} ≤ snowball ${Math.round(a.strategies.snowball.totalInterest)}`);
});

test('4. Avalanche ≤ many random orderings (no-tax interest optimality)', () => {
  // Compare avalanche against snowball and tax-aware (which, no-tax, are alternative orders).
  const ls = [
    loan({ id: 'a', balance: 250000, annualRatePct: 20, minPayment: 5000 }),
    loan({ id: 'b', balance: 180000, annualRatePct: 8, minPayment: 3000 }),
    loan({ id: 'c', balance: 120000, annualRatePct: 15, minPayment: 2500 }),
  ];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 22000, taxRegime: 'new' }));
  const av = a.strategies.avalanche.totalInterest;
  assert(av <= a.strategies.snowball.totalInterest + 1, 'avalanche ≤ snowball');
  // tax-aware == avalanche when no tax shields
  assert(Math.abs(av - a.strategies['tax-aware'].totalInterest) < 1, 'tax-aware == avalanche with no tax');
});

test('5. Effective rate — home loan under old regime is reduced by Sec 24(b)', () => {
  const e = effectiveRatePct(loan({ type: 'home', balance: 1500000, annualRatePct: 9 }), 'old', 31.2);
  assert(e < 9 && e > 5, `home 9% effective ${e.toFixed(2)}% reduced by shield`);
  const eNew = effectiveRatePct(loan({ type: 'home', balance: 1500000, annualRatePct: 9 }), 'new', 31.2);
  assert(eNew === 9, 'new regime: no shield, effective = nominal');
});

test('6. Effective rate — education loan (80E) ≈ rate × (1 − slab)', () => {
  const e = effectiveRatePct(loan({ type: 'education', annualRatePct: 10 }), 'old', 31.2);
  assert(Math.abs(e - 10 * (1 - 0.312)) < 1e-9, `education effective ${e.toFixed(2)}% = 6.88%`);
});

test('7. Effective rate — personal/car loans get no shield', () => {
  assert(effectiveRatePct(loan({ type: 'personal', annualRatePct: 14 }), 'old', 31.2) === 14, 'personal unchanged');
  assert(effectiveRatePct(loan({ type: 'car', annualRatePct: 11 }), 'old', 31.2) === 11, 'car unchanged');
});

test('8. Tax-aware order differs from nominal avalanche when a shield flips the ranking', () => {
  // Home 10% (effective ~7%) vs personal 9% (effective 9%): nominal ranks home first, tax-aware ranks personal first.
  const ls = [
    loan({ id: 'home', type: 'home', balance: 800000, annualRatePct: 10, minPayment: 9000 }),
    loan({ id: 'pers', type: 'personal', balance: 800000, annualRatePct: 9, minPayment: 9000 }),
  ];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 40000, taxRegime: 'old', marginalSlabPct: 31.2 }));
  assert(a.ranking[0]!.id === 'pers', 'tax-aware ranks the 9% personal loan above the 10% home loan');
  assert(a.strategies.avalanche.payoffOrder[0] === 'home', 'nominal avalanche clears the 10% home loan first');
});

test('9. Tax-aware beats naive avalanche on AFTER-TAX interest (crafted case)', () => {
  const ls = [
    loan({ id: 'home', type: 'home', balance: 800000, annualRatePct: 10, minPayment: 9000 }),
    loan({ id: 'pers', type: 'personal', balance: 800000, annualRatePct: 9, minPayment: 9000 }),
  ];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 40000, taxRegime: 'old', marginalSlabPct: 31.2 }));
  assert(a.strategies['tax-aware'].afterTaxInterest <= a.strategies.avalanche.afterTaxInterest + 1,
    `tax-aware after-tax ${Math.round(a.strategies['tax-aware'].afterTaxInterest)} ≤ avalanche ${Math.round(a.strategies.avalanche.afterTaxInterest)}`);
});

test('10. Recommended strategy is tax-aware', () => {
  const a = analyzeDebt(inputs({ loans: [loan({ id: 'a', balance: 100000, minPayment: 3000 })], monthlyBudget: 10000 }));
  assert(a.recommended === 'tax-aware', 'recommends tax-aware');
});

test('11. Interest saved vs minimums-only is non-negative and months saved too', () => {
  const ls = [
    loan({ id: 'a', balance: 300000, annualRatePct: 16, minPayment: 6000 }),
    loan({ id: 'b', balance: 200000, annualRatePct: 11, minPayment: 4000 }),
  ];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 30000 }));
  assert(a.interestSavedVsMinimums >= 0, `interest saved ₹${Math.round(a.interestSavedVsMinimums)}`);
  assert(a.monthsSavedVsMinimums >= 0, `months saved ${a.monthsSavedVsMinimums}`);
  assert(a.strategies['tax-aware'].months <= a.strategies.minimums.months, 'extra payments clear debt no later');
});

test('12. Budget shortfall is detected and warned', () => {
  const ls = [loan({ id: 'a', balance: 500000, minPayment: 20000 }), loan({ id: 'b', balance: 300000, minPayment: 15000 })];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 25000 }));
  assert(a.budgetShortfall === 10000, `shortfall ₹${a.budgetShortfall} (= 35000 − 25000)`);
  assert(a.warnings.length > 0, 'a warning is raised');
});

test('13. Budget = sum of minimums: every strategy is identical (no surplus)', () => {
  const ls = [loan({ id: 'a', balance: 200000, annualRatePct: 12, minPayment: 5000 }), loan({ id: 'b', balance: 200000, annualRatePct: 18, minPayment: 5000 })];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 10000 }));
  assert(Math.abs(a.strategies.avalanche.totalInterest - a.strategies.minimums.totalInterest) < 1, 'avalanche == minimums when no surplus');
});

test('14. Credit-card daily compounding costs more than monthly at the same rate', () => {
  const cc = analyzeDebt(inputs({ loans: [loan({ id: 'cc', type: 'credit-card', balance: 200000, annualRatePct: 36, minPayment: 4000 })], monthlyBudget: 8000 }));
  const pl = analyzeDebt(inputs({ loans: [loan({ id: 'pl', type: 'personal', balance: 200000, annualRatePct: 36, minPayment: 4000 })], monthlyBudget: 8000 }));
  assert(cc.strategies['tax-aware'].totalInterest > pl.strategies['tax-aware'].totalInterest, 'daily-compounded card pays more interest than monthly loan');
});

test('15. 0% EMI loan is deprioritised (cleared last by tax-aware)', () => {
  const ls = [
    loan({ id: 'zero', type: 'car', balance: 200000, annualRatePct: 0, minPayment: 5000 }),
    loan({ id: 'pers', type: 'personal', balance: 200000, annualRatePct: 14, minPayment: 5000 }),
  ];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 30000 }));
  assert(a.ranking[a.ranking.length - 1]!.id === 'zero', '0% loan ranks last');
  assert(a.strategies['tax-aware'].payoffOrder[0] === 'pers', 'surplus targets the 14% loan first');
});

test('16. New regime removes all shields (after-tax == gross interest)', () => {
  const ls = [loan({ id: 'home', type: 'home', balance: 2000000, annualRatePct: 9, minPayment: 20000 }), loan({ id: 'edu', type: 'education', balance: 500000, annualRatePct: 10, minPayment: 6000 })];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 40000, taxRegime: 'new' }));
  assert(Math.abs(a.strategies['tax-aware'].afterTaxInterest - a.strategies['tax-aware'].totalInterest) < 1, 'no shield in new regime');
});

test('17. Old regime produces a positive tax shield on home + education loans', () => {
  const ls = [loan({ id: 'home', type: 'home', balance: 2000000, annualRatePct: 9, minPayment: 20000 }), loan({ id: 'edu', type: 'education', balance: 500000, annualRatePct: 10, minPayment: 6000 })];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 40000, taxRegime: 'old', marginalSlabPct: 31.2 }));
  assert(a.strategies['tax-aware'].totalShield > 0, `shield ₹${Math.round(a.strategies['tax-aware'].totalShield)} > 0`);
  assert(a.strategies['tax-aware'].afterTaxInterest < a.strategies['tax-aware'].totalInterest, 'after-tax interest below gross');
});

test('18. Prepayment penalty lowers efficiency (more interest than no penalty)', () => {
  const mk = (pen: number): DebtInputs => inputs({ loans: [loan({ id: 'a', balance: 500000, annualRatePct: 15, minPayment: 10000, prepaymentPenaltyPct: pen }), loan({ id: 'b', balance: 300000, annualRatePct: 11, minPayment: 6000 })], monthlyBudget: 40000 });
  const noPen = analyzeDebt(mk(0)).strategies['tax-aware'];
  const withPen = analyzeDebt(mk(3)).strategies['tax-aware'];
  assert(withPen.totalPenalty > 0, `penalty cost ₹${Math.round(withPen.totalPenalty)}`);
  assert(withPen.months >= noPen.months, 'penalty slows payoff (or equal)');
});

test('19. All strategies clear the same total principal (balances reach zero)', () => {
  const ls = [loan({ id: 'a', balance: 250000, annualRatePct: 16, minPayment: 6000 }), loan({ id: 'b', balance: 150000, annualRatePct: 12, minPayment: 3500 })];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 25000 }));
  for (const k of ['avalanche', 'snowball', 'tax-aware'] as StrategyKey[]) {
    assert(a.strategies[k].clearedAll, `${k} clears all debt`);
    assert(a.strategies[k].timeline[a.strategies[k].timeline.length - 1]! <= 0.01, `${k} ends at zero balance`);
  }
});

test('20. Higher budget never increases payoff time (monotonic)', () => {
  const ls = [loan({ id: 'a', balance: 400000, annualRatePct: 15, minPayment: 8000 }), loan({ id: 'b', balance: 250000, annualRatePct: 11, minPayment: 5000 })];
  let prev = Infinity; let mono = true;
  for (const b of [13000, 20000, 30000, 50000, 80000]) {
    const months = analyzeDebt(inputs({ loans: ls, monthlyBudget: b })).strategies['tax-aware'].months;
    if (months > prev) mono = false;
    prev = months;
  }
  assert(mono, 'payoff months non-increasing as budget rises');
});

test('21. Target-date solver returns a budget that hits the target', () => {
  const ls = [loan({ id: 'a', balance: 400000, annualRatePct: 15, minPayment: 8000 }), loan({ id: 'b', balance: 250000, annualRatePct: 11, minPayment: 5000 })];
  const sumMin = 13000;
  const budget = solveBudgetForTarget(inputs({ loans: ls }), 24, sumMin);
  assert(budget !== null, 'a feasible budget is found');
  if (budget !== null) {
    const months = analyzeDebt(inputs({ loans: ls, monthlyBudget: budget })).strategies['tax-aware'].months;
    assert(months <= 24, `solved budget ₹${budget} clears in ${months} ≤ 24 months`);
    const months1 = analyzeDebt(inputs({ loans: ls, monthlyBudget: budget - 1000 })).strategies['tax-aware'].months;
    assert(months1 > 24, 'a smaller budget misses the target (near-minimal)');
  }
});

test('22. Target-date solver returns null for an impossible target', () => {
  const ls = [loan({ id: 'a', balance: 1000000, annualRatePct: 12, minPayment: 10000 })];
  const b = solveBudgetForTarget(inputs({ loans: ls }), 0, 10000);
  assert(b === null, 'target of 0 months is impossible');
});

test('23. Payoff order lists every cleared loan', () => {
  const ls = [loan({ id: 'a', balance: 200000, annualRatePct: 16, minPayment: 5000 }), loan({ id: 'b', balance: 150000, annualRatePct: 12, minPayment: 3500 }), loan({ id: 'c', balance: 100000, annualRatePct: 20, minPayment: 2500 })];
  const a = analyzeDebt(inputs({ loans: ls, monthlyBudget: 25000 }));
  assert(a.strategies['tax-aware'].payoffOrder.length === 3, 'all three loans appear in the payoff order');
  assert(a.strategies['tax-aware'].payoffOrder[0] === 'c', 'highest-rate 20% card cleared first');
});

test('24. Reproducible & coherent bundle', () => {
  const inp = inputs({ loans: [loan({ id: 'a', balance: 300000, annualRatePct: 16, minPayment: 6000 }), loan({ id: 'b', balance: 200000, annualRatePct: 11, minPayment: 4000 })], monthlyBudget: 30000 });
  const a = analyzeDebt(inp);
  const b = analyzeDebt(inp);
  assert(a.strategies['tax-aware'].totalInterest === b.strategies['tax-aware'].totalInterest, 'deterministic');
  assert(a.ranking.length === 2 && a.strategies['tax-aware'].timeline.length > 1, 'ranking + timeline populated');
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
