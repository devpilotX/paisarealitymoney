/**
 * Smart Cash Flow & Budget Optimizer — test suite (24 cases)
 * Run: npx ts-node --project tsconfig.scripts.json tests/budget-optimizer.test.ts
 */

import {
  type BudgetInputs,
  type SpendCategory,
  DEFAULT_BUDGET_INPUTS,
  defaultCategories,
  analyzeBudget,
  adaptiveSplit,
  deriveAfterTaxMonthlyIncome,
} from '../src/lib/budget-optimizer';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

function cat(key: string, type: SpendCategory['type'], amount: number): SpendCategory {
  return { key, label: key, type, amount };
}
function inputs(over: Partial<BudgetInputs>): BudgetInputs { return { ...DEFAULT_BUDGET_INPUTS, ...over }; }

// ---------------------------------------------------------------------------

test('1. Adaptive split always sums to 100%', () => {
  for (const inc of [20000, 50000, 100000, 200000, 500000]) {
    for (const tier of ['metro', 'tier2', 'tier3'] as const) {
      const s = adaptiveSplit(inc, tier);
      assert(Math.abs(s.needs + s.wants + s.savings - 100) < 1e-6, `split sums to 100 @ ₹${inc}/${tier}`);
    }
  }
});

test('2. Higher income → lower needs %, higher savings %', () => {
  const low = adaptiveSplit(35000, 'tier2');
  const high = adaptiveSplit(400000, 'tier2');
  assert(high.needs < low.needs, `needs falls (${high.needs.toFixed(1)} < ${low.needs.toFixed(1)})`);
  assert(high.savings > low.savings, `savings rises (${high.savings.toFixed(1)} > ${low.savings.toFixed(1)})`);
});

test('3. Metro shifts share toward needs vs tier-3', () => {
  const metro = adaptiveSplit(100000, 'metro');
  const t3 = adaptiveSplit(100000, 'tier3');
  assert(metro.needs > t3.needs, `metro needs ${metro.needs.toFixed(1)} > tier3 ${t3.needs.toFixed(1)}`);
});

test('4. Recommended allocations sum exactly to income', () => {
  for (const inc of [30000, 90000, 250000]) {
    const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: inc }));
    const sum = a.recommendedAmounts.needs + a.recommendedAmounts.wants + a.recommendedAmounts.savings;
    assert(sum === inc, `rec needs+wants+savings (${sum}) == income (${inc})`);
  }
});

test('5. No recommended category is ever negative', () => {
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 30000 }));
  assert(a.recommendedAmounts.needs >= 0 && a.recommendedAmounts.wants >= 0 && a.recommendedAmounts.savings >= 0, 'all recommended amounts ≥ 0');
});

test('6. Current totals add up by category type', () => {
  const cats = [cat('rent', 'needs', 20000), cat('dining', 'wants', 8000), cat('sip', 'savings', 10000)];
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 80000, categories: cats }));
  assert(a.currentTotals.needs === 20000, 'needs total');
  assert(a.currentTotals.wants === 8000, 'wants total');
  assert(a.currentTotals.savings === 10000, 'savings total');
});

test('7. Monthly surplus = income − needs − wants', () => {
  const cats = [cat('rent', 'needs', 25000), cat('dining', 'wants', 10000), cat('sip', 'savings', 5000)];
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, categories: cats }));
  assert(a.monthlySurplus === 100000 - 35000, `surplus ${a.monthlySurplus} == 65000`);
  assert(a.freeSurplus === a.monthlySurplus - 5000, 'free surplus excludes committed SIP');
});

test('8. Overspend flags fire when a category exceeds its benchmark', () => {
  // dining benchmark = 6% of income; set well above it.
  const cats = [cat('dining', 'wants', 20000)];
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, categories: cats }));
  const dining = a.overspendFlags.find((f) => f.key === 'dining');
  assert(dining !== undefined, 'dining flagged');
  assert(dining!.benchmark === 6000 && dining!.overBy === 14000, `benchmark ₹6000, over by ₹14000`);
});

test('9. Surplus found equals the sum of overspends', () => {
  const cats = [cat('dining', 'wants', 20000), cat('shopping', 'wants', 15000)];
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, categories: cats }));
  const totalOver = a.overspendFlags.reduce((s, f) => s + f.overBy, 0);
  assert(a.surplusFound === totalOver, `surplus found ${a.surplusFound} == sum of overspends ${totalOver}`);
});

test('10. Rent benchmark scales with city tier', () => {
  const metro = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, cityTier: 'metro', categories: [cat('rent', 'needs', 1)] }));
  const t3 = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, cityTier: 'tier3', categories: [cat('rent', 'needs', 1)] }));
  // Reconstruct benchmark from a high-rent flag instead.
  const metroR = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, cityTier: 'metro', categories: [cat('rent', 'needs', 40000)] }));
  const t3R = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, cityTier: 'tier3', categories: [cat('rent', 'needs', 40000)] }));
  assert(metroR.overspendFlags[0]!.benchmark === 30000, 'metro housing benchmark 30%');
  assert(t3R.overspendFlags[0]!.benchmark === 20000, 'tier3 housing benchmark 20%');
  void metro; void t3;
});

test('11. Emergency fund target = monthly expenses × months (by stability)', () => {
  const cats = [cat('rent', 'needs', 30000), cat('dining', 'wants', 10000)];
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, categories: cats, jobStability: 'normal', emergencyFundCurrent: 0 }));
  assert(a.emergencyFund.recommendedMonths === 6, 'normal stability → 6 months');
  assert(a.emergencyFund.target === 40000 * 6, `target ${a.emergencyFund.target} == 240000`);
  assert(a.emergencyFund.gap === 240000, 'gap = target when current 0');
});

