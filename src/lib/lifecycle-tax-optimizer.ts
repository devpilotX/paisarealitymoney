/**
 * Multi-Year Tax Regime & Investment Optimizer. engine
 * =====================================================
 * Projects the optimal tax regime (old vs new) and tax-saving investment plan across many future
 * years as income, rent, home loan and deductions evolve. not just a one-year comparison.
 *
 * For each year it computes tax under BOTH regimes with that year's projected income/deductions,
 * picks the cheaper (salaried can switch yearly; business income is locked to one regime), and
 * sums the NPV of lifetime tax at a chosen discount rate. It detects the crossover year where the
 * old regime starts to win and recommends a year-by-year tax-saving investment mix.
 *
 * TAX CONSTANTS. FY 2025-26 / AY 2026-27 (per-year overridable):
 *  NEW regime: slabs 0-4L 0%, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%, 20-24L 25%, >24L 30%.
 *    Standard deduction ₹75,000. Section 87A makes total income up to ₹12L tax-free. Only employer
 *    NPS 80CCD(2) allowed.
 *  OLD regime: slabs 0-2.5L 0%, 2.5-5L 5%, 5-10L 20%, >10L 30% (general; senior/super-senior vary).
 *    Standard deduction ₹50,000. 87A up to ₹5L taxable. 80C ₹1.5L, 80CCD(1B) ₹50k, 80D, HRA,
 *    home-loan interest 24(b) ₹2L (self-occupied), etc.
 *  Surcharge: 10% (>₹50L), 15% (>₹1Cr), 25% (>₹2Cr), 37% (>₹5Cr, old only. new caps at 25%).
 *    Marginal relief applied. Health & education cess 4% on (tax + surcharge).
 *
 * Pure, deterministic functions. Single-year mode matches the standalone income-tax calculator to
 * the rupee. Nothing here is tax advice.
 */

// ---------------------------------------------------------------------------
// Tax constants (overridable per year)
// ---------------------------------------------------------------------------

export interface Slab { upTo: number; rate: number }

export interface TaxConstants {
  newSlabs: Slab[];
  oldSlabsByAge: { general: Slab[]; senior: Slab[]; superSenior: Slab[] };
  newStandardDeduction: number;
  oldStandardDeduction: number;
  newRebateTaxableLimit: number; // 87A: taxable income up to this => 0 tax (new)
  oldRebateTaxableLimit: number; // 87A (old)
  cap80C: number;
  cap80CCD1B: number;
  cap80D: number;
  cap24b: number; // home loan interest, self-occupied
  cess: number; // e.g. 0.04
  surchargeBands: { threshold: number; rate: number; newRegimeCap?: boolean }[];
}

export const FY2025_26: TaxConstants = {
  newSlabs: [
    { upTo: 400000, rate: 0 }, { upTo: 800000, rate: 0.05 }, { upTo: 1200000, rate: 0.10 },
    { upTo: 1600000, rate: 0.15 }, { upTo: 2000000, rate: 0.20 }, { upTo: 2400000, rate: 0.25 },
    { upTo: Infinity, rate: 0.30 },
  ],
  oldSlabsByAge: {
    general: [{ upTo: 250000, rate: 0 }, { upTo: 500000, rate: 0.05 }, { upTo: 1000000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 }],
    senior: [{ upTo: 300000, rate: 0 }, { upTo: 500000, rate: 0.05 }, { upTo: 1000000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 }],
    superSenior: [{ upTo: 500000, rate: 0 }, { upTo: 1000000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 }],
  },
  newStandardDeduction: 75000,
  oldStandardDeduction: 50000,
  newRebateTaxableLimit: 1200000,
  oldRebateTaxableLimit: 500000,
  cap80C: 150000,
  cap80CCD1B: 50000,
  cap80D: 75000,
  cap24b: 200000,
  cess: 0.04,
  surchargeBands: [
    { threshold: 5000000, rate: 0.10 },
    { threshold: 10000000, rate: 0.15 },
    { threshold: 20000000, rate: 0.25 },
    { threshold: 50000000, rate: 0.37, newRegimeCap: true },
  ],
};

export type AgeBand = 'general' | 'senior' | 'superSenior';

function ageBand(age: number): AgeBand {
  if (age >= 80) return 'superSenior';
  if (age >= 60) return 'senior';
  return 'general';
}

// ---------------------------------------------------------------------------
// Slab tax + surcharge + cess
// ---------------------------------------------------------------------------

