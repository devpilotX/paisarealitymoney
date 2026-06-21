/**
 * Retirement Corpus & Withdrawal Optimizer. simulation engine
 * =============================================================
 * A 100% client-side, deterministic + Monte Carlo retirement planner.
 *
 * DESIGN PRINCIPLES
 * - Pure functions only. No I/O, no globals, no Date.now(). Same inputs => same outputs.
 * - Seeded PRNG with "common random numbers": every evaluation in a solve reuses the SAME
 *   random sequence, so success probability is a deterministic, monotonic function of the SIP.
 *   This makes binary search stable and the "success% monotonic in SIP" property exact.
 * - Nominal modelling. Asset returns are NOMINAL (e.g. Nifty TRI ~12%); expenses inflate
 *   explicitly by separate GENERAL and MEDICAL inflation. Results are also reported in
 *   "today's rupees" (deflated by general inflation) for intuition.
 * - Annual time-step with an EXACT intra-year monthly-SIP factor, so the deterministic engine
 *   (volatility = 0) reproduces the closed-form monthly-SIP future-value formula to the rupee
 *   while running 12x faster than month-by-month iteration.
 *
 * MODEL CONVENTIONS (all are labelled assumptions the user can change in the UI)
 * - SIP contributions are made at the START of each month (annuity-due).
 * - Step-up is applied once per year, at each anniversary.
 * - Withdrawals in retirement are made at the START of the year; the remaining corpus then
 *   grows for that year (a conservative ordering that respects sequence-of-returns risk).
 * - Asset returns are drawn independently in 'normal' mode (cross-asset correlation is NOT
 *   modelled there); 'bootstrap' mode samples whole historical years, which preserves the
 *   historical co-movement of equity/debt/gold.
 * - EPF and NPS are accumulated at their own fixed expected returns (no volatility), reflecting
 *   their administered / lower-risk nature. NPS applies the statutory 60% tax-free lump sum +
 *   40% compulsory annuity rule (PFRDA). The NPS annuity pension is treated as fixed-nominal.
 *
 * Nothing here is tax or investment advice. See README for the full assumption log.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GlidePathType = 'none' | 'age-based-100' | 'age-based-120' | 'custom-linear';
export type ReturnModel = 'normal' | 'bootstrap';

export interface RetirementInputs {
  // --- Horizon ---
  currentAge: number;
  retirementAge: number;
  endAge: number; // life expectancy / planning horizon (e.g. 90/95/100)

  // --- Accumulation ---
  currentCorpus: number; // existing investments today
  monthlySIP: number; // current monthly investment
  annualStepUpPct: number; // annual % increase in SIP (e.g. 10)

  // --- Spending in retirement (today's rupees) ---
  currentMonthlyExpense: number; // monthly expense in TODAY's money that must be funded in retirement
  medicalExpenseSharePct: number; // % of expense that is medical (inflates at medical rate)
  generalInflationPct: number; // default 6
  medicalInflationPct: number; // default 10

  // --- Asset assumptions (nominal annual mean + volatility, %) ---
  equityReturnPct: number;
  equityVolPct: number;
  debtReturnPct: number;
  debtVolPct: number;
  goldReturnPct: number;
  goldVolPct: number;

  // --- Allocation + glide path ---
  startEquityPct: number; // equity allocation at currentAge
  startDebtPct: number;
  startGoldPct: number;
  glidePath: GlidePathType;
  minEquityPct: number; // floor for equity as the glide path de-risks

  // --- Other income in retirement (today's rupees) ---
  postRetirementMonthlyIncome: number; // part-time / rental income, today's money
  postRetirementIncomeYears: number; // for how many years from retirement it lasts

  // --- Optional EPF ---
  includeEPF: boolean;
  epfCurrentBalance: number;
  epfMonthlyContribution: number;
  epfReturnPct: number; // administered rate, ~8.25

  // --- Optional NPS ---
  includeNPS: boolean;
  npsCurrentBalance: number;
  npsMonthlyContribution: number;
  npsReturnPct: number;
  npsAnnuityRatePct: number; // annuity yield applied to the compulsory 40%

  // --- Target + simulation controls ---
  desiredSuccessProbabilityPct: number; // e.g. 90. used by the inverse solvers
  numSimulations?: number; // default 10000
  seed?: number; // default fixed, for reproducibility
  returnModel?: ReturnModel; // default 'normal'
}

export interface PercentileBand {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface SimulationResult {
  successProbability: number; // 0..1, corpus survives to endAge
  corpusAtRetirement: { p10: number; p50: number; p90: number; mean: number };
  terminalCorpus: { p10: number; p50: number; p90: number; mean: number };
  /** Per-age percentile bands of the total corpus, from currentAge to endAge. */
  fanChart: PercentileBand[];
  /** Worst-10% depletion age (10th percentile of the age at which corpus hits zero). null => survives. */
  worstCaseDepletionAge: number | null;
  medianDepletionAge: number | null;
  /** Deterministic (volatility=0) projected corpus at retirement, for "expected case" displays. */
  deterministicCorpusAtRetirement: number;
}