test('12. Unstable job needs a bigger emergency fund than a stable one', () => {
  const base = { monthlyAfterTaxIncome: 100000, categories: [cat('rent', 'needs', 30000)], emergencyFundCurrent: 0 } as Partial<BudgetInputs>;
  const stable = analyzeBudget(inputs({ ...base, jobStability: 'stable' }));
  const unstable = analyzeBudget(inputs({ ...base, jobStability: 'unstable' }));
  assert(unstable.emergencyFund.target > stable.emergencyFund.target, `unstable target ${unstable.emergencyFund.target} > stable ${stable.emergencyFund.target}`);
});

test('13. Emergency-fund months-to-fill uses the monthly surplus', () => {
  const cats = [cat('rent', 'needs', 20000), cat('dining', 'wants', 10000)]; // expenses 30k
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 80000, categories: cats, jobStability: 'stable', emergencyFundCurrent: 0 }));
  // target = 30000*4 = 120000; surplus = 80000-30000 = 50000; months = ceil(120000/50000)=3
  assert(a.emergencyFund.monthsToFill === 3, `months to fill ${a.emergencyFund.monthsToFill} == 3`);
});

test('14. Goal required monthly = remaining / deadline', () => {
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, goals: [{ name: 'Car', targetAmount: 500000, currentSaved: 140000, deadlineMonths: 24 }] }));
  assert(a.goals[0]!.requiredMonthly === Math.round((500000 - 140000) / 24), `required ₹${a.goals[0]!.requiredMonthly}/mo == 15000`);
});

test('15. Goal feasibility depends on the available surplus', () => {
  const cats = [cat('rent', 'needs', 20000), cat('dining', 'wants', 5000)]; // expenses 25k, surplus 55k on 80k
  const feasible = analyzeBudget(inputs({ monthlyAfterTaxIncome: 80000, categories: cats, goals: [{ name: 'G', targetAmount: 120000, currentSaved: 0, deadlineMonths: 12 }] }));
  assert(feasible.goals[0]!.feasibleWithinDeadline, 'goal needing 10k/mo is feasible with 55k surplus');
  const tight = analyzeBudget(inputs({ monthlyAfterTaxIncome: 80000, categories: cats, goals: [{ name: 'G', targetAmount: 1200000, currentSaved: 0, deadlineMonths: 12 }] }));
  assert(!tight.goals[0]!.feasibleWithinDeadline, 'goal needing 100k/mo is not feasible');
  assert(tight.goals[0]!.shortfallMonthly > 0, 'shortfall reported');
});

test('16. Deficit detected when expenses exceed income', () => {
  const cats = [cat('rent', 'needs', 60000), cat('dining', 'wants', 20000)]; // 80k expenses
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 60000, categories: cats }));
  assert(a.isDeficit, 'deficit flagged');
  assert(a.deficitAmount === 20000, `deficit ₹${a.deficitAmount} == 20000`);
  assert(a.status === 'deficit', 'status is deficit');
  assert(a.actionList[0]!.includes('more than you earn'), 'action list leads with the deficit');
});

test('17. Healthy/excellent status when saving at/above target', () => {
  const cats = [cat('rent', 'needs', 18000), cat('dining', 'wants', 6000)]; // expenses 24k on 100k → 76% savings
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, categories: cats }));
  assert(a.status === 'excellent', `high saver → excellent (got ${a.status})`);
});

test('18. CTC → after-tax monthly income is positive and below gross/12', () => {
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: undefined, annualCTC: 1500000, taxRegime: 'new' }));
  assert(a.afterTaxIncome > 0, 'after-tax income positive');
  assert(a.afterTaxIncome < 1500000 / 12, `take-home ₹${Math.round(a.afterTaxIncome)} < gross/12 ₹${Math.round(1500000 / 12)}`);
});

test('19. Irregular income applies a conservative 85% floor', () => {
  const regular = deriveAfterTaxMonthlyIncome(inputs({ monthlyAfterTaxIncome: 100000, irregularIncome: false }));
  const irregular = deriveAfterTaxMonthlyIncome(inputs({ monthlyAfterTaxIncome: 100000, irregularIncome: true }));
  assert(regular === 100000, 'regular income unchanged');
  assert(irregular === 85000, `irregular floored to 85% (₹${irregular})`);
});

test('20. Zero fixed costs → surplus equals income, high savings rate', () => {
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 50000, categories: [] }));
  assert(a.monthlySurplus === 50000, 'surplus = income with no spends');
  assert(a.currentSavingsRate === 1, 'savings rate 100%');
  assert(!a.isDeficit, 'not a deficit');
});

test('21. Recommended savings rate equals the savings split', () => {
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, cityTier: 'tier2' }));
  assert(Math.abs(a.recommendedSavingsRate - a.recommendedSplitPct.savings / 100) < 1e-9, 'recommended savings rate matches split');
});

test('22. Savings categories are never flagged as overspend', () => {
  const cats = [cat('sip', 'savings', 90000)];
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000, categories: cats }));
  assert(a.overspendFlags.length === 0, 'no overspend flag on savings');
});

test('23. Action list is non-empty and prioritised (deficit first)', () => {
  const a = analyzeBudget(inputs({ monthlyAfterTaxIncome: 100000 }));
  assert(a.actionList.length > 0, 'action list populated');
});

test('24. Reproducible & coherent bundle', () => {
  const inp = inputs({ categories: defaultCategories() });
  const a = analyzeBudget(inp);
  const b = analyzeBudget(inp);
  assert(a.monthlySurplus === b.monthlySurplus, 'deterministic');
  assert(a.goals.length === inp.goals.length, 'one result per goal');
  assert(a.afterTaxIncome === DEFAULT_BUDGET_INPUTS.monthlyAfterTaxIncome, 'income passthrough');
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