function slabTax(taxable: number, slabs: Slab[]): number {
  let tax = 0;
  let prev = 0;
  for (const s of slabs) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, s.upTo) - prev) * s.rate;
    prev = s.upTo;
  }
  return tax;
}

/** Surcharge rate for a given total income, capped at 25% under the new regime. */
function surchargeRate(totalIncome: number, regime: 'old' | 'new', c: TaxConstants): number {
  let rate = 0;
  for (const band of c.surchargeBands) {
    if (totalIncome > band.threshold) {
      rate = regime === 'new' ? Math.min(band.rate, 0.25) : band.rate;
    }
  }
  return rate;
}

/**
 * Tax including surcharge (with marginal relief) and cess.
 * `taxableIncome` is after deductions; `totalIncome` (gross) drives the surcharge threshold.
 */
function taxWithSurchargeAndCess(
  taxableIncome: number,
  totalIncome: number,
  slabs: Slab[],
  rebateLimit: number,
  regime: 'old' | 'new',
  c: TaxConstants,
): number {
  let base = slabTax(taxableIncome, slabs);
  if (taxableIncome <= rebateLimit) base = 0; // Section 87A
  if (base <= 0) return 0;

  const sRate = surchargeRate(totalIncome, regime, c);
  let surcharge = base * sRate;

  // Marginal relief: tax + surcharge above a threshold can't exceed base-at-threshold plus the
  // income above the threshold.
  if (sRate > 0) {
    const bands = c.surchargeBands.filter((b) => totalIncome > b.threshold);
    const lastBand = bands[bands.length - 1];
    if (lastBand) {
      const excessIncome = totalIncome - lastBand.threshold;
      // Tax at exactly the threshold (lower surcharge band).
      const lowerRate = surchargeRate(lastBand.threshold, regime, c);
      const taxAtThreshold = base * (1 + lowerRate);
      const totalBeforeRelief = base + surcharge;
      if (totalBeforeRelief - taxAtThreshold > excessIncome) {
        surcharge = Math.max(0, taxAtThreshold + excessIncome - base);
      }
    }
  }

  return Math.round((base + surcharge) * (1 + c.cess));
}

// ---------------------------------------------------------------------------
// Per-year, per-regime tax
// ---------------------------------------------------------------------------

export interface OldDeductions {
  ded80C: number;
  ded80CCD1B: number;
  ded80D: number;
  hraExemption: number;
  homeLoanInterest: number;
  otherExemptAllowances: number; // LTA etc.
}

/** New-regime tax. Only the standard deduction and employer NPS 80CCD(2) reduce income. */
export function newRegimeTax(grossIncome: number, employerNps: number, c: TaxConstants = FY2025_26): number {
  const taxable = Math.max(0, grossIncome - c.newStandardDeduction - employerNps);
  return taxWithSurchargeAndCess(taxable, taxable, c.newSlabs, c.newRebateTaxableLimit, 'new', c);
}

/** Old-regime tax with the full set of deductions (each capped). */
export function oldRegimeTax(grossIncome: number, age: number, d: OldDeductions, employerNps: number, c: TaxConstants = FY2025_26): number {
  const deductions =
    c.oldStandardDeduction +
    Math.min(d.ded80C, c.cap80C) +
    Math.min(d.ded80CCD1B, c.cap80CCD1B) +
    Math.min(d.ded80D, c.cap80D) +
    Math.min(d.homeLoanInterest, c.cap24b) +
    d.hraExemption +
    d.otherExemptAllowances +
    employerNps; // 80CCD(2) allowed in both regimes
  const taxable = Math.max(0, grossIncome - deductions);
  return taxWithSurchargeAndCess(taxable, taxable, c.oldSlabsByAge[ageBand(age)], c.oldRebateTaxableLimit, 'old', c);
}

// ---------------------------------------------------------------------------
// Multi-year inputs
// ---------------------------------------------------------------------------

export interface LifecycleInputs {
  currentAge: number;
  horizonYears: number;
  isSalaried: boolean; // business income cannot switch regimes yearly

  currentCTC: number;
  ctcGrowthPct: number;
  employerNpsPctOfCtc: number; // 80CCD(2), allowed in both regimes

  // Old-regime deduction drivers
  existing80C: number; // EPF + other committed 80C
  monthlyRent: number;
  isMetro: boolean;
  base80D: number; // health insurance premium today
  d80DStepYearOffset: number; // year when 80D jumps (e.g., parents turn senior)
  d80DAfterStep: number;
  otherExemptAllowances: number;

  // Home loan (optional)
  homeLoanAmount: number;
  homeLoanRatePct: number;
  homeLoanStartYearOffset: number; // years from now; 0 = already running, <0 = none if amount 0

