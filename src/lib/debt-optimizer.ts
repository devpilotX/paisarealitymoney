/**
 * Multi-Loan Debt Repayment Optimizer. engine
 * =============================================
 * Given several loans and a fixed monthly budget, finds the repayment order that minimises
 * total interest AND time. and does it TAX-AWARE, ranking by the EFFECTIVE post-tax rate so a
 * deduction-heavy 9% home loan can correctly rank below a 12% personal loan.
 *
 * Strategies compared (all use the same budget and the "debt rollover" method. every spare
 * rupee, plus the freed-up minimums of cleared loans, cascades to the top-priority loan):
 *   • Avalanche . highest NOMINAL rate first (interest-optimal with no tax).
 *   • Snowball  . smallest BALANCE first (behavioural momentum).
 *   • Tax-aware . highest EFFECTIVE post-tax rate first (after-tax interest-optimal).
 *   • Minimums  . pay only the minimums (baseline, to show interest saved).
 *
 * TAX RULES (FY 2025-26 / AY 2026-27. verify before shipping; see README):
 *   • Section 24(b): home-loan interest deductible up to ₹2,00,000/yr. OLD REGIME ONLY.
 *   • Section 80E: education-loan interest fully deductible (no cap) for up to 8 years. OLD
 *     REGIME ONLY. Modelled as active over the payoff window.
 *   • Personal / car / credit-card loans: no deduction.
 *
 * Deterministic & pure. Every amortization is exact to the rupee. Not tax/financial advice.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoanType = 'home' | 'education' | 'personal' | 'car' | 'credit-card';
export type TaxRegime = 'old' | 'new';
export type StrategyKey = 'avalanche' | 'snowball' | 'tax-aware' | 'minimums';

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  balance: number;
  annualRatePct: number;
  minPayment: number;
  prepaymentPenaltyPct: number; // on extra (above-minimum) payments
}

export interface DebtInputs {
  loans: Loan[];
  monthlyBudget: number;
  taxRegime: TaxRegime;
  marginalSlabPct: number;
  targetPayoffMonths?: number; // optional: solve the budget needed to clear debt by this month
}

export interface LoanRanking {
  id: string;
  name: string;
  type: LoanType;
  balance: number;
  nominalRatePct: number;
  effectiveRatePct: number;
}

export interface StrategyResult {
  key: StrategyKey;
  label: string;
  months: number;
  totalInterest: number; // gross interest paid
  afterTaxInterest: number; // gross interest minus tax shield
  totalShield: number;
  totalPenalty: number;
  payoffOrder: string[]; // loan ids, in the order they were cleared
  perLoanPayoffMonth: Record<string, number>;
  timeline: number[]; // total outstanding balance at each month (index 0 = today)
  clearedAll: boolean;
}

export interface DebtAnalysis {
  strategies: Record<StrategyKey, StrategyResult>;
  ranking: LoanRanking[]; // tax-aware order (highest effective rate first)
  recommended: StrategyKey;
  sumMinimums: number;
  budgetShortfall: number; // > 0 if budget can't cover the minimums
  interestSavedVsMinimums: number; // recommended vs minimums (gross)
  afterTaxInterestSavedVsMinimums: number;
  monthsSavedVsMinimums: number;
  warnings: string[];
  targetBudget: number | null; // budget needed to hit targetPayoffMonths (if requested)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEC_24B_CAP = 200000;
const MAX_MONTHS = 1200; // 100-year guard
const EPS = 0.01;

const TYPE_LABEL: Record<LoanType, string> = {
  home: 'Home loan',
  education: 'Education loan',
  personal: 'Personal loan',
  car: 'Car loan',
  'credit-card': 'Credit card',
};

const STRATEGY_LABEL: Record<StrategyKey, string> = {
  avalanche: 'Avalanche (highest rate first)',
  snowball: 'Snowball (smallest balance first)',
  'tax-aware': 'Tax-aware optimal (highest effective rate first)',
  minimums: 'Minimums only',
};

function pct(x: number): number { return x / 100; }

// ---------------------------------------------------------------------------
// Per-loan monthly interest factor (credit cards compound daily)
// ---------------------------------------------------------------------------

export function monthlyInterestFactor(loan: Loan): number {
  const r = pct(loan.annualRatePct);
  if (r <= 0) return 0;
  if (loan.type === 'credit-card') {
    const daily = r / 365;
    return Math.pow(1 + daily, 365 / 12) - 1; // daily compounding, averaged to a month
  }
  return r / 12;
}

// ---------------------------------------------------------------------------
// Effective post-tax rate (for ranking & display)
// ---------------------------------------------------------------------------

/**
 * The "real" cost of a loan after Indian tax deductions, used to rank the tax-aware strategy.
 *  • home (old regime): rate × (1 − shieldFraction × marginalRate); shieldFraction = the share
 *    of this year's interest that falls under the ₹2L Section 24(b) cap (estimated at the
 *    current balance).
 *  • education (old regime): rate × (1 − marginalRate). Section 80E, full interest deductible.
 *  • everything else / new regime: the nominal rate.
 */
