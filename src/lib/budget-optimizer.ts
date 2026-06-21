/**
 * Smart Cash Flow & Budget Optimizer. engine
 * ============================================
 * A budgeting tool that goes beyond a static 50/30/20 split. It adapts the needs/wants/savings
 * mix to the user's income level and city tier, finds the surplus to redirect, flags overspending
 * against benchmarks, sizes the emergency fund, and checks goal feasibility. with a deficit plan.
 *
 * Pure, deterministic functions. After-tax income can be supplied directly or derived from CTC via
 * the shared tax engine. Nothing here is financial advice.
 */

import { newRegimeTax, oldRegimeTax, type OldDeductions } from './lifecycle-tax-optimizer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CityTier = 'metro' | 'tier2' | 'tier3';
export type JobStability = 'stable' | 'normal' | 'unstable';
export type CategoryType = 'needs' | 'wants' | 'savings';

export interface SpendCategory {
  key: string;
  label: string;
  type: CategoryType;
  amount: number; // monthly ₹
}

export interface Goal {
  name: string;
  targetAmount: number;
  currentSaved: number;
  deadlineMonths: number;
}

export interface BudgetInputs {
  monthlyAfterTaxIncome?: number;
  annualCTC?: number; // if given (and income not), derive after-tax monthly income
  taxRegime?: 'old' | 'new';
  irregularIncome?: boolean; // freelancers: use a conservative floor of income

  cityTier: CityTier;
  jobStability: JobStability;

  categories: SpendCategory[];
  emergencyFundCurrent: number;
  emergencyFundMonthsOverride?: number;

  goals: Goal[];
}

export interface OverspendFlag {
  key: string;
  label: string;
  actual: number;
  benchmark: number;
  overBy: number;
}

export interface GoalResult {
  name: string;
  requiredMonthly: number;
  monthsIfAllSurplus: number; // months to reach the goal if the entire free surplus goes to it
  feasibleWithinDeadline: boolean;
  shortfallMonthly: number; // extra ₹/month needed beyond the available surplus share
}

export interface BudgetAnalysis {
  afterTaxIncome: number;
  recommendedSplitPct: { needs: number; wants: number; savings: number };
  recommendedAmounts: { needs: number; wants: number; savings: number };
  currentTotals: { needs: number; wants: number; savings: number };
  currentSavingsRate: number; // 0..1
  recommendedSavingsRate: number;
  monthlyExpenses: number; // needs + wants (excludes savings)
  monthlySurplus: number; // income − needs − wants (capacity to save/invest)
  freeSurplus: number; // surplus not already committed to savings categories
  surplusFound: number; // ₹ freed by trimming overspend categories to benchmark
  overspendFlags: OverspendFlag[];
  emergencyFund: { recommendedMonths: number; target: number; current: number; gap: number; monthsToFill: number };
  goals: GoalResult[];
  isDeficit: boolean;
  deficitAmount: number;
  status: 'deficit' | 'tight' | 'healthy' | 'excellent';
  actionList: string[];
}

// ---------------------------------------------------------------------------
// Benchmarks (% of after-tax income)
// ---------------------------------------------------------------------------

const HOUSING_BENCHMARK: Record<CityTier, number> = { metro: 0.30, tier2: 0.25, tier3: 0.20 };

// Non-housing category benchmarks as a share of income.
const CATEGORY_BENCHMARK: Record<string, number> = {
  rent: 0, // set from city tier at runtime
  groceries: 0.10,
  utilities: 0.05,
  transport: 0.08,
  insurance: 0.04,
  emi: 0.10,
  dining: 0.06,
  entertainment: 0.04,
  shopping: 0.05,
  subscriptions: 0.02,
  misc: 0.05,
};

const EMERGENCY_MONTHS: Record<JobStability, number> = { stable: 4, normal: 6, unstable: 9 };

// ---------------------------------------------------------------------------
// After-tax income
// ---------------------------------------------------------------------------

export function deriveAfterTaxMonthlyIncome(inputs: BudgetInputs): number {
  if (inputs.monthlyAfterTaxIncome && inputs.monthlyAfterTaxIncome > 0) {
    return applyIrregularFloor(inputs.monthlyAfterTaxIncome, inputs.irregularIncome);
  }
  const ctc = inputs.annualCTC ?? 0;
  if (ctc <= 0) return 0;
  // Approximate take-home: subtract income tax (regime of choice) and a ~12% EPF on basic (40% of CTC).
  const regime = inputs.taxRegime ?? 'new';
  const epf = ctc * 0.40 * 0.12; // employee EPF
  const tax = regime === 'new'
    ? newRegimeTax(ctc, 0)
    : oldRegimeTax(ctc, 35, zeroDeductions(), 0);
  const annualTakeHome = Math.max(0, ctc - tax - epf);
  return applyIrregularFloor(annualTakeHome / 12, inputs.irregularIncome);
}

function zeroDeductions(): OldDeductions {
  return { ded80C: 150000, ded80CCD1B: 0, ded80D: 25000, hraExemption: 0, homeLoanInterest: 0, otherExemptAllowances: 0 };
}