  // Behaviour
  lockInAppetitePct: number; // % of available headroom willing to lock in 80C/80CCD(1B)
  discountRatePct: number;

  // Optional per-year constant overrides (index = year offset)
  constantsByYear?: Record<number, Partial<TaxConstants>>;
}

export interface YearRow {
  yearOffset: number;
  age: number;
  grossIncome: number;
  employerNps: number;
  hraExemption: number;
  homeLoanInterest: number;
  recommended80C: number;
  recommended80CCD1B: number;
  recommended80D: number;
  oldTax: number;
  newTax: number;
  chosenRegime: 'old' | 'new';
  chosenTax: number;
  postTaxIncome: number;
}

export interface StrategyNPV {
  alwaysNew: number;
  alwaysOld: number;
  optimal: number;
}

export interface LifecycleAnalysis {
  years: YearRow[];
  npv: StrategyNPV;
  nominalTotal: StrategyNPV;
  crossoverYearOffset: number | null; // first year old beats new
  crossoverAge: number | null;
  totalSavedVsWorseStaticNPV: number;
  totalSavedVsAlwaysNewNPV: number;
  recommendedFirstYearMix: { ded80C: number; ded80CCD1B: number; ded80D: number };
  switchingAllowed: boolean;
}

// ---------------------------------------------------------------------------
// Helpers: HRA exemption, home-loan interest schedule
// ---------------------------------------------------------------------------

function hraExemptionFor(ctc: number, monthlyRent: number, isMetro: boolean): number {
  if (monthlyRent <= 0) return 0;
  const basic = ctc * 0.40; // assume Basic = 40% of CTC
  const hraReceived = basic * 0.50; // assume HRA component = 50% of Basic
  const annualRent = monthlyRent * 12;
  return Math.max(0, Math.min(hraReceived, annualRent - 0.10 * basic, (isMetro ? 0.50 : 0.40) * basic));
}

/** Approximate home-loan interest in a given year (declining-balance), 20-year tenure assumed. */
function homeLoanInterestForYear(amount: number, ratePct: number, yearsSinceStart: number, tenureYears = 20): number {
  if (amount <= 0 || yearsSinceStart < 0 || yearsSinceStart >= tenureYears) return 0;
  const r = ratePct / 100 / 12;
  const n = tenureYears * 12;
  if (r <= 0) return 0;
  const emi = amount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  let balance = amount;
  let interestThisYear = 0;
  for (let m = 0; m < (yearsSinceStart + 1) * 12 && balance > 0; m++) {
    const interest = balance * r;
    const principal = emi - interest;
    if (m >= yearsSinceStart * 12) interestThisYear += interest;
    balance -= principal;
  }
  return Math.max(0, interestThisYear);
}