export interface SolveResult {
  value: number;
  achievedProbability: number;
  iterations: number;
  converged: boolean;
}

export interface SensitivityRow {
  label: string;
  successProbability: number;
  deltaVsBase: number; // percentage points vs the base scenario
}

export interface FullAnalysis {
  base: SimulationResult;
  requiredCorpusAtRetirement: number; // nominal, at retirement date, for target success %
  requiredCorpusToday: number; // same, deflated to today's rupees
  requiredMonthlySIP: SolveResult; // SIP to reach target success % end-to-end
  safeMonthlyWithdrawalToday: number; // sustainable monthly spend (today's rupees) at target success %
  safeAnnualWithdrawalToday: number;
  sensitivity: SensitivityRow[];
  yearsToRetirement: number;
  retirementYears: number;
}

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) + normal draws (Box–Muller)
// ---------------------------------------------------------------------------

export interface Rng {
  next: () => number; // uniform [0,1)
  nextNormal: () => number; // standard normal
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  let spare: number | null = null;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const nextNormal = (): number => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    // Box–Muller transform
    let u = 0;
    let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    spare = mag * Math.sin(2.0 * Math.PI * v);
    return mag * Math.cos(2.0 * Math.PI * v);
  };
  return { next, nextNormal };
}

// ---------------------------------------------------------------------------
// Bundled historical dataset (for the optional 'bootstrap' return model)
// ---------------------------------------------------------------------------

/**
 * ILLUSTRATIVE approximate annual total returns (%) for Indian asset classes.
 * Equity = Nifty 50 TRI, Debt = broad Indian bond index proxy, Gold = INR gold.
 * These figures are rounded approximations compiled for educational modelling and
 * are NOT official index values. verify against NSE / CCIL / IBJA before relying on them.
 * The default engine uses the editable normal-distribution model; bootstrap is secondary.
 *
 * Dataset "as of": 2024-03-31 (FY 2023-24 close). Last reviewed: 2025-06-21.
 */
export const HISTORICAL_RETURNS_AS_OF = '2024-03-31';

export interface HistoricalYear {
  year: number;
  equity: number; // decimal
  debt: number;
  gold: number;
}

export const HISTORICAL_RETURNS: readonly HistoricalYear[] = [
  { year: 2000, equity: -0.146, debt: 0.131, gold: 0.012 },
  { year: 2001, equity: -0.162, debt: 0.121, gold: 0.052 },
  { year: 2002, equity: 0.043, debt: 0.145, gold: 0.241 },
  { year: 2003, equity: 0.758, debt: 0.04, gold: 0.085 },
  { year: 2004, equity: 0.124, debt: 0.025, gold: 0.001 },
  { year: 2005, equity: 0.385, debt: 0.045, gold: 0.218 },
  { year: 2006, equity: 0.419, debt: 0.054, gold: 0.205 },
  { year: 2007, equity: 0.568, debt: 0.069, gold: 0.171 },
  { year: 2008, equity: -0.518, debt: 0.092, gold: 0.265 },
  { year: 2009, equity: 0.776, debt: 0.035, gold: 0.241 },
  { year: 2010, equity: 0.192, debt: 0.05, gold: 0.232 },
  { year: 2011, equity: -0.238, debt: 0.068, gold: 0.314 },
  { year: 2012, equity: 0.294, debt: 0.094, gold: 0.122 },
  { year: 2013, equity: 0.081, debt: 0.035, gold: -0.045 },
  { year: 2014, equity: 0.329, debt: 0.143, gold: -0.078 },
  { year: 2015, equity: -0.03, debt: 0.085, gold: -0.064 },
  { year: 2016, equity: 0.044, debt: 0.129, gold: 0.114 },
  { year: 2017, equity: 0.303, debt: 0.045, gold: 0.054 },
  { year: 2018, equity: 0.046, debt: 0.058, gold: 0.078 },
  { year: 2019, equity: 0.135, debt: 0.108, gold: 0.236 },
  { year: 2020, equity: 0.161, debt: 0.121, gold: 0.281 },
  { year: 2021, equity: 0.256, debt: 0.034, gold: -0.041 },
  { year: 2022, equity: 0.057, debt: 0.024, gold: 0.135 },
  { year: 2023, equity: 0.213, debt: 0.072, gold: 0.151 },
];