export function effectiveRatePct(loan: Loan, regime: TaxRegime, marginalSlabPct: number): number {
  const nominal = loan.annualRatePct;
  if (regime !== 'old' || loan.balance <= 0) return nominal;
  const m = pct(marginalSlabPct);
  if (loan.type === 'home') {
    const annualInterest = loan.balance * pct(loan.annualRatePct);
    const shieldFraction = annualInterest > 0 ? Math.min(annualInterest, SEC_24B_CAP) / annualInterest : 0;
    return nominal * (1 - shieldFraction * m);
  }
  if (loan.type === 'education') {
    return nominal * (1 - m); // 80E: full interest deductible
  }
  return nominal;
}

// ---------------------------------------------------------------------------
// Orderings
// ---------------------------------------------------------------------------

function orderFor(key: StrategyKey, loans: Loan[], regime: TaxRegime, slab: number): number[] {
  const idx = loans.map((_, i) => i);
  if (key === 'avalanche') {
    idx.sort((a, b) => {
      const la = loans[a]!; const lb = loans[b]!;
      return lb.annualRatePct - la.annualRatePct || lb.balance - la.balance;
    });
  } else if (key === 'snowball') {
    idx.sort((a, b) => (loans[a]!.balance - loans[b]!.balance) || (loans[b]!.annualRatePct - loans[a]!.annualRatePct));
  } else {
    // tax-aware
    idx.sort((a, b) => {
      const ea = effectiveRatePct(loans[a]!, regime, slab);
      const eb = effectiveRatePct(loans[b]!, regime, slab);
      return eb - ea || loans[b]!.annualRatePct - loans[a]!.annualRatePct;
    });
  }
  return idx;
}

// ---------------------------------------------------------------------------
// Core month-by-month simulation (debt rollover method)
// ---------------------------------------------------------------------------

interface SimParams {
  loans: Loan[];
  budget: number;
  order: number[];
  regime: TaxRegime;
  marginalSlabPct: number;
}