function mergeConstants(base: TaxConstants, override?: Partial<TaxConstants>): TaxConstants {
  if (!override) return base;
  return { ...base, ...override };
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeLifecycle(inputs: LifecycleInputs): LifecycleAnalysis {
  const years: YearRow[] = [];
  const disc = inputs.discountRatePct / 100;
  const appetite = Math.min(1, Math.max(0, inputs.lockInAppetitePct / 100));

  let npvNew = 0; let npvOld = 0; let npvOptimal = 0;
  let totNew = 0; let totOld = 0; let totOptimal = 0;
  let crossoverYearOffset: number | null = null;
  let recommendedFirstYearMix = { ded80C: 0, ded80CCD1B: 0, ded80D: 0 };

  for (let y = 0; y < inputs.horizonYears; y++) {
    const c = mergeConstants(FY2025_26, inputs.constantsByYear?.[y]);
    const age = inputs.currentAge + y;
    const grossIncome = inputs.currentCTC * Math.pow(1 + inputs.ctcGrowthPct / 100, y);
    const employerNps = grossIncome * (inputs.employerNpsPctOfCtc / 100);

    const hraExemption = hraExemptionFor(grossIncome, inputs.monthlyRent, inputs.isMetro);
    const homeLoanInterest = homeLoanInterestForYear(
      inputs.homeLoanAmount, inputs.homeLoanRatePct, y - inputs.homeLoanStartYearOffset,
    );
    const d80D = y >= inputs.d80DStepYearOffset ? inputs.d80DAfterStep : inputs.base80D;

    // Recommended discretionary deductions (only useful in the old regime). Fill the caps up to
    // the lock-in appetite. 80D is health insurance (a real expense, not locked) so it's always
    // recommended to the available amount.
    const rec80C = Math.min(c.cap80C, Math.max(inputs.existing80C, c.cap80C * appetite));
    const rec80CCD1B = Math.min(c.cap80CCD1B, c.cap80CCD1B * appetite);
    const rec80D = Math.min(c.cap80D, d80D);

    const oldDeductions: OldDeductions = {
      ded80C: rec80C, ded80CCD1B: rec80CCD1B, ded80D: rec80D,
      hraExemption, homeLoanInterest, otherExemptAllowances: inputs.otherExemptAllowances,
    };

    const oldTax = oldRegimeTax(grossIncome, age, oldDeductions, employerNps, c);
    const newTax = newRegimeTax(grossIncome, employerNps, c);

    if (crossoverYearOffset === null && oldTax < newTax) crossoverYearOffset = y;

    const chosenRegime: 'old' | 'new' = oldTax <= newTax ? 'old' : 'new';
    const chosenTax = Math.min(oldTax, newTax);
    const postTaxIncome = grossIncome - chosenTax;

    const dfactor = Math.pow(1 + disc, y);
    npvNew += newTax / dfactor;
    npvOld += oldTax / dfactor;
    npvOptimal += chosenTax / dfactor;
    totNew += newTax; totOld += oldTax; totOptimal += chosenTax;

    if (y === 0) {
      recommendedFirstYearMix = {
        ded80C: chosenRegime === 'old' ? rec80C : 0,
        ded80CCD1B: chosenRegime === 'old' ? rec80CCD1B : 0,
        ded80D: rec80D,
      };
    }

    years.push({
      yearOffset: y, age, grossIncome, employerNps, hraExemption, homeLoanInterest,
      recommended80C: chosenRegime === 'old' ? rec80C : 0,
      recommended80CCD1B: chosenRegime === 'old' ? rec80CCD1B : 0,
      recommended80D: rec80D,
      oldTax, newTax, chosenRegime, chosenTax, postTaxIncome,
    });
  }

  // Business income cannot switch yearly: choose the single better static regime for all years.
  let npv: StrategyNPV;
  let nominalTotal: StrategyNPV;
  if (inputs.isSalaried) {
    npv = { alwaysNew: npvNew, alwaysOld: npvOld, optimal: npvOptimal };
    nominalTotal = { alwaysNew: totNew, alwaysOld: totOld, optimal: totOptimal };
  } else {
    const staticOptimalNpv = Math.min(npvNew, npvOld);
    const staticOptimalTot = npvOld <= npvNew ? totOld : totNew;
    npv = { alwaysNew: npvNew, alwaysOld: npvOld, optimal: staticOptimalNpv };
    nominalTotal = { alwaysNew: totNew, alwaysOld: totOld, optimal: staticOptimalTot };
    // Rewrite chosen regime to the single static winner for clarity.
    const winner: 'old' | 'new' = npvOld <= npvNew ? 'old' : 'new';
    for (const row of years) {
      row.chosenRegime = winner;
      row.chosenTax = winner === 'old' ? row.oldTax : row.newTax;
      row.postTaxIncome = row.grossIncome - row.chosenTax;
      row.recommended80C = winner === 'old' ? row.recommended80C : 0;
      row.recommended80CCD1B = winner === 'old' ? row.recommended80CCD1B : 0;
    }
  }

  const worseStaticNpv = Math.max(npv.alwaysNew, npv.alwaysOld);
  return {
    years,
    npv,
    nominalTotal,
    crossoverYearOffset,
    crossoverAge: crossoverYearOffset === null ? null : inputs.currentAge + crossoverYearOffset,
    totalSavedVsWorseStaticNPV: Math.max(0, worseStaticNpv - npv.optimal),
    totalSavedVsAlwaysNewNPV: Math.max(0, npv.alwaysNew - npv.optimal),
    recommendedFirstYearMix,
    switchingAllowed: inputs.isSalaried,
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_LIFECYCLE_INPUTS: LifecycleInputs = {
  currentAge: 30,
  horizonYears: 30,
  isSalaried: true,
  currentCTC: 1500000,
  ctcGrowthPct: 8,
  employerNpsPctOfCtc: 0,
  existing80C: 50000,
  monthlyRent: 20000,
  isMetro: true,
  base80D: 25000,
  d80DStepYearOffset: 10,
  d80DAfterStep: 50000,
  otherExemptAllowances: 0,
  homeLoanAmount: 0,
  homeLoanRatePct: 9,
  homeLoanStartYearOffset: 3,
  lockInAppetitePct: 100,
  discountRatePct: 6,
};
