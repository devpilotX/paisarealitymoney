/**
 * Home Loan Prepay vs Invest Optimizer. engine
 * ==============================================
 * Answers "should I prepay my home loan or invest the surplus?" with a RISK-ADJUSTED,
 * after-tax, simulated comparison. not a naive "loan rate vs FD rate".
 *
 * The decision is framed around the SURPLUS (extra money beyond your normal EMI):
 *   • PREPAY side . deploying the surplus to the loan earns a GUARANTEED, risk-free,
 *     after-tax return equal to the effective loan rate (nominal rate adjusted for the
 *     Section 24(b) interest tax shield). Prepaying ₹1 of principal avoids the loan's
 *     interest on it. a well-known risk-free "return" equal to the loan rate.
 *   • INVEST side . deploying the surplus to the market earns a RISKY return, simulated
 *     with Monte Carlo, with capital-gains tax applied at the horizon.
 *
 * We compare on (1) expected net worth, (2) probability investing beats prepaying,
 * (3) risk-adjusted certainty-equivalent wealth via CRRA utility, plus the breakeven
 * required return and the optimal hybrid (part-prepay / part-invest) split.
 *
 * TAX RULES (FY 2025-26 / AY 2026-27. verify before shipping; see README):
 *   • Section 24(b): home-loan interest on a self-occupied property is deductible up to
 *     ₹2,00,000 per year. OLD REGIME ONLY. Disallowed under the new regime.
 *   • Equity LTCG (112A): 12.5% on gains above ₹1,25,000/yr (holding ≥ 12 months).
 *   • Equity STCG (111A): 20% (holding < 12 months).
 *   • Debt / debt-oriented funds (post 01-Apr-2023): taxed at the investor's slab.
 *
 * Pure functions only. Seeded RNG => reproducible. Nothing here is tax or investment advice.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaxRegime = 'old' | 'new';
export type InvestmentVehicle = 'equity' | 'debt' | 'hybrid';

export interface PrepayInvestInputs {
  // --- Loan ---
  outstandingPrincipal: number;
  annualRatePct: number;
  remainingTenureMonths: number;
  prepaymentPenaltyPct: number; // on prepaid amount (0 for floating-rate loans per RBI)

  // --- Surplus to deploy (the decision) ---
  monthlySurplus: number;
  lumpSum: number;

  // --- Tax ---
  taxRegime: TaxRegime;
  marginalSlabPct: number; // highest slab incl. cess, e.g. 31.2. used for shield & debt CGT
  claimSec24b: boolean; // self-occupied interest deduction (old regime only)

  // --- Investment alternative ---
  vehicle: InvestmentVehicle;
  expectedReturnPct: number;
  volatilityPct: number;
  horizonYears: number;

  // --- Risk preference ---
  riskAversion: number; // CRRA gamma: 0 = risk-neutral, 1 = log, higher = more averse

  // --- Simulation ---
  numSimulations?: number;
  seed?: number;
}

export interface AmortYear {
  year: number;
  interestPaid: number;
  principalPaid: number;
  prepaid: number;
  closingBalance: number;
  taxShield: number; // tax saved this year via Sec 24(b)
}

export interface AmortResult {
  emi: number;
  totalInterest: number;
  totalPaid: number;
  payoffMonths: number;
  yearly: AmortYear[];
}

export interface EffectiveRate {
  nominalRatePct: number;
  effectiveAfterTaxRatePct: number;
  avgAnnualShield: number; // average yearly tax saved via the shield, over the horizon
  shieldApplies: boolean;
}

export interface Distribution {
  mean: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
}

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
}

export interface HybridPoint {
  investFraction: number; // 0..1
  certaintyEquivalent: number;
  expectedWealth: number;
}

export interface PrepayInvestAnalysis {
  emi: number;
  amortNoPrepay: AmortResult;
  amortWithPrepay: AmortResult;
  interestSaved: number; // nominal interest avoided by prepaying the full surplus
  afterTaxInterestSaved: number; // net of lost Sec 24(b) shield
  tenureCutMonths: number;

  effectiveRate: EffectiveRate;

  prepayValue: number; // guaranteed terminal value of deploying surplus to prepay
  investDistribution: Distribution; // after-tax terminal value of investing the surplus
  investHistogram: HistogramBin[];
  probInvestBeatsPrepay: number; // 0..1

  breakevenReturnPct: number | null; // required return where invest ties prepay (null if unattainable in range)

  hybridCurve: HybridPoint[];
  optimalInvestFraction: number; // f* maximising certainty-equivalent wealth
  optimalCertaintyEquivalent: number;

  verdict: 'invest' | 'prepay' | 'hybrid';
  verdictConfidence: number; // = probInvestBeatsPrepay (or its complement for prepay)

  investedPrincipal: number; // cost basis deployed to investing the full surplus
}

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) + normal draws (Box–Muller)
// ---------------------------------------------------------------------------

interface Rng { next: () => number; nextNormal: () => number; }

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  let spare: number | null = null;
  const next = (): number => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const nextNormal = (): number => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0; let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  };
  return { next, nextNormal };
}

// ---------------------------------------------------------------------------
// Constants & small helpers
// ---------------------------------------------------------------------------

const SEC_24B_CAP = 200000; // ₹2L self-occupied interest deduction cap
const EQUITY_LTCG_EXEMPTION = 125000; // ₹1.25L/yr
const EQUITY_LTCG_RATE = 0.125;
const EQUITY_STCG_RATE = 0.20; // 111A
const MIN_ANNUAL_RETURN = -0.95;
const DEFAULT_SEED = 0x1a2b3c4d;
const DEFAULT_SIMS = 10000;

function pct(x: number): number { return x / 100; }

function mean(values: ArrayLike<number>): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < values.length; i++) s += values[i] ?? 0;
  return s / values.length;
}

export function percentile(sortedAsc: ArrayLike<number>, p: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (n === 1) return sortedAsc[0] ?? 0;
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const loV = sortedAsc[lo] ?? 0;
  const hiV = sortedAsc[hi] ?? 0;
  return lo === hi ? loV : loV + (hiV - loV) * (idx - lo);
}

/**
 * Future value at year-end of 12 start-of-month (annuity-due) ₹1 contributions, given an
 * annual return r. Lets the annual-step engine reproduce the exact monthly-SIP closed form.
 */