function simulate(p: SimParams): Omit<StrategyResult, 'key' | 'label'> {
  const { loans, budget, order, regime, marginalSlabPct } = p;
  const n = loans.length;
  const balances = loans.map((l) => l.balance);
  const factors = loans.map((l) => monthlyInterestFactor(l));
  const m = pct(marginalSlabPct);
  const yearInterest = new Array<number>(n).fill(0);

  let totalInterest = 0;
  let totalShield = 0;
  let totalPenalty = 0;
  const perLoanPayoffMonth: Record<string, number> = {};
  const payoffOrder: string[] = [];
  let month = 0;

  const totalBalance = (): number => balances.reduce((s, b) => s + Math.max(0, b), 0);
  const timeline: number[] = [totalBalance()];

  const recordPayoffs = (): void => {
    for (let i = 0; i < n; i++) {
      if (balances[i]! <= EPS && perLoanPayoffMonth[loans[i]!.id] === undefined) {
        perLoanPayoffMonth[loans[i]!.id] = month;
        payoffOrder.push(loans[i]!.id);
      }
    }
  };

  while (totalBalance() > EPS && month < MAX_MONTHS) {
    month++;

    // 1) Accrue interest + tax shield.
    for (let i = 0; i < n; i++) {
      if (balances[i]! <= EPS) continue;
      const interest = balances[i]! * factors[i]!;
      balances[i]! += interest;
      totalInterest += interest;

      // Shield (old regime only).
      if (regime === 'old' && m > 0) {
        const loan = loans[i]!;
        if (loan.type === 'home') {
          const before = Math.min(yearInterest[i]!, SEC_24B_CAP);
          yearInterest[i]! += interest;
          const after = Math.min(yearInterest[i]!, SEC_24B_CAP);
          totalShield += (after - before) * m;
        } else if (loan.type === 'education') {
          yearInterest[i]! += interest;
          totalShield += interest * m; // 80E: full deduction
        }
      }
    }
    if (month % 12 === 0) yearInterest.fill(0);

    // 2) Pay minimums (capped at balance and at remaining budget).
    let available = budget;
    for (let i = 0; i < n; i++) {
      if (balances[i]! <= EPS || available <= 0) continue;
      const pay = Math.min(loans[i]!.minPayment, balances[i]!, available);
      balances[i]! -= pay;
      available -= pay;
    }

    // 3) Cascade the surplus in priority order (penalty applies to extra payments).
    for (const i of order) {
      if (available <= EPS) break;
      if (balances[i]! <= EPS) continue;
      const pen = pct(loans[i]!.prepaymentPenaltyPct);
      const maxAlloc = balances[i]! / (1 - pen); // budget needed to clear, incl. penalty
      const alloc = Math.min(available, maxAlloc);
      const principalReduction = alloc * (1 - pen);
      balances[i]! -= principalReduction;
      totalPenalty += alloc * pen;
      available -= alloc;
    }

    recordPayoffs();
    timeline.push(totalBalance());
  }

  return {
    months: month,
    totalInterest,
    afterTaxInterest: totalInterest - totalShield,
    totalShield,
    totalPenalty,
    payoffOrder,
    perLoanPayoffMonth,
    timeline,
    clearedAll: totalBalance() <= EPS,
  };
}

function runStrategy(key: StrategyKey, inputs: DebtInputs, budget: number, sumMinimums: number): StrategyResult {
  // Minimums-only uses exactly the sum of minimums (no surplus); order is irrelevant.
  const effectiveBudget = key === 'minimums' ? sumMinimums : budget;
  const order = orderFor(key === 'minimums' ? 'avalanche' : key, inputs.loans, inputs.taxRegime, inputs.marginalSlabPct);
  const sim = simulate({ loans: inputs.loans, budget: effectiveBudget, order, regime: inputs.taxRegime, marginalSlabPct: inputs.marginalSlabPct });
  return { key, label: STRATEGY_LABEL[key], ...sim };
}

// ---------------------------------------------------------------------------
// Target-date budget solver (binary search; payoff months are monotone in budget)
// ---------------------------------------------------------------------------

export function solveBudgetForTarget(inputs: DebtInputs, targetMonths: number, sumMinimums: number): number | null {
  if (targetMonths <= 0) return null;
  const monthsAt = (budget: number): number => {
    const order = orderFor('tax-aware', inputs.loans, inputs.taxRegime, inputs.marginalSlabPct);
    return simulate({ loans: inputs.loans, budget, order, regime: inputs.taxRegime, marginalSlabPct: inputs.marginalSlabPct }).months;
  };
  let lo = sumMinimums;
  let hi = sumMinimums + inputs.loans.reduce((s, l) => s + l.balance, 0); // clearing everything in ~1 month
  if (monthsAt(hi) > targetMonths) return null; // even paying everything at once can't hit it (target < 1)
  if (monthsAt(lo) <= targetMonths) return Math.ceil(lo); // minimums already clear it in time
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    if (monthsAt(mid) <= targetMonths) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi);
}

// ---------------------------------------------------------------------------
// Top-level analysis
// ---------------------------------------------------------------------------