// ---------------------------------------------------------------------------
// Small numeric helpers
// ---------------------------------------------------------------------------

const DEFAULT_SEED = 0x9e3779b9;
const DEFAULT_SIMS = 10000;
const SOLVE_SIMS = 3000; // fewer paths inside binary search for speed; final answers re-checked
const MIN_ANNUAL_RETURN = -0.95; // floor a single-year return so (1+r)^(1/12) stays defined

function pct(x: number): number {
  return x / 100;
}

/** Linear-interpolated percentile of an UNSORTED array (p in [0,1]). */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((x, y) => x - y);
  if (sorted.length === 1) return sorted[0] ?? 0;
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const loVal = sorted[lo] ?? 0;
  const hiVal = sorted[hi] ?? 0;
  if (lo === hi) return loVal;
  return loVal + (hiVal - loVal) * (idx - lo);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let s = 0;
  for (const v of values) s += v;
  return s / values.length;
}

/**
 * Exact future value at year-end of 12 monthly (start-of-month / annuity-due) contributions
 * of 1 rupee each, given an annual return r. Used so the annual-step engine reproduces the
 * standard monthly-SIP closed form exactly.
 *
 *   i = (1+r)^(1/12) - 1            (effective monthly rate)
 *   FV = Σ_{k=1..12} (1+i)^k = (1+i) * ((1+i)^12 - 1) / i = (1+i) * r / i
 */
export function monthlySipYearFactor(r: number): number {
  if (Math.abs(r) < 1e-12) return 12; // no growth => 12 unit contributions
  const i = Math.pow(1 + r, 1 / 12) - 1;
  if (Math.abs(i) < 1e-12) return 12;
  return (1 + i) * (Math.pow(1 + i, 12) - 1) / i;
}

// ---------------------------------------------------------------------------
// Glide path
// ---------------------------------------------------------------------------

/**
 * Equity allocation (fraction 0..1) at a given age, per the chosen glide path.
 * Non-equity is split between debt and gold in the ratio of their starting weights.
 */
export function equityFractionAtAge(inputs: RetirementInputs, age: number): number {
  const start = pct(inputs.startEquityPct);
  const floor = pct(inputs.minEquityPct);
  let eq: number;
  switch (inputs.glidePath) {
    case 'none':
      eq = start;
      break;
    case 'age-based-100':
      eq = (100 - age) / 100;
      break;
    case 'age-based-120':
      eq = (120 - age) / 100;
      break;
    case 'custom-linear': {
      // De-risk linearly from start (at currentAge) to floor (at retirementAge), then hold floor.
      const span = Math.max(1, inputs.retirementAge - inputs.currentAge);
      const t = Math.min(1, Math.max(0, (age - inputs.currentAge) / span));
      eq = start + (floor - start) * t;
      break;
    }
    default:
      eq = start;
  }
  return Math.min(1, Math.max(floor, eq));
}

interface YearAllocation {
  equity: number;
  debt: number;
  gold: number;
}

function allocationAtAge(inputs: RetirementInputs, age: number): YearAllocation {
  const equity = equityFractionAtAge(inputs, age);
  const nonEquity = 1 - equity;
  const dW = Math.max(0, inputs.startDebtPct);
  const gW = Math.max(0, inputs.startGoldPct);
  const denom = dW + gW;
  // Preserve the starting debt:gold ratio within the non-equity sleeve; default to all-debt.
  const debtShare = denom > 0 ? dW / denom : 1;
  return { equity, debt: nonEquity * debtShare, gold: nonEquity * (1 - debtShare) };
}

// ---------------------------------------------------------------------------
// Per-year portfolio return draw
// ---------------------------------------------------------------------------

interface AssetParams {
  muE: number; sE: number;
  muD: number; sD: number;
  muG: number; sG: number;
}

function assetParams(inputs: RetirementInputs): AssetParams {
  return {
    muE: pct(inputs.equityReturnPct), sE: pct(inputs.equityVolPct),
    muD: pct(inputs.debtReturnPct), sD: pct(inputs.debtVolPct),
    muG: pct(inputs.goldReturnPct), sG: pct(inputs.goldVolPct),
  };
}

/** Draw a single-year portfolio return for the given allocation. */
function drawPortfolioReturn(
  rng: Rng,
  alloc: YearAllocation,
  ap: AssetParams,
  model: ReturnModel,
): number {
  let r: number;
  if (model === 'bootstrap') {
    const idx = Math.floor(rng.next() * HISTORICAL_RETURNS.length);
    const row = HISTORICAL_RETURNS[idx] ?? HISTORICAL_RETURNS[0]!;
    r = alloc.equity * row.equity + alloc.debt * row.debt + alloc.gold * row.gold;
  } else {
    const rE = ap.muE + ap.sE * rng.nextNormal();
    const rD = ap.muD + ap.sD * rng.nextNormal();
    const rG = ap.muG + ap.sG * rng.nextNormal();
    r = alloc.equity * rE + alloc.debt * rD + alloc.gold * rG;
  }
  return Math.max(MIN_ANNUAL_RETURN, r);
}