export function monthlySipYearFactor(r: number): number {
  if (Math.abs(r) < 1e-12) return 12;
  const i = Math.pow(1 + r, 1 / 12) - 1;
  if (Math.abs(i) < 1e-12) return 12;
  return (1 + i) * (Math.pow(1 + i, 12) - 1) / i;
}

// ---------------------------------------------------------------------------
// Amortization
// ---------------------------------------------------------------------------

/** Standard reducing-balance EMI. Matches bank EMI to the rupee. */
export function computeEMI(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = pct(annualRatePct) / 12;
  if (r < 1e-12) return principal / months;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

/**
 * Month-by-month amortization, optionally with a lump-sum prepayment at month 0 and a recurring
 * monthly extra-principal prepayment. The EMI is fixed (computed from the ORIGINAL schedule);
 * prepayments shorten the tenure. Returns yearly aggregates incl. the Sec 24(b) tax shield.
 */
export function buildAmortization(
  principal: number,
  annualRatePct: number,
  months: number,
  opts: { extraMonthly?: number; lumpSum?: number; shieldRate?: number } = {},
): AmortResult {
  const extraMonthly = Math.max(0, opts.extraMonthly ?? 0);
  const lumpSum = Math.max(0, opts.lumpSum ?? 0);
  const shieldRate = Math.max(0, opts.shieldRate ?? 0);
  const r = pct(annualRatePct) / 12;
  const emi = computeEMI(principal, annualRatePct, months);

  let balance = Math.max(0, principal - lumpSum);
  let totalInterest = 0;
  let totalPaid = lumpSum;
  let payoffMonths = balance <= 0 ? 0 : months;

  const yearly: AmortYear[] = [];
  let yInterest = 0;
  let yPrincipal = 0;
  let yPrepaid = lumpSum;

  for (let m = 1; m <= months && balance > 1e-6; m++) {
    const interest = balance * r;
    let principalComponent = emi - interest;
    if (principalComponent < 0) principalComponent = 0; // guard (EMI below interest)
    let prepay = extraMonthly;

    // Don't overpay the final stub.
    if (principalComponent + prepay >= balance) {
      const finalPrincipal = balance;
      const usedPrepay = Math.max(0, finalPrincipal - principalComponent);
      totalInterest += interest;
      totalPaid += interest + finalPrincipal;
      yInterest += interest;
      yPrincipal += Math.min(principalComponent, finalPrincipal);
      yPrepaid += usedPrepay;
      balance = 0;
      payoffMonths = m;
    } else {
      balance -= principalComponent + prepay;
      totalInterest += interest;
      totalPaid += emi + prepay;
      yInterest += interest;
      yPrincipal += principalComponent;
      yPrepaid += prepay;
    }

    if (m % 12 === 0 || balance <= 1e-6) {
      const shielded = Math.min(yInterest, SEC_24B_CAP);
      yearly.push({
        year: Math.ceil(m / 12),
        interestPaid: yInterest,
        principalPaid: yPrincipal,
        prepaid: yPrepaid,
        closingBalance: Math.max(0, balance),
        taxShield: shielded * shieldRate,
      });
      yInterest = 0; yPrincipal = 0; yPrepaid = 0;
    }
  }

  return { emi, totalInterest, totalPaid, payoffMonths, yearly };
}

// ---------------------------------------------------------------------------
// Effective after-tax loan rate (Sec 24(b) shield-aware)
// ---------------------------------------------------------------------------

/**
 * The guaranteed after-tax return from prepaying. The shield only reduces this return for the
 * portion of annual interest that falls UNDER the ₹2L cap and only in the old regime when the
 * deduction is actually claimed. We weight by the interest within the cap over the horizon.
 */
export function effectiveAfterTaxRate(inputs: PrepayInvestInputs): EffectiveRate {
  const nominal = inputs.annualRatePct;
  const shieldRate = inputs.taxRegime === 'old' && inputs.claimSec24b ? pct(inputs.marginalSlabPct) : 0;

  if (shieldRate <= 0) {
    return { nominalRatePct: nominal, effectiveAfterTaxRatePct: nominal, avgAnnualShield: 0, shieldApplies: false };
  }

  // Use the no-prepay schedule over the comparison horizon to weight the shield.
  const horizonMonths = Math.min(inputs.remainingTenureMonths, Math.round(inputs.horizonYears * 12));
  const schedule = buildAmortization(inputs.outstandingPrincipal, inputs.annualRatePct, inputs.remainingTenureMonths, { shieldRate });
  let totalInterest = 0;
  let shieldedInterest = 0;
  let shieldTaxSaved = 0;
  let yearsCounted = 0;
  const horizonYears = Math.max(1, Math.ceil(horizonMonths / 12));
  for (const y of schedule.yearly) {
    if (y.year > horizonYears) break;
    totalInterest += y.interestPaid;
    shieldedInterest += Math.min(y.interestPaid, SEC_24B_CAP);
    shieldTaxSaved += y.taxShield;
    yearsCounted++;
  }
  const avgShieldFraction = totalInterest > 0 ? shieldedInterest / totalInterest : 0;
  const effective = nominal * (1 - avgShieldFraction * shieldRate);
  return {
    nominalRatePct: nominal,
    effectiveAfterTaxRatePct: effective,
    avgAnnualShield: yearsCounted > 0 ? shieldTaxSaved / yearsCounted : 0,
    shieldApplies: true,
  };
}

// ---------------------------------------------------------------------------
// Capital-gains tax on the invest side
// ---------------------------------------------------------------------------

export function capitalGainsTax(
  gain: number,
  vehicle: InvestmentVehicle,
  holdingYears: number,
  marginalSlabPct: number,
): number {
  if (gain <= 0) return 0;
  if (vehicle === 'debt') return gain * pct(marginalSlabPct); // slab, post-2023 rules
  // equity & hybrid (treated equity-oriented, ≥65% equity)
  if (holdingYears < 1) return gain * EQUITY_STCG_RATE; // STCG 111A
  return Math.max(0, gain - EQUITY_LTCG_EXEMPTION) * EQUITY_LTCG_RATE; // LTCG 112A
}

// ---------------------------------------------------------------------------
// Deterministic future value of the surplus at a constant annual return
// ---------------------------------------------------------------------------

/** FV of (lump now + monthly surplus, start-of-month) at constant annual return, integer years. */
export function deterministicFutureValue(
  lumpSum: number,
  monthlySurplus: number,
  annualReturnPct: number,
  years: number,
): number {
  const r = pct(annualReturnPct);
  const factor = monthlySipYearFactor(r);
  let pot = lumpSum;
  for (let y = 0; y < years; y++) pot = pot * (1 + r) + monthlySurplus * factor;
  return pot;
}

// ---------------------------------------------------------------------------
// Certainty equivalent (CRRA utility)
// ---------------------------------------------------------------------------

/**
 * Certainty-equivalent wealth under constant relative risk aversion (CRRA):
 *   γ = 0  -> risk-neutral, CE = mean
 *   γ = 1  -> log utility,  CE = exp(E[ln W])
 *   γ > 1  -> more averse,  CE = (E[W^(1-γ)])^(1/(1-γ))   (penalises downside)
 */
export function certaintyEquivalent(values: ArrayLike<number>, gamma: number): number {
  const n = values.length;
  if (n === 0) return 0;
  if (gamma <= 1e-9) return mean(values);
  if (Math.abs(gamma - 1) < 1e-9) {
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.log(Math.max(1, values[i] ?? 0));
    return Math.exp(s / n);
  }
  const p = 1 - gamma;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.pow(Math.max(1, values[i] ?? 0), p);
  return Math.pow(s / n, 1 / p);
}

// ---------------------------------------------------------------------------
// Histogram
// ---------------------------------------------------------------------------

export function buildHistogram(sortedAsc: ArrayLike<number>, bins: number): HistogramBin[] {
  const n = sortedAsc.length;
  if (n === 0 || bins <= 0) return [];
  const lo = sortedAsc[0] ?? 0;
  const hi = sortedAsc[n - 1] ?? 0;
  if (hi <= lo) return [{ start: lo, end: lo, count: n }];
  const width = (hi - lo) / bins;
  const out: HistogramBin[] = [];
  for (let b = 0; b < bins; b++) out.push({ start: lo + b * width, end: lo + (b + 1) * width, count: 0 });
  for (let i = 0; i < n; i++) {
    const v = sortedAsc[i] ?? 0;
    let idx = Math.floor((v - lo) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    const bin = out[idx];
    if (bin) bin.count++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Invest-side Monte Carlo (returns PRE-TAX terminal values per path)
// ---------------------------------------------------------------------------

function simulateInvestPreTax(inputs: PrepayInvestInputs, sims: number): Float64Array {
  const rng = createRng(inputs.seed ?? DEFAULT_SEED);
  const mu = pct(inputs.expectedReturnPct);
  const sigma = pct(inputs.volatilityPct);
  const years = Math.max(1, Math.round(inputs.horizonYears));
  const out = new Float64Array(sims);
  for (let s = 0; s < sims; s++) {
    let pot = inputs.lumpSum;
    for (let y = 0; y < years; y++) {
      const r = Math.max(MIN_ANNUAL_RETURN, mu + sigma * rng.nextNormal());
      pot = pot * (1 + r) + inputs.monthlySurplus * monthlySipYearFactor(r);
    }
    out[s] = pot;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Breakeven required return (deterministic)
// ---------------------------------------------------------------------------

/** Constant annual return at which the after-tax invest value ties the guaranteed prepay value. */
export function solveBreakevenReturn(inputs: PrepayInvestInputs, prepayValue: number): number | null {
  const years = Math.max(1, Math.round(inputs.horizonYears));
  const basis = inputs.lumpSum + inputs.monthlySurplus * 12 * years;
  const netInvestAt = (rPct: number): number => {
    const gross = deterministicFutureValue(inputs.lumpSum, inputs.monthlySurplus, rPct, years);
    const tax = capitalGainsTax(gross - basis, inputs.vehicle, years, inputs.marginalSlabPct);
    return gross - tax;
  };
  let lo = -20;
  let hi = 50;
  if (netInvestAt(hi) < prepayValue) return null; // even 50% can't beat prepay
  if (netInvestAt(lo) > prepayValue) return lo; // even -20% beats it (degenerate)
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    if (netInvestAt(mid) >= prepayValue) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Top-level analysis
// ---------------------------------------------------------------------------

export function analyzePrepayVsInvest(inputs: PrepayInvestInputs): PrepayInvestAnalysis {
  const sims = inputs.numSimulations ?? DEFAULT_SIMS;
  const years = Math.max(1, Math.round(inputs.horizonYears));
  const shieldRate = inputs.taxRegime === 'old' && inputs.claimSec24b ? pct(inputs.marginalSlabPct) : 0;

  // --- Amortization with and without prepaying the full surplus ---
  const amortNoPrepay = buildAmortization(
    inputs.outstandingPrincipal, inputs.annualRatePct, inputs.remainingTenureMonths, { shieldRate },
  );
  const amortWithPrepay = buildAmortization(
    inputs.outstandingPrincipal, inputs.annualRatePct, inputs.remainingTenureMonths,
    { extraMonthly: inputs.monthlySurplus, lumpSum: inputs.lumpSum, shieldRate },
  );
  const interestSaved = amortNoPrepay.totalInterest - amortWithPrepay.totalInterest;
  const shieldNoPrepay = amortNoPrepay.yearly.reduce((s, y) => s + y.taxShield, 0);
  const shieldWithPrepay = amortWithPrepay.yearly.reduce((s, y) => s + y.taxShield, 0);
  const afterTaxInterestSaved = interestSaved - (shieldNoPrepay - shieldWithPrepay);
  const tenureCutMonths = amortNoPrepay.payoffMonths - amortWithPrepay.payoffMonths;

  // --- Effective after-tax loan rate (the prepay side's guaranteed return) ---
  const effectiveRate = effectiveAfterTaxRate(inputs);

  // --- Prepay terminal value: surplus grown at the guaranteed effective rate ---
  const penalty = pct(inputs.prepaymentPenaltyPct);
  const netMonthly = inputs.monthlySurplus * (1 - penalty);
  const netLump = inputs.lumpSum * (1 - penalty);
  const prepayValue = deterministicFutureValue(netLump, netMonthly, effectiveRate.effectiveAfterTaxRatePct, years);

  // --- Invest side Monte Carlo (pre-tax), then derive after-tax distribution ---
  const preTax = simulateInvestPreTax(inputs, sims);
  const investedPrincipal = inputs.lumpSum + inputs.monthlySurplus * 12 * years;

  const netTerminals = new Float64Array(sims);
  for (let s = 0; s < sims; s++) {
    const gross = preTax[s] ?? 0;
    const tax = capitalGainsTax(gross - investedPrincipal, inputs.vehicle, years, inputs.marginalSlabPct);
    netTerminals[s] = gross - tax;
  }
  const sorted = Float64Array.from(netTerminals).sort();

  let beats = 0;
  for (let s = 0; s < sims; s++) if ((netTerminals[s] ?? 0) > prepayValue) beats++;
  const probInvestBeatsPrepay = beats / sims;

  const investDistribution: Distribution = {
    mean: mean(netTerminals),
    p10: percentile(sorted, 0.10),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.50),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.90),
    min: sorted[0] ?? 0,
    max: sorted[sims - 1] ?? 0,
  };
  const investHistogram = buildHistogram(sorted, 28);

  // --- Breakeven required return ---
  const breakevenReturnPct = solveBreakevenReturn(inputs, prepayValue);

  // --- Hybrid split: f of surplus invested, (1-f) prepaid; maximise certainty-equivalent ---
  // Pre-tax invest scales linearly with f; CGT uses the fixed ₹1.25L exemption on the scaled gain.
  const hybridCurve: HybridPoint[] = [];
  const wealthBuf = new Float64Array(sims);
  let optimalInvestFraction = 0;
  let optimalCertaintyEquivalent = -Infinity;
  for (let step = 0; step <= 20; step++) {
    const f = step / 20;
    for (let s = 0; s < sims; s++) {
      const grossF = (preTax[s] ?? 0) * f;
      const basisF = investedPrincipal * f;
      const taxF = capitalGainsTax(grossF - basisF, inputs.vehicle, years, inputs.marginalSlabPct);
      const investPart = grossF - taxF;
      const prepayPart = (1 - f) * prepayValue;
      wealthBuf[s] = investPart + prepayPart;
    }
    const ce = certaintyEquivalent(wealthBuf, inputs.riskAversion);
    const ew = mean(wealthBuf);
    hybridCurve.push({ investFraction: f, certaintyEquivalent: ce, expectedWealth: ew });
    if (ce > optimalCertaintyEquivalent) {
      optimalCertaintyEquivalent = ce;
      optimalInvestFraction = f;
    }
  }

  // --- Verdict ---
  let verdict: 'invest' | 'prepay' | 'hybrid';
  if (optimalInvestFraction >= 0.85) verdict = 'invest';
  else if (optimalInvestFraction <= 0.15) verdict = 'prepay';
  else verdict = 'hybrid';
  const verdictConfidence = verdict === 'prepay' ? 1 - probInvestBeatsPrepay : probInvestBeatsPrepay;

  return {
    emi: amortNoPrepay.emi,
    amortNoPrepay,
    amortWithPrepay,
    interestSaved,
    afterTaxInterestSaved,
    tenureCutMonths,
    effectiveRate,
    prepayValue,
    investDistribution,
    investHistogram,
    probInvestBeatsPrepay,
    breakevenReturnPct,
    hybridCurve,
    optimalInvestFraction,
    optimalCertaintyEquivalent,
    verdict,
    verdictConfidence,
    investedPrincipal,
  };
}

// ---------------------------------------------------------------------------
// Vehicle defaults & sensible starting inputs
// ---------------------------------------------------------------------------

export const VEHICLE_DEFAULTS: Record<InvestmentVehicle, { returnPct: number; volPct: number; label: string }> = {
  equity: { returnPct: 12, volPct: 17, label: 'Equity (index / equity MF)' },
  hybrid: { returnPct: 10, volPct: 10, label: 'Hybrid (balanced fund)' },
  debt: { returnPct: 7, volPct: 4, label: 'Debt (debt MF / bonds)' },
};

export const DEFAULT_INPUTS: PrepayInvestInputs = {
  outstandingPrincipal: 4000000,
  annualRatePct: 9,
  remainingTenureMonths: 180,
  prepaymentPenaltyPct: 0,
  monthlySurplus: 25000,
  lumpSum: 0,
  taxRegime: 'new',
  marginalSlabPct: 31.2,
  claimSec24b: false,
  vehicle: 'equity',
  expectedReturnPct: 12,
  volatilityPct: 17,
  horizonYears: 15,
  riskAversion: 2,
  numSimulations: 10000,
};