export function analyzeDebt(inputs: DebtInputs): DebtAnalysis {
  const warnings: string[] = [];
  const sumMinimums = inputs.loans.reduce((s, l) => s + (l.balance > 0 ? l.minPayment : 0), 0);
  const budgetShortfall = Math.max(0, sumMinimums - inputs.monthlyBudget);
  if (budgetShortfall > 0) {
    warnings.push(`Your budget is ₹${Math.round(budgetShortfall).toLocaleString('en-IN')} short of the total minimum payments (₹${Math.round(sumMinimums).toLocaleString('en-IN')}/month). Increase the budget. unpaid minimums let balances grow.`);
  }

  const budget = Math.max(inputs.monthlyBudget, 0);
  const strategies: Record<StrategyKey, StrategyResult> = {
    avalanche: runStrategy('avalanche', inputs, budget, sumMinimums),
    snowball: runStrategy('snowball', inputs, budget, sumMinimums),
    'tax-aware': runStrategy('tax-aware', inputs, budget, sumMinimums),
    minimums: runStrategy('minimums', inputs, budget, sumMinimums),
  };

  for (const key of ['avalanche', 'snowball', 'tax-aware'] as StrategyKey[]) {
    if (!strategies[key].clearedAll) {
      warnings.push(`The ${STRATEGY_LABEL[key]} plan does not clear all debt within ${Math.floor(MAX_MONTHS / 12)} years at this budget.`);
    }
  }

  const ranking: LoanRanking[] = inputs.loans
    .map((l) => ({
      id: l.id, name: l.name, type: l.type, balance: l.balance,
      nominalRatePct: l.annualRatePct,
      effectiveRatePct: effectiveRatePct(l, inputs.taxRegime, inputs.marginalSlabPct),
    }))
    .sort((a, b) => b.effectiveRatePct - a.effectiveRatePct);

  // Recommend the tax-aware plan (after-tax interest-optimal). If no shields are in play it
  // coincides with avalanche.
  const recommended: StrategyKey = 'tax-aware';

  const rec = strategies[recommended];
  const mins = strategies.minimums;
  const interestSavedVsMinimums = mins.clearedAll ? Math.max(0, mins.totalInterest - rec.totalInterest) : 0;
  const afterTaxInterestSavedVsMinimums = mins.clearedAll ? Math.max(0, mins.afterTaxInterest - rec.afterTaxInterest) : 0;
  const monthsSavedVsMinimums = mins.clearedAll ? Math.max(0, mins.months - rec.months) : 0;

  let targetBudget: number | null = null;
  if (inputs.targetPayoffMonths && inputs.targetPayoffMonths > 0) {
    targetBudget = solveBudgetForTarget(inputs, inputs.targetPayoffMonths, sumMinimums);
    if (targetBudget === null) {
      warnings.push(`A payoff in ${inputs.targetPayoffMonths} months is not achievable. it would require clearing more than the full balance immediately.`);
    }
  }

  return {
    strategies,
    ranking,
    recommended,
    sumMinimums,
    budgetShortfall,
    interestSavedVsMinimums,
    afterTaxInterestSavedVsMinimums,
    monthsSavedVsMinimums,
    warnings,
    targetBudget,
  };
}

// ---------------------------------------------------------------------------
// Helpers for the UI
// ---------------------------------------------------------------------------

export function loanTypeLabel(type: LoanType): string { return TYPE_LABEL[type]; }
export function strategyLabel(key: StrategyKey): string { return STRATEGY_LABEL[key]; }

let idCounter = 0;
export function newLoanId(): string { idCounter += 1; return `loan-${idCounter}-${Math.floor(Math.random() * 1e6)}`; }

export const DEFAULT_DEBT_INPUTS: DebtInputs = {
  loans: [
    { id: 'home', name: 'Home loan', type: 'home', balance: 3500000, annualRatePct: 9, minPayment: 32000, prepaymentPenaltyPct: 0 },
    { id: 'car', name: 'Car loan', type: 'car', balance: 600000, annualRatePct: 11, minPayment: 13000, prepaymentPenaltyPct: 0 },
    { id: 'card', name: 'Credit card', type: 'credit-card', balance: 150000, annualRatePct: 42, minPayment: 7500, prepaymentPenaltyPct: 0 },
  ],
  monthlyBudget: 75000,
  taxRegime: 'new',
  marginalSlabPct: 31.2,
};
