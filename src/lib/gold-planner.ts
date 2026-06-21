/**
 * Gold Allocation & Cost-Averaging Explainer. engine
 * ===================================================
 * A NEUTRAL, EDUCATIONAL, historical-analysis + planning tool. It does NOT predict gold prices and
 * does NOT issue buy/sell signals. that would be regulated investment advice. Every output is
 * framed as a historical pattern or a scenario, never as a recommendation to transact.
 *
 * It bundles an illustrative INR gold dataset (with an "as of" date), computes rolling returns,
 * volatility, max drawdown and correlation with the Nifty, shows how SIP/cost-averaging vs a lump
 * sum WOULD HAVE performed historically, compares instruments (physical, SGB, Gold ETF, digital
 * gold) with their tax treatment, and offers commonly-cited educational allocation bands.
 *
 * Pure, deterministic functions. Nothing here is investment advice or a price prediction.
 */

// ---------------------------------------------------------------------------
// Bundled dataset (illustrative. verify before relying on it)
// ---------------------------------------------------------------------------

/**
 * Approximate annual total returns (%) for INR gold and the Nifty 50 TRI, compiled for educational
 * historical analysis. These are rounded approximations, NOT official index values. verify against
 * IBJA / RBI (gold) and NSE (Nifty) before relying on them.
 *
 * Dataset "as of": 2024-03-31 (FY 2023-24 close). Last reviewed: 2025-06-21.
 */
export const GOLD_DATASET_AS_OF = '2024-03-31';

export interface YearReturn { year: number; goldPct: number; niftyPct: number }