/** Freelancers/irregular earners: budget on a conservative 85% floor of stated income. */
function applyIrregularFloor(income: number, irregular?: boolean): number {
  return irregular ? income * 0.85 : income;
}

// ---------------------------------------------------------------------------
// Adaptive needs/wants/savings split
// ---------------------------------------------------------------------------

/**
 * Adaptive split that flexes with income level and city tier, and always sums to 100%.
 *  - Higher income → lower needs %, higher savings % (essentials are a smaller share as you earn more).
 *  - Metro → a few points shifted from savings to needs (higher housing); tier-3 → the reverse.
 */
export function adaptiveSplit(monthlyIncome: number, cityTier: CityTier): { needs: number; wants: number; savings: number } {
  let needs: number; let wants: number; let savings: number;
  if (monthlyIncome < 40000) { needs = 60; wants = 25; savings = 15; }
  else if (monthlyIncome < 75000) { needs = 55; wants = 27; savings = 18; }
  else if (monthlyIncome < 150000) { needs = 50; wants = 30; savings = 20; }
  else if (monthlyIncome < 300000) { needs = 45; wants = 30; savings = 25; }
  else { needs = 40; wants = 28; savings = 32; }

  const cityShift = cityTier === 'metro' ? 5 : cityTier === 'tier3' ? -3 : 0;
  needs += cityShift;
  savings -= cityShift;

  // Clamp and renormalise to exactly 100.
  needs = Math.max(30, Math.min(70, needs));
  wants = Math.max(15, wants);
  savings = Math.max(5, savings);
  const total = needs + wants + savings;
  needs = (needs / total) * 100;
  wants = (wants / total) * 100;
  savings = 100 - needs - wants;
  return { needs, wants, savings };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sumByType(categories: SpendCategory[], type: CategoryType): number {
  return categories.filter((c) => c.type === type).reduce((s, c) => s + Math.max(0, c.amount), 0);
}

function round(n: number): number { return Math.round(n); }

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeBudget(inputs: BudgetInputs): BudgetAnalysis {
  const income = deriveAfterTaxMonthlyIncome(inputs);

  const splitPct = adaptiveSplit(income, inputs.cityTier);
  const recNeeds = round(income * splitPct.needs / 100);
  const recWants = round(income * splitPct.wants / 100);
  const recSavings = income - recNeeds - recWants; // guarantees exact sum to income

  const curNeeds = sumByType(inputs.categories, 'needs');
  const curWants = sumByType(inputs.categories, 'wants');
  const curSavings = sumByType(inputs.categories, 'savings');

  const monthlyExpenses = curNeeds + curWants;
  const monthlySurplus = income - monthlyExpenses; // capacity to save (incl. current savings categories)
  const freeSurplus = monthlySurplus - curSavings; // money not yet committed to savings

  const currentSavingsRate = income > 0 ? Math.max(0, monthlySurplus) / income : 0;
  const recommendedSavingsRate = splitPct.savings / 100;

  // Overspend flags vs benchmark (housing benchmark from city tier).
  const overspendFlags: OverspendFlag[] = [];
  let surplusFound = 0;
  for (const cat of inputs.categories) {
    if (cat.type === 'savings') continue;
    const benchPct = cat.key === 'rent' ? HOUSING_BENCHMARK[inputs.cityTier] : (CATEGORY_BENCHMARK[cat.key] ?? 0.05);
    const benchmark = round(income * benchPct);
    if (cat.amount > benchmark && benchmark > 0) {
      const overBy = cat.amount - benchmark;
      overspendFlags.push({ key: cat.key, label: cat.label, actual: cat.amount, benchmark, overBy });
      surplusFound += overBy;
    }
  }
  overspendFlags.sort((a, b) => b.overBy - a.overBy);

  // Emergency fund.
  const recommendedMonths = inputs.emergencyFundMonthsOverride ?? EMERGENCY_MONTHS[inputs.jobStability];
  const efTarget = round(monthlyExpenses * recommendedMonths);
  const efGap = Math.max(0, efTarget - inputs.emergencyFundCurrent);
  const efFillCapacity = Math.max(0, monthlySurplus);
  const efMonthsToFill = efGap <= 0 ? 0 : efFillCapacity > 0 ? Math.ceil(efGap / efFillCapacity) : Infinity;

  // Goals. share the surplus left after directing it at the emergency fund first.
  const surplusForGoals = Math.max(0, monthlySurplus);
  const goals: GoalResult[] = inputs.goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentSaved);
    const requiredMonthly = g.deadlineMonths > 0 ? remaining / g.deadlineMonths : Infinity;
    const monthsIfAllSurplus = surplusForGoals > 0 ? Math.ceil(remaining / surplusForGoals) : Infinity;
    const feasibleWithinDeadline = requiredMonthly <= surplusForGoals + 1e-6;
    const shortfallMonthly = Math.max(0, requiredMonthly - surplusForGoals);
    return { name: g.name, requiredMonthly: round(requiredMonthly), monthsIfAllSurplus, feasibleWithinDeadline, shortfallMonthly: round(shortfallMonthly) };
  });

  // Deficit + status.
  const isDeficit = monthlyExpenses > income;
  const deficitAmount = isDeficit ? monthlyExpenses - income : 0;
  let status: BudgetAnalysis['status'];
  if (isDeficit) status = 'deficit';
  else if (currentSavingsRate < recommendedSavingsRate * 0.6) status = 'tight';
  else if (currentSavingsRate < recommendedSavingsRate * 1.2) status = 'healthy';
  else status = 'excellent';

  // Prioritised action list.
  const actionList = buildActionList({ isDeficit, deficitAmount, overspendFlags, efGap, efMonthsToFill, monthlySurplus, currentSavingsRate, recommendedSavingsRate, status, income });

  return {
    afterTaxIncome: income,
    recommendedSplitPct: splitPct,
    recommendedAmounts: { needs: recNeeds, wants: recWants, savings: recSavings },
    currentTotals: { needs: curNeeds, wants: curWants, savings: curSavings },
    currentSavingsRate,
    recommendedSavingsRate,
    monthlyExpenses,
    monthlySurplus,
    freeSurplus,
    surplusFound,
    overspendFlags,
    emergencyFund: { recommendedMonths, target: efTarget, current: inputs.emergencyFundCurrent, gap: efGap, monthsToFill: efMonthsToFill },
    goals,
    isDeficit,
    deficitAmount,
    status,
    actionList,
  };
}