// ---------------------------------------------------------------------------
// Deterministic helpers (EPF, NPS, expenses)
// ---------------------------------------------------------------------------

/** Future value of an existing balance + monthly contribution at a fixed annual rate. */
export function fixedReturnFutureValue(
  currentBalance: number,
  monthlyContribution: number,
  annualRatePct: number,
  years: number,
): number {
  const r = pct(annualRatePct);
  const factor = monthlySipYearFactor(r);
  let bal = currentBalance;
  for (let y = 0; y < years; y++) {
    bal = bal * (1 + r) + monthlyContribution * factor;
  }
  return bal;
}

interface RetirementSidecars {
  epfAtRetirement: number;
  npsLumpSum: number; // 60% tax-free
  npsAnnualPension: number; // from compulsory 40% annuity (fixed nominal)
}

function computeSidecars(inputs: RetirementInputs, yearsToRet: number): RetirementSidecars {
  let epfAtRetirement = 0;
  if (inputs.includeEPF) {
    epfAtRetirement = fixedReturnFutureValue(
      inputs.epfCurrentBalance, inputs.epfMonthlyContribution, inputs.epfReturnPct, yearsToRet,
    );
  }
  let npsLumpSum = 0;
  let npsAnnualPension = 0;
  if (inputs.includeNPS) {
    const npsCorpus = fixedReturnFutureValue(
      inputs.npsCurrentBalance, inputs.npsMonthlyContribution, inputs.npsReturnPct, yearsToRet,
    );
    // PFRDA rule: at least 40% must buy an annuity; up to 60% can be withdrawn tax-free.
    npsLumpSum = npsCorpus * 0.6;
    npsAnnualPension = npsCorpus * 0.4 * pct(inputs.npsAnnuityRatePct);
  }
  return { epfAtRetirement, npsLumpSum, npsAnnualPension };
}

/** Annual retirement expense (nominal) at a given age, with separate general/medical inflation. */
export function annualExpenseAtAge(inputs: RetirementInputs, age: number): number {
  const annualToday = inputs.currentMonthlyExpense * 12;
  const medicalShare = Math.min(1, Math.max(0, pct(inputs.medicalExpenseSharePct)));
  const medicalToday = annualToday * medicalShare;
  const generalToday = annualToday - medicalToday;
  const yearsFromNow = age - inputs.currentAge;
  const g = Math.pow(1 + pct(inputs.generalInflationPct), yearsFromNow);
  const m = Math.pow(1 + pct(inputs.medicalInflationPct), yearsFromNow);
  return generalToday * g + medicalToday * m;
}

function annualPostRetirementIncome(inputs: RetirementInputs, age: number): number {
  if (age - inputs.retirementAge >= inputs.postRetirementIncomeYears) return 0;
  const annualToday = inputs.postRetirementMonthlyIncome * 12;
  const yearsFromNow = age - inputs.currentAge;
  return annualToday * Math.pow(1 + pct(inputs.generalInflationPct), yearsFromNow);
}

// ---------------------------------------------------------------------------
// Single-path simulation
// ---------------------------------------------------------------------------

interface PathConfig {
  collectPath: boolean; // record corpus at every age (for fan chart)
  overrideStartCorpus?: number; // for decumulation-only solves (skip accumulation)
  overrideMonthlySIP?: number; // for SIP solves
  overrideExpenseMultiplier?: number; // for safe-withdrawal solves
}

interface PathOutcome {
  corpusAtRetirement: number;
  terminalCorpus: number;
  survived: boolean;
  depletionAge: number | null;
  path?: number[]; // corpus at each age from currentAge..endAge (if collectPath)
}