export const GOLD_NIFTY_RETURNS: readonly YearReturn[] = [
  { year: 2005, goldPct: 21.8, niftyPct: 38.5 },
  { year: 2006, goldPct: 20.5, niftyPct: 41.9 },
  { year: 2007, goldPct: 17.1, niftyPct: 56.8 },
  { year: 2008, goldPct: 26.5, niftyPct: -51.8 },
  { year: 2009, goldPct: 24.1, niftyPct: 77.6 },
  { year: 2010, goldPct: 23.2, niftyPct: 19.2 },
  { year: 2011, goldPct: 31.4, niftyPct: -23.8 },
  { year: 2012, goldPct: 12.2, niftyPct: 29.4 },
  { year: 2013, goldPct: -4.5, niftyPct: 8.1 },
  { year: 2014, goldPct: -7.8, niftyPct: 32.9 },
  { year: 2015, goldPct: -6.4, niftyPct: -3.0 },
  { year: 2016, goldPct: 11.4, niftyPct: 4.4 },
  { year: 2017, goldPct: 5.4, niftyPct: 30.3 },
  { year: 2018, goldPct: 7.8, niftyPct: 4.6 },
  { year: 2019, goldPct: 23.6, niftyPct: 13.5 },
  { year: 2020, goldPct: 28.1, niftyPct: 16.1 },
  { year: 2021, goldPct: -4.1, niftyPct: 25.6 },
  { year: 2022, goldPct: 13.5, niftyPct: 5.7 },
  { year: 2023, goldPct: 15.1, niftyPct: 21.3 },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';
export type Instrument = 'physical' | 'sgb' | 'etf' | 'digital';

export interface HistoricalStats {
  years: number;
  avgAnnualReturnPct: number;
  volatilityPct: number; // stdev of annual returns
  maxDrawdownPct: number; // worst peak-to-trough on the cumulative series
  bestYear: { year: number; pct: number };
  worstYear: { year: number; pct: number };
  niftyCorrelation: number; // -1..1
}

export interface RollingStats {
  windowYears: number;
  minCagrPct: number;
  maxCagrPct: number;
  avgCagrPct: number;
  positiveShare: number; // fraction of windows with positive CAGR
}

export interface BacktestResult {
  windowYears: number;
  totalInvested: number;
  sipFinalValue: number;
  lumpsumFinalValue: number;
  sipMultiple: number;
  lumpsumMultiple: number;
  sipValuePath: number[]; // value at each year-end (SIP)
  lumpsumValuePath: number[];
  investedPath: number[];
}

export interface AllocationBand { riskProfile: RiskProfile; minPct: number; maxPct: number; note: string }

export interface InstrumentInfo {
  instrument: Instrument;
  label: string;
  longTermMonths: number;
  longTermRatePct: number;
  shortTermNote: string;
  extra: string;
  sebiCaveat: string;
}

export interface GoldPlanInputs {
  monthlyOrAnnualSIP: number;
  lumpsum: number;
  horizonYears: number;
  riskProfile: RiskProfile;
  instrument: Instrument;
  marginalSlabPct: number;
}

export interface GoldPlanAnalysis {
  stats: HistoricalStats;
  rolling: RollingStats[];
  entryTimingSpread: { windowYears: number; minCagrPct: number; maxCagrPct: number; spreadPct: number };
  backtest: BacktestResult;
  allocationBand: AllocationBand;
  allInstruments: InstrumentInfo[];
  selectedInstrument: InstrumentInfo;
  educationalNotes: string[];
  disclaimer: string;
}

const CESS = 0.04;

// ---------------------------------------------------------------------------
// Core stats helpers
// ---------------------------------------------------------------------------

function mean(xs: number[]): number { return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0; }

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = (a[i] ?? 0) - ma;
    const y = (b[i] ?? 0) - mb;
    num += x * y; da += x * x; db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

/** Cumulative price series (index, base 100) from a list of annual return %. */
export function priceSeriesFromReturns(returnsPct: number[], base = 100): number[] {
  const series = [base];
  let v = base;
  for (const r of returnsPct) { v *= 1 + r / 100; series.push(v); }
  return series;
}

function maxDrawdown(series: number[]): number {
  let peak = series[0] ?? 0;
  let maxDd = 0;
  for (const v of series) {
    if (v > peak) peak = v;
    if (peak > 0) {
      const dd = (peak - v) / peak;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd * 100;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Historical stats
// ---------------------------------------------------------------------------

export function goldHistoricalStats(data: readonly YearReturn[] = GOLD_NIFTY_RETURNS): HistoricalStats {
  const gold = data.map((d) => d.goldPct);
  const nifty = data.map((d) => d.niftyPct);
  let best = data[0]!; let worst = data[0]!;
  for (const d of data) { if (d.goldPct > best.goldPct) best = d; if (d.goldPct < worst.goldPct) worst = d; }
  return {
    years: data.length,
    avgAnnualReturnPct: round2(mean(gold)),
    volatilityPct: round2(stdev(gold)),
    maxDrawdownPct: round2(maxDrawdown(priceSeriesFromReturns(gold))),
    bestYear: { year: best.year, pct: best.goldPct },
    worstYear: { year: worst.year, pct: worst.goldPct },
    niftyCorrelation: round2(correlation(gold, nifty)),
  };
}

/** Rolling CAGR statistics over all windows of the given length. */
export function rollingReturns(windowYears: number, data: readonly YearReturn[] = GOLD_NIFTY_RETURNS): RollingStats {
  const gold = data.map((d) => d.goldPct);
  const cagrs: number[] = [];
  for (let start = 0; start + windowYears <= gold.length; start++) {
    let growth = 1;
    for (let k = 0; k < windowYears; k++) growth *= 1 + (gold[start + k] ?? 0) / 100;
    cagrs.push((Math.pow(growth, 1 / windowYears) - 1) * 100);
  }
  if (cagrs.length === 0) return { windowYears, minCagrPct: 0, maxCagrPct: 0, avgCagrPct: 0, positiveShare: 0 };
  const positive = cagrs.filter((c) => c > 0).length;
  return {
    windowYears,
    minCagrPct: round2(Math.min(...cagrs)),
    maxCagrPct: round2(Math.max(...cagrs)),
    avgCagrPct: round2(mean(cagrs)),
    positiveShare: round2(positive / cagrs.length),
  };
}

// ---------------------------------------------------------------------------
// SIP vs lumpsum backtest (historical, annual granularity, reproducible)
// ---------------------------------------------------------------------------

/**
 * Replays the most recent `windowYears` of the dataset. SIP invests an equal amount at the start of
 * each year; lumpsum invests everything at the start. SGB adds 2.5%/yr interest on the invested
 * principal (illustrative). This is a HISTORICAL replay, not a forecast.
 */
export function backtestSIPvsLumpsum(
  perYearSIP: number,
  lumpsum: number,
  windowYears: number,
  instrument: Instrument,
  data: readonly YearReturn[] = GOLD_NIFTY_RETURNS,
): BacktestResult {
  const w = Math.max(1, Math.min(windowYears, data.length));
  const slice = data.slice(data.length - w);
  const prices = priceSeriesFromReturns(slice.map((d) => d.goldPct)); // length w+1
  const startPrice = prices[0] ?? 100;
  const sgbInterest = instrument === 'sgb' ? 0.025 : 0;

  // Lumpsum: buy all units at the start.
  const lumpUnits = lumpsum > 0 ? lumpsum / startPrice : 0;

  // SIP: buy at the start of each year.
  let sipUnits = 0;
  let invested = 0;
  const sipValuePath: number[] = [];
  const lumpsumValuePath: number[] = [];
  const investedPath: number[] = [];
  for (let y = 0; y < w; y++) {
    sipUnits += perYearSIP > 0 ? perYearSIP / (prices[y] ?? startPrice) : 0;
    invested += perYearSIP;
    const priceEnd = prices[y + 1] ?? startPrice;
    sipValuePath.push(sipUnits * priceEnd);
    lumpsumValuePath.push(lumpUnits * priceEnd);
    investedPath.push(invested + lumpsum);
  }
  const finalPrice = prices[w] ?? startPrice;
  // Add SGB interest (simple) on principal over the period.
  const sipInterest = sgbInterest > 0 ? perYearSIP * sgbInterest * (w * (w + 1) / 2) : 0; // each year's SIP earns interest for remaining years
  const lumpInterest = sgbInterest > 0 ? lumpsum * sgbInterest * w : 0;
  const sipFinalValue = sipUnits * finalPrice + sipInterest;
  const lumpsumFinalValue = lumpUnits * finalPrice + lumpInterest;
  const totalInvested = perYearSIP * w + lumpsum;

  return {
    windowYears: w,
    totalInvested,
    sipFinalValue: Math.round(sipFinalValue),
    lumpsumFinalValue: Math.round(lumpsumFinalValue),
    sipMultiple: totalInvested > 0 ? round2(sipFinalValue / (perYearSIP * w || 1)) : 0,
    lumpsumMultiple: lumpsum > 0 ? round2(lumpsumFinalValue / lumpsum) : 0,
    sipValuePath: sipValuePath.map((v) => Math.round(v)),
    lumpsumValuePath: lumpsumValuePath.map((v) => Math.round(v)),
    investedPath: investedPath.map((v) => Math.round(v)),
  };
}

// ---------------------------------------------------------------------------
// Allocation bands (educational, commonly cited. NOT advice)
// ---------------------------------------------------------------------------

export function allocationBandFor(riskProfile: RiskProfile): AllocationBand {
  switch (riskProfile) {
    case 'conservative':
      return { riskProfile, minPct: 10, maxPct: 20, note: 'Commentators often cite a larger gold sleeve for conservative portfolios as a diversifier. This is a commonly-cited educational range, not a recommendation.' };
    case 'aggressive':
      return { riskProfile, minPct: 0, maxPct: 10, note: 'Growth-tilted portfolios are often described with a smaller gold sleeve. This is a commonly-cited educational range, not a recommendation.' };
    default:
      return { riskProfile: 'moderate', minPct: 5, maxPct: 15, note: 'A 5–15% band is a widely-quoted educational guideline for a diversified portfolio. This is general information, not personalised advice.' };
  }
}

// ---------------------------------------------------------------------------
// Tax by instrument
// ---------------------------------------------------------------------------

export function goldTax(gain: number, holdingMonths: number, instrument: Instrument, marginalSlabPct: number): number {
  if (gain <= 0) return 0;
  const slab = marginalSlabPct / 100;
  const ltMonths = instrument === 'physical' || instrument === 'digital' ? 24 : 12;
  const isLong = holdingMonths > ltMonths;
  const rate = isLong ? 0.125 : slab;
  return Math.round(gain * rate * (1 + CESS));
}

export function instrumentTable(): InstrumentInfo[] {
  return [
    { instrument: 'sgb', label: 'Sovereign Gold Bond (SGB)', longTermMonths: 12, longTermRatePct: 12.5, shortTermNote: 'Slab if sold within 12 months on exchange', extra: 'Pays 2.5% annual interest (taxable at slab). Capital gain on redemption at maturity (8 years) is tax-free. Govt-backed.', sebiCaveat: 'Issued by RBI. among the most regulated options.' },
    { instrument: 'etf', label: 'Gold ETF / Gold Fund', longTermMonths: 12, longTermRatePct: 12.5, shortTermNote: 'Slab if held 12 months or less', extra: 'Exchange-traded, low cost, no making charges, demat held. Tracks gold price.', sebiCaveat: 'SEBI-regulated mutual fund / ETF.' },
    { instrument: 'physical', label: 'Physical gold (jewellery/coins)', longTermMonths: 24, longTermRatePct: 12.5, shortTermNote: 'Slab if held 24 months or less', extra: 'Making charges and purity/storage risk reduce returns vs paper gold.', sebiCaveat: 'Not a financial product; quality and storage are your responsibility.' },
    { instrument: 'digital', label: 'Digital gold', longTermMonths: 24, longTermRatePct: 12.5, shortTermNote: 'Slab if held 24 months or less', extra: 'Convenient small-ticket buying, but spreads and platform risk apply.', sebiCaveat: 'Digital gold is NOT regulated by SEBI or the RBI. counterparty/platform risk is a known concern flagged by regulators.' },
  ];
}

// ---------------------------------------------------------------------------
// Top-level analysis (neutral, educational text only)
// ---------------------------------------------------------------------------

export function analyzeGoldPlan(inputs: GoldPlanInputs): GoldPlanAnalysis {
  const stats = goldHistoricalStats();
  const rolling = [1, 3, 5, 7].map((w) => rollingReturns(w));
  const r5 = rollingReturns(Math.min(5, GOLD_NIFTY_RETURNS.length));
  const entryTimingSpread = {
    windowYears: r5.windowYears,
    minCagrPct: r5.minCagrPct,
    maxCagrPct: r5.maxCagrPct,
    spreadPct: round2(r5.maxCagrPct - r5.minCagrPct),
  };
  const backtest = backtestSIPvsLumpsum(inputs.monthlyOrAnnualSIP, inputs.lumpsum, inputs.horizonYears, inputs.instrument);
  const allInstruments = instrumentTable();
  const selectedInstrument = allInstruments.find((i) => i.instrument === inputs.instrument) ?? allInstruments[0]!;
  const allocationBand = allocationBandFor(inputs.riskProfile);

  const educationalNotes: string[] = [
    `Over the ${stats.years} years in this dataset, INR gold returned about ${stats.avgAnnualReturnPct}% a year on average, with annual swings (volatility) of about ${stats.volatilityPct}% and a worst peak-to-trough fall of about ${stats.maxDrawdownPct}%. Past patterns do not predict the future.`,
    `Gold's year-to-year correlation with the Nifty was about ${stats.niftyCorrelation} in this dataset. historically low, which is why gold is often discussed as a diversifier rather than a growth engine.`,
    `Across historical ${entryTimingSpread.windowYears}-year windows, the annualised return ranged from ${entryTimingSpread.minCagrPct}% to ${entryTimingSpread.maxCagrPct}% depending purely on WHEN you started. a ${entryTimingSpread.spreadPct}-point spread. This illustrates how hard timing is, which is why disciplined cost-averaging is a common approach.`,
    'These are historical observations and scenarios for learning only. They are not advice, not a recommendation to buy or sell, and not a prediction of future prices.',
  ];

  return {
    stats,
    rolling,
    entryTimingSpread,
    backtest,
    allocationBand,
    allInstruments,
    selectedInstrument,
    educationalNotes,
    disclaimer: 'Educational and historical information only. not investment advice and not a price prediction. Gold prices can fall as well as rise; historical patterns do not guarantee future results. Consult a SEBI-registered investment adviser before making any decision.',
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_GOLD_INPUTS: GoldPlanInputs = {
  monthlyOrAnnualSIP: 60000, // per year (₹5,000/month)
  lumpsum: 0,
  horizonYears: 10,
  riskProfile: 'moderate',
  instrument: 'sgb',
  marginalSlabPct: 31.2,
};