function buildActionList(ctx: {
  isDeficit: boolean; deficitAmount: number; overspendFlags: OverspendFlag[]; efGap: number; efMonthsToFill: number;
  monthlySurplus: number; currentSavingsRate: number; recommendedSavingsRate: number; status: BudgetAnalysis['status']; income: number;
}): string[] {
  const out: string[] = [];
  const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

  if (ctx.isDeficit) {
    out.push(`You are spending ${inr(ctx.deficitAmount)} more than you earn each month. This is the first thing to fix.`);
    const top = ctx.overspendFlags[0];
    if (top) out.push(`Start with ${top.label}: it is ${inr(top.overBy)} above benchmark. trimming it closes most of the gap.`);
    out.push('Pause discretionary SIPs only after cutting wants; never borrow to invest.');
    return out;
  }

  if (ctx.overspendFlags.length > 0) {
    const top = ctx.overspendFlags.slice(0, 2).map((f) => `${f.label} (${inr(f.overBy)} over)`).join(' and ');
    out.push(`Trim your biggest overspends. ${top}. to free up cash.`);
  }
  if (ctx.efGap > 0) {
    out.push(ctx.efMonthsToFill === Infinity
      ? 'Build an emergency fund, but you have no surplus yet. cut wants first.'
      : `Fill your emergency-fund gap of ${inr(ctx.efGap)} first (~${ctx.efMonthsToFill} months at your current surplus) before locking money into long-term investments.`);
  }
  if (ctx.currentSavingsRate < ctx.recommendedSavingsRate) {
    out.push(`Push your savings rate from ${Math.round(ctx.currentSavingsRate * 100)}% toward the recommended ${Math.round(ctx.recommendedSavingsRate * 100)}% by redirecting the surplus above.`);
  }
  if (ctx.status === 'excellent') {
    out.push(`You are saving more than your target. Put the extra to work. step up SIPs, prepay high-interest debt, or invest for long-term goals.`);
  }
  if (out.length === 0) out.push('Your budget looks balanced. Keep automating savings on payday.');
  return out;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function defaultCategories(): SpendCategory[] {
  return [
    { key: 'rent', label: 'Rent / housing', type: 'needs', amount: 25000 },
    { key: 'groceries', label: 'Groceries', type: 'needs', amount: 9000 },
    { key: 'utilities', label: 'Utilities & bills', type: 'needs', amount: 4000 },
    { key: 'transport', label: 'Transport / fuel', type: 'needs', amount: 6000 },
    { key: 'emi', label: 'Loan EMIs', type: 'needs', amount: 0 },
    { key: 'insurance', label: 'Insurance premiums', type: 'needs', amount: 2500 },
    { key: 'dining', label: 'Dining out', type: 'wants', amount: 6000 },
    { key: 'entertainment', label: 'Entertainment', type: 'wants', amount: 3000 },
    { key: 'shopping', label: 'Shopping', type: 'wants', amount: 5000 },
    { key: 'subscriptions', label: 'Subscriptions', type: 'wants', amount: 1500 },
    { key: 'misc', label: 'Miscellaneous', type: 'wants', amount: 3000 },
    { key: 'sip', label: 'SIPs / investments', type: 'savings', amount: 10000 },
  ];
}

export const DEFAULT_BUDGET_INPUTS: BudgetInputs = {
  monthlyAfterTaxIncome: 90000,
  taxRegime: 'new',
  irregularIncome: false,
  cityTier: 'metro',
  jobStability: 'normal',
  categories: defaultCategories(),
  emergencyFundCurrent: 100000,
  goals: [
    { name: 'Car down payment', targetAmount: 300000, currentSaved: 50000, deadlineMonths: 18 },
    { name: 'Vacation', targetAmount: 150000, currentSaved: 20000, deadlineMonths: 12 },
  ],
};