function simulatePath(
  inputs: RetirementInputs,
  rng: Rng,
  ap: AssetParams,
  sidecars: RetirementSidecars,
  cfg: PathConfig,
): PathOutcome {
  const model = inputs.returnModel ?? 'normal';
  const monthlySIP = cfg.overrideMonthlySIP ?? inputs.monthlySIP;
  const expMult = cfg.overrideExpenseMultiplier ?? 1;
  const path: number[] = [];

  // --- Accumulation phase ---
  let corpus: number;
  if (cfg.overrideStartCorpus !== undefined) {
    // Decumulation-only mode: jump straight to the retirement date with a given corpus.
    corpus = cfg.overrideStartCorpus;
    if (cfg.collectPath) {
      for (let age = inputs.currentAge; age <= inputs.retirementAge; age++) path.push(corpus);
    }
  } else {
    corpus = inputs.currentCorpus;
    if (cfg.collectPath) path.push(corpus);
    let sip = monthlySIP;
    for (let age = inputs.currentAge; age < inputs.retirementAge; age++) {
      const alloc = allocationAtAge(inputs, age);
      const r = drawPortfolioReturn(rng, alloc, ap, model);
      corpus = corpus * (1 + r) + sip * monthlySipYearFactor(r);
      if (cfg.collectPath) path.push(corpus);
      sip *= 1 + pct(inputs.annualStepUpPct);
    }
    // Add tax-free sidecars at retirement.
    corpus += sidecars.epfAtRetirement + sidecars.npsLumpSum;
  }

  const corpusAtRetirement = corpus;

  // --- Decumulation phase ---
  // CRITICAL: we draw EXACTLY one portfolio return per year for the entire horizon, whether or
  // not the corpus has already depleted. Consuming a fixed number of random draws per path keeps
  // "common random numbers" intact across solver evaluations, which makes the success probability
  // a monotonic function of the SIP / starting corpus (relied on by the binary-search solvers).
  let survived = true;
  let depletionAge: number | null = null;
  for (let age = inputs.retirementAge; age < inputs.endAge; age++) {
    if (survived) {
      const expense = annualExpenseAtAge(inputs, age) * expMult;
      const income = annualPostRetirementIncome(inputs, age) + sidecars.npsAnnualPension;
      const net = Math.max(0, expense - income);
      // Withdraw at the start of the year; if the corpus cannot fund it, the plan has failed.
      corpus -= net;
      if (corpus <= 0) {
        survived = false;
        depletionAge = age;
        corpus = 0;
      }
    }
    // Always draw (and, while alive, apply) the year's return so RNG consumption is fixed.
    const alloc = allocationAtAge(inputs, age);
    const r = drawPortfolioReturn(rng, alloc, ap, model);
    if (survived) corpus = corpus * (1 + r);
    if (cfg.collectPath) path.push(corpus);
  }

  return {
    corpusAtRetirement,
    terminalCorpus: survived ? corpus : 0,
    survived,
    depletionAge,
    path: cfg.collectPath ? path : undefined,
  };
}

// ---------------------------------------------------------------------------
// Monte Carlo runner
// ---------------------------------------------------------------------------

interface RunConfig {
  sims: number;
  collectPaths: boolean;
  overrideStartCorpus?: number;
  overrideMonthlySIP?: number;
  overrideExpenseMultiplier?: number;
}

function runMonteCarlo(inputs: RetirementInputs, cfg: RunConfig): SimulationResult {
  const seed = inputs.seed ?? DEFAULT_SEED;
  const ap = assetParams(inputs);
  const yearsToRet = inputs.retirementAge - inputs.currentAge;
  const sidecars = computeSidecars(inputs, yearsToRet);
  const ageCount = inputs.endAge - inputs.currentAge + 1;

  const corpusAtRet: number[] = [];
  const terminal: number[] = [];
  const depletionAges: number[] = [];
  let successes = 0;

  // For the fan chart: collect corpus value at each age across paths.
  const perAge: number[][] | null = cfg.collectPaths
    ? Array.from({ length: ageCount }, () => [] as number[])
    : null;

  // IMPORTANT: re-seed once for the whole run so evaluations share common random numbers.
  const rng = createRng(seed);

  for (let s = 0; s < cfg.sims; s++) {
    const outcome = simulatePath(inputs, rng, ap, sidecars, {
      collectPath: cfg.collectPaths,
      overrideStartCorpus: cfg.overrideStartCorpus,
      overrideMonthlySIP: cfg.overrideMonthlySIP,
      overrideExpenseMultiplier: cfg.overrideExpenseMultiplier,
    });
    corpusAtRet.push(outcome.corpusAtRetirement);
    terminal.push(outcome.terminalCorpus);
    if (outcome.survived) successes++;
    depletionAges.push(outcome.depletionAge ?? inputs.endAge);
    if (perAge && outcome.path) {
      for (let a = 0; a < ageCount; a++) {
        const v = outcome.path[a];
        if (v !== undefined) perAge[a]!.push(v);
      }
    }
  }

  const fanChart: PercentileBand[] = [];
  if (perAge) {
    for (let a = 0; a < ageCount; a++) {
      const col = perAge[a]!;
      fanChart.push({
        age: inputs.currentAge + a,
        p10: percentile(col, 0.1),
        p25: percentile(col, 0.25),
        p50: percentile(col, 0.5),
        p75: percentile(col, 0.75),
        p90: percentile(col, 0.9),
      });
    }
  }

  // Worst-case (10th pct) and median depletion ages, counting only paths that actually ran out.
  const ranOutAges = depletionAges.filter((a) => a < inputs.endAge);
  const worstCaseDepletionAge = ranOutAges.length / cfg.sims >= 0.1
    ? Math.round(percentile(ranOutAges, 0.1))
    : null;
  const medianDepletionAge = ranOutAges.length / cfg.sims > 0.5
    ? Math.round(percentile(ranOutAges, 0.5))
    : null;

  return {
    successProbability: successes / cfg.sims,
    corpusAtRetirement: {
      p10: percentile(corpusAtRet, 0.1),
      p50: percentile(corpusAtRet, 0.5),
      p90: percentile(corpusAtRet, 0.9),
      mean: mean(corpusAtRet),
    },
    terminalCorpus: {
      p10: percentile(terminal, 0.1),
      p50: percentile(terminal, 0.5),
      p90: percentile(terminal, 0.9),
      mean: mean(terminal),
    },
    fanChart,
    worstCaseDepletionAge,
    medianDepletionAge,
    deterministicCorpusAtRetirement: deterministicCorpusAtRetirement(inputs),
  };
}

/** Public entry point for a single Monte Carlo run with the full fan chart. */
export function runSimulation(inputs: RetirementInputs): SimulationResult {
  return runMonteCarlo(inputs, {
    sims: inputs.numSimulations ?? DEFAULT_SIMS,
    collectPaths: true,
  });
}

// ---------------------------------------------------------------------------
// Deterministic (closed-form-equivalent) projections
// ---------------------------------------------------------------------------

/**
 * Deterministic corpus at retirement using each year's MEAN portfolio return (volatility = 0).
 * Equivalent to the closed-form stepped-up monthly-SIP future value; the Monte Carlo MEAN
 * converges to this value.
 */
export function deterministicCorpusAtRetirement(inputs: RetirementInputs): number {
  const ap = assetParams(inputs);
  let corpus = inputs.currentCorpus;
  let sip = inputs.monthlySIP;
  for (let age = inputs.currentAge; age < inputs.retirementAge; age++) {
    const alloc = allocationAtAge(inputs, age);
    const r = alloc.equity * ap.muE + alloc.debt * ap.muD + alloc.gold * ap.muG;
    corpus = corpus * (1 + r) + sip * monthlySipYearFactor(r);
    sip *= 1 + pct(inputs.annualStepUpPct);
  }
  const yearsToRet = inputs.retirementAge - inputs.currentAge;
  const sidecars = computeSidecars(inputs, yearsToRet);
  return corpus + sidecars.epfAtRetirement + sidecars.npsLumpSum;
}

/**
 * Closed-form future value of a stepped-up monthly SIP plus a lump sum, at a CONSTANT annual
 * return. Pure formula. used by the test-suite to validate the deterministic engine.
 *
 *   FV = S0*(1+r)^N + f(r)*M0 * Σ_{y=0}^{N-1} (1+g)^y (1+r)^{N-1-y}
 *   f(r) = monthly annuity-due factor (see monthlySipYearFactor)
 */
export function closedFormAccumulation(
  startCorpus: number,
  monthlySIP: number,
  annualReturnPct: number,
  annualStepUpPct: number,
  years: number,
): number {
  const r = pct(annualReturnPct);
  const g = pct(annualStepUpPct);
  const f = monthlySipYearFactor(r);
  let sipSum = 0;
  for (let y = 0; y < years; y++) {
    sipSum += Math.pow(1 + g, y) * Math.pow(1 + r, years - 1 - y);
  }
  return startCorpus * Math.pow(1 + r, years) + f * monthlySIP * sipSum;
}

/**
 * Deterministic present value (at the retirement date) of the inflation-indexed withdrawal
 * stream, discounted at a constant post-retirement return. This is the minimum corpus required
 * with zero volatility; the Monte Carlo required corpus adds a buffer for sequence risk.
 *
 * Withdrawals are start-of-year, so year y is discounted by (1+r)^y.
 */
export function closedFormRequiredCorpus(
  firstYearWithdrawal: number,
  inflationPct: number,
  postReturnPct: number,
  years: number,
): number {
  const f = pct(inflationPct);
  const r = pct(postReturnPct);
  const ratio = (1 + f) / (1 + r);
  let pv = 0;
  for (let y = 0; y < years; y++) {
    pv += firstYearWithdrawal * Math.pow(ratio, y);
  }
  return pv;
}

// ---------------------------------------------------------------------------
// Inverse solvers (binary search over common-random-number success probability)
// ---------------------------------------------------------------------------

function successProbabilityFor(inputs: RetirementInputs, cfg: Partial<RunConfig>): number {
  return runMonteCarlo(inputs, {
    sims: SOLVE_SIMS,
    collectPaths: false,
    ...cfg,
  }).successProbability;
}

/**
 * Solve the monthly SIP that achieves the target success probability END-TO-END
 * (accumulate then decumulate on the same random path). Monotone in SIP thanks to
 * common random numbers, so a simple bracket + bisection converges.
 */
export function solveRequiredSIP(inputs: RetirementInputs): SolveResult {
  const target = pct(inputs.desiredSuccessProbabilityPct);

  // Already sufficient with zero further SIP?
  const probAtZero = successProbabilityFor(inputs, { overrideMonthlySIP: 0 });
  if (probAtZero >= target) {
    return { value: 0, achievedProbability: probAtZero, iterations: 0, converged: true };
  }

  // Expand an upper bracket until it meets the target (cap at ₹50 lakh/month).
  let hi = Math.max(10000, inputs.monthlySIP * 2);
  const HI_CAP = 5000000;
  let probHi = successProbabilityFor(inputs, { overrideMonthlySIP: hi });
  let expandIters = 0;
  while (probHi < target && hi < HI_CAP) {
    hi *= 2;
    probHi = successProbabilityFor(inputs, { overrideMonthlySIP: hi });
    expandIters++;
  }
  if (probHi < target) {
    return { value: hi, achievedProbability: probHi, iterations: expandIters, converged: false };
  }

  // Bisection to ₹100/month tolerance.
  let lo = 0;
  let iterations = expandIters;
  while (hi - lo > 100 && iterations < 80) {
    const mid = (lo + hi) / 2;
    const p = successProbabilityFor(inputs, { overrideMonthlySIP: mid });
    if (p >= target) hi = mid;
    else lo = mid;
    iterations++;
  }
  const value = Math.ceil(hi / 100) * 100;
  const achievedProbability = successProbabilityFor(inputs, { overrideMonthlySIP: value });
  return { value, achievedProbability, iterations, converged: true };
}

/**
 * Required corpus AT RETIREMENT for the target success probability, via decumulation-only
 * Monte Carlo (binary search on the starting corpus). Returns the nominal amount at the
 * retirement date.
 */
export function solveRequiredCorpus(inputs: RetirementInputs): number {
  const target = pct(inputs.desiredSuccessProbabilityPct);
  // Bracket using the deterministic PV as a lower anchor.
  const yearsToRet = inputs.retirementAge - inputs.currentAge;
  const retYears = inputs.endAge - inputs.retirementAge;
  const firstWithdrawal = Math.max(0, annualExpenseAtAge(inputs, inputs.retirementAge) - annualPostRetirementIncome(inputs, inputs.retirementAge));
  const detPv = closedFormRequiredCorpus(
    firstWithdrawal,
    inputs.generalInflationPct,
    inputs.equityReturnPct * pct(inputs.minEquityPct) + inputs.debtReturnPct * (1 - pct(inputs.minEquityPct)),
    retYears,
  );
  let lo = 0;
  let hi = Math.max(detPv * 3, firstWithdrawal * retYears, 1000000);
  // Ensure hi actually meets the target.
  let guard = 0;
  while (successProbabilityFor(inputs, { overrideStartCorpus: hi }) < target && guard < 40) {
    hi *= 1.5;
    guard++;
  }
  let iterations = 0;
  while (hi - lo > Math.max(1000, hi * 0.001) && iterations < 80) {
    const mid = (lo + hi) / 2;
    const p = successProbabilityFor(inputs, { overrideStartCorpus: mid });
    if (p >= target) hi = mid;
    else lo = mid;
    iterations++;
  }
  void yearsToRet;
  return hi;
}

/**
 * Safe monthly withdrawal in TODAY's rupees for a given corpus at retirement, at the target
 * success probability. Binary search the expense multiplier applied to the user's spend.
 */
export function solveSafeWithdrawalToday(inputs: RetirementInputs, corpusAtRetirement: number): number {
  const target = pct(inputs.desiredSuccessProbabilityPct);
  let lo = 0;
  let hi = 10; // up to 10x the user's stated expense
  // If even tiny spend fails, return 0.
  if (successProbabilityFor(inputs, { overrideStartCorpus: corpusAtRetirement, overrideExpenseMultiplier: 0.01 }) < target) {
    return 0;
  }
  let iterations = 0;
  while (hi - lo > 0.01 && iterations < 60) {
    const mid = (lo + hi) / 2;
    const p = successProbabilityFor(inputs, {
      overrideStartCorpus: corpusAtRetirement,
      overrideExpenseMultiplier: mid,
    });
    if (p >= target) lo = mid;
    else hi = mid;
    iterations++;
  }
  return inputs.currentMonthlyExpense * lo;
}

// ---------------------------------------------------------------------------
// Sensitivity analysis
// ---------------------------------------------------------------------------

function withReturnDelta(inputs: RetirementInputs, deltaPct: number): RetirementInputs {
  return {
    ...inputs,
    equityReturnPct: inputs.equityReturnPct + deltaPct,
    debtReturnPct: inputs.debtReturnPct + deltaPct,
    goldReturnPct: inputs.goldReturnPct + deltaPct,
  };
}

export function computeSensitivity(inputs: RetirementInputs, baseProbability: number): SensitivityRow[] {
  const rows: SensitivityRow[] = [];
  const make = (label: string, mod: RetirementInputs): void => {
    const p = runMonteCarlo(mod, { sims: SOLVE_SIMS, collectPaths: false }).successProbability;
    rows.push({ label, successProbability: p, deltaVsBase: (p - baseProbability) * 100 });
  };
  make('Returns −1%', withReturnDelta(inputs, -1));
  make('Returns +1%', withReturnDelta(inputs, 1));
  make('Inflation +1%', { ...inputs, generalInflationPct: inputs.generalInflationPct + 1, medicalInflationPct: inputs.medicalInflationPct + 1 });
  make('Inflation −1%', { ...inputs, generalInflationPct: inputs.generalInflationPct - 1, medicalInflationPct: inputs.medicalInflationPct - 1 });
  make('Live 5 yrs longer', { ...inputs, endAge: inputs.endAge + 5 });
  make('Live 5 yrs shorter', { ...inputs, endAge: Math.max(inputs.retirementAge + 1, inputs.endAge - 5) });
  return rows;
}

// ---------------------------------------------------------------------------
// Top-level orchestrator
// ---------------------------------------------------------------------------

export function analyzeRetirement(inputs: RetirementInputs): FullAnalysis {
  const base = runSimulation(inputs);
  const yearsToRet = inputs.retirementAge - inputs.currentAge;
  const retirementYears = inputs.endAge - inputs.retirementAge;

  const requiredCorpusAtRetirement = solveRequiredCorpus(inputs);
  const requiredCorpusToday = requiredCorpusAtRetirement / Math.pow(1 + pct(inputs.generalInflationPct), yearsToRet);

  const requiredMonthlySIP = solveRequiredSIP(inputs);

  // Safe withdrawal is based on the median projected corpus under the current plan.
  const safeMonthlyWithdrawalToday = solveSafeWithdrawalToday(inputs, base.corpusAtRetirement.p50);
  const safeAnnualWithdrawalToday = safeMonthlyWithdrawalToday * 12;

  const sensitivity = computeSensitivity(inputs, base.successProbability);

  return {
    base,
    requiredCorpusAtRetirement,
    requiredCorpusToday,
    requiredMonthlySIP,
    safeMonthlyWithdrawalToday,
    safeAnnualWithdrawalToday,
    sensitivity,
    yearsToRetirement: yearsToRet,
    retirementYears,
  };
}

// ---------------------------------------------------------------------------
// Sensible Indian defaults
// ---------------------------------------------------------------------------

export const DEFAULT_INPUTS: RetirementInputs = {
  currentAge: 30,
  retirementAge: 60,
  endAge: 90,
  currentCorpus: 1000000,
  monthlySIP: 25000,
  annualStepUpPct: 10,
  currentMonthlyExpense: 50000,
  medicalExpenseSharePct: 15,
  generalInflationPct: 6,
  medicalInflationPct: 10,
  equityReturnPct: 12,
  equityVolPct: 17,
  debtReturnPct: 7,
  debtVolPct: 4,
  goldReturnPct: 8,
  goldVolPct: 14,
  startEquityPct: 70,
  startDebtPct: 20,
  startGoldPct: 10,
  glidePath: 'custom-linear',
  minEquityPct: 30,
  postRetirementMonthlyIncome: 0,
  postRetirementIncomeYears: 0,
  includeEPF: false,
  epfCurrentBalance: 500000,
  epfMonthlyContribution: 7200,
  epfReturnPct: 8.25,
  includeNPS: false,
  npsCurrentBalance: 200000,
  npsMonthlyContribution: 5000,
  npsReturnPct: 9,
  npsAnnuityRatePct: 6,
  desiredSuccessProbabilityPct: 90,
  numSimulations: 10000,
  returnModel: 'normal',
};
