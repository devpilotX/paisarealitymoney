/**
 * Gold Allocation & Cost-Averaging Explainer — test suite (24 cases incl. compliance scan)
 * Run: npx ts-node --project tsconfig.scripts.json tests/gold-planner.test.ts
 */

import {
  type Instrument,
  GOLD_NIFTY_RETURNS,
  goldHistoricalStats,
  rollingReturns,
  backtestSIPvsLumpsum,
  allocationBandFor,
  goldTax,
  instrumentTable,
  priceSeriesFromReturns,
  analyzeGoldPlan,
  DEFAULT_GOLD_INPUTS,
} from '../src/lib/gold-planner';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }
function approx(a: number, b: number, tol: number): boolean { return Math.abs(a - b) <= tol; }

// Independent re-implementations to verify reproducibility from the dataset.
function refMean(xs: number[]): number { return xs.reduce((s, x) => s + x, 0) / xs.length; }
function refStdev(xs: number[]): number { const m = refMean(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); }

// ---------------------------------------------------------------------------

test('1. Historical average return reproduces from the dataset', () => {
  const gold = GOLD_NIFTY_RETURNS.map((d) => d.goldPct);
  const stats = goldHistoricalStats();
  assert(approx(stats.avgAnnualReturnPct, refMean(gold), 0.01), `avg ${stats.avgAnnualReturnPct} == ${refMean(gold).toFixed(2)}`);
});

test('2. Volatility reproduces (sample stdev of annual returns)', () => {
  const gold = GOLD_NIFTY_RETURNS.map((d) => d.goldPct);
  const stats = goldHistoricalStats();
  assert(approx(stats.volatilityPct, refStdev(gold), 0.01), `vol ${stats.volatilityPct} == ${refStdev(gold).toFixed(2)}`);
});

test('3. Best & worst year match the dataset extremes', () => {
  const stats = goldHistoricalStats();
  const gold = GOLD_NIFTY_RETURNS.map((d) => d.goldPct);
  assert(stats.bestYear.pct === Math.max(...gold), `best year ${stats.bestYear.year} (${stats.bestYear.pct}%)`);
  assert(stats.worstYear.pct === Math.min(...gold), `worst year ${stats.worstYear.year} (${stats.worstYear.pct}%)`);
});

test('4. Max drawdown reproduces from the cumulative price series', () => {
  const gold = GOLD_NIFTY_RETURNS.map((d) => d.goldPct);
  const series = priceSeriesFromReturns(gold);
  let peak = series[0]!; let maxDd = 0;
  for (const v of series) { if (v > peak) peak = v; maxDd = Math.max(maxDd, (peak - v) / peak); }
  assert(approx(goldHistoricalStats().maxDrawdownPct, maxDd * 100, 0.01), `drawdown ${goldHistoricalStats().maxDrawdownPct}% reproduces`);
});

test('5. Nifty correlation is in [-1, 1] and historically low (diversifier)', () => {
  const c = goldHistoricalStats().niftyCorrelation;
  assert(c >= -1 && c <= 1, `correlation ${c} in range`);
  assert(c < 0.6, `correlation ${c} is historically low`);
});

test('6. Rolling returns: min ≤ avg ≤ max and positive share in [0,1]', () => {
  const r = rollingReturns(5);
  assert(r.minCagrPct <= r.avgCagrPct + 1e-9 && r.avgCagrPct <= r.maxCagrPct + 1e-9, `min ${r.minCagrPct} ≤ avg ${r.avgCagrPct} ≤ max ${r.maxCagrPct}`);
  assert(r.positiveShare >= 0 && r.positiveShare <= 1, 'positive share in [0,1]');
});

test('7. Entry-timing spread is non-negative (teaches timing is hard)', () => {
  const a = analyzeGoldPlan(DEFAULT_GOLD_INPUTS);
  assert(a.entryTimingSpread.spreadPct >= 0, `spread ${a.entryTimingSpread.spreadPct} ≥ 0`);
  assert(a.entryTimingSpread.maxCagrPct >= a.entryTimingSpread.minCagrPct, 'max ≥ min CAGR');
});

test('8. SIP backtest: invested total and path length are correct', () => {
  const b = backtestSIPvsLumpsum(60000, 0, 10, 'etf');
  assert(b.totalInvested === 60000 * 10, `invested ₹${b.totalInvested}`);
  assert(b.sipValuePath.length === b.windowYears, 'one value per year');
  assert(b.sipFinalValue > 0, 'SIP final value positive');
});

test('9. Lumpsum backtest multiple reproduces from the price series', () => {
  const b = backtestSIPvsLumpsum(0, 100000, 10, 'etf');
  const gold = GOLD_NIFTY_RETURNS.slice(GOLD_NIFTY_RETURNS.length - 10).map((d) => d.goldPct);
  const series = priceSeriesFromReturns(gold);
  const expectedMultiple = (series[series.length - 1]! / series[0]!);
  assert(approx(b.lumpsumMultiple, expectedMultiple, 0.02), `lumpsum multiple ${b.lumpsumMultiple} ≈ ${expectedMultiple.toFixed(2)}`);
});

test('10. SGB adds 2.5% interest, beating an identical ETF backtest', () => {
  const sgb = backtestSIPvsLumpsum(0, 100000, 10, 'sgb');
  const etf = backtestSIPvsLumpsum(0, 100000, 10, 'etf');
  assert(sgb.lumpsumFinalValue > etf.lumpsumFinalValue, `SGB ₹${sgb.lumpsumFinalValue} > ETF ₹${etf.lumpsumFinalValue} (interest)`);
});

test('11. Allocation bands: conservative ≥ moderate ≥ aggressive (upper bound)', () => {
  assert(allocationBandFor('conservative').maxPct >= allocationBandFor('moderate').maxPct, 'conservative ≥ moderate');
  assert(allocationBandFor('moderate').maxPct >= allocationBandFor('aggressive').maxPct, 'moderate ≥ aggressive');
  assert(allocationBandFor('moderate').minPct === 5 && allocationBandFor('moderate').maxPct === 15, 'moderate band 5–15%');
});

test('12. Gold tax: SGB/ETF long-term (>12m) at 12.5% + 4% cess', () => {
  assert(goldTax(100000, 24, 'etf', 31.2) === Math.round(100000 * 0.125 * 1.04), `ETF LT ₹${goldTax(100000, 24, 'etf', 31.2)} == ₹13,000`);
  assert(goldTax(100000, 24, 'sgb', 31.2) === 13000, 'SGB LT == ₹13,000');
});

test('13. Gold tax: ETF/SGB short-term (≤12m) at slab', () => {
  assert(goldTax(100000, 6, 'etf', 30) === Math.round(100000 * 0.30 * 1.04), `ETF ST at slab ₹${goldTax(100000, 6, 'etf', 30)}`);
});

test('14. Gold tax: physical/digital long-term needs > 24 months', () => {
  assert(goldTax(100000, 24, 'physical', 30) === Math.round(100000 * 0.30 * 1.04), 'physical at 24m is still short-term (slab)');
  assert(goldTax(100000, 30, 'physical', 30) === Math.round(100000 * 0.125 * 1.04), 'physical at 30m is long-term (12.5%)');
  assert(goldTax(100000, 30, 'digital', 30) === 13000, 'digital at 30m is long-term');
});

test('15. Gold tax: zero or negative gain → zero tax', () => {
  assert(goldTax(0, 30, 'etf', 31.2) === 0, 'no gain → no tax');
  assert(goldTax(-5000, 30, 'physical', 31.2) === 0, 'loss → no tax');
});

test('16. Instrument table flags digital gold as NOT SEBI/RBI regulated', () => {
  const digital = instrumentTable().find((i) => i.instrument === 'digital')!;
  assert(/not regulated by sebi/i.test(digital.sebiCaveat), 'digital gold caveat present');
  const sgb = instrumentTable().find((i) => i.instrument === 'sgb')!;
  assert(/2\.5%/.test(sgb.extra) && /tax-free/i.test(sgb.extra), 'SGB notes 2.5% interest + tax-free maturity');
});

test('17. Analysis bundle is coherent and deterministic', () => {
  const a = analyzeGoldPlan(DEFAULT_GOLD_INPUTS);
  const b = analyzeGoldPlan(DEFAULT_GOLD_INPUTS);
  assert(a.backtest.sipFinalValue === b.backtest.sipFinalValue, 'deterministic');
  assert(a.rolling.length === 4 && a.allInstruments.length === 4, 'rolling windows + instruments populated');
});

test('18. Disclaimer explicitly says "not advice" and "not a prediction"', () => {
  const a = analyzeGoldPlan(DEFAULT_GOLD_INPUTS);
  assert(/not investment advice/i.test(a.disclaimer), 'disclaimer says not advice');
  assert(/not a price prediction/i.test(a.disclaimer), 'disclaimer says not a prediction');
});

// ----- COMPLIANCE: no output may constitute a buy/sell signal or price prediction -----
const BANNED = [
  'buy now', 'sell now', 'you should buy', 'you should sell', 'should buy now',
  'we recommend buying', 'we recommend selling', 'recommend you buy', 'recommend you sell',
  'will rise', 'will fall', 'will go up', 'will go down', 'guaranteed return', 'guaranteed profit',
  'good time to buy', 'best time to buy', 'right time to buy', 'invest now', 'price target',
  'strong buy', 'must buy', 'sure shot', 'multibagger', 'price will',
];
function scanForBanned(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED.filter((p) => lower.includes(p));
}
function collectAllText(): string[] {
  const out: string[] = [];
  for (const profile of ['conservative', 'moderate', 'aggressive'] as const) {
    for (const instrument of ['physical', 'sgb', 'etf', 'digital'] as Instrument[]) {
      const a = analyzeGoldPlan({ ...DEFAULT_GOLD_INPUTS, riskProfile: profile, instrument });
      out.push(a.disclaimer, a.allocationBand.note, ...a.educationalNotes, a.selectedInstrument.extra, a.selectedInstrument.sebiCaveat);
      for (const inst of a.allInstruments) out.push(inst.extra, inst.sebiCaveat, inst.shortTermNote, inst.label);
    }
  }
  return out;
}

test('19. COMPLIANCE: no output contains a buy/sell signal or price prediction', () => {
  const all = collectAllText();
  const violations: string[] = [];
  for (const t of all) { const hits = scanForBanned(t); if (hits.length) violations.push(`"${hits.join(', ')}" in: ${t.slice(0, 60)}…`); }
  assert(violations.length === 0, violations.length === 0 ? 'all output strings are compliant (neutral/historical)' : `VIOLATIONS: ${violations.join(' | ')}`);
});

test('20. COMPLIANCE: educational notes use historical/scenario framing', () => {
  const a = analyzeGoldPlan(DEFAULT_GOLD_INPUTS);
  const joined = a.educationalNotes.join(' ').toLowerCase();
  assert(/histor|past|scenario/.test(joined), 'notes are framed historically');
  assert(/not a recommendation|not advice|do not predict|not a prediction/.test(joined), 'notes carry a neutrality caveat');
});

test('21. COMPLIANCE: allocation band is framed as educational, not a recommendation', () => {
  for (const p of ['conservative', 'moderate', 'aggressive'] as const) {
    const note = allocationBandFor(p).note.toLowerCase();
    assert(/not a recommendation|educational|not personalised advice|general information/.test(note), `${p} band carries a neutrality caveat`);
  }
});

test('22. priceSeriesFromReturns is correct (compounding)', () => {
  const s = priceSeriesFromReturns([10, -10]);
  assert(s.length === 3 && s[0] === 100, 'base 100');
  assert(approx(s[1]!, 110, 1e-9) && approx(s[2]!, 99, 1e-9), 'compounds 110 then 99');
});

test('23. Edge: zero-investment backtest does not crash and yields zero values', () => {
  const b = backtestSIPvsLumpsum(0, 0, 5, 'physical');
  assert(b.sipFinalValue === 0 && b.lumpsumFinalValue === 0, 'no investment → zero values');
});

test('24. Edge: horizon longer than the dataset is clamped', () => {
  const b = backtestSIPvsLumpsum(10000, 0, 100, 'etf');
  assert(b.windowYears <= GOLD_NIFTY_RETURNS.length, `window clamped to ${b.windowYears} years`);
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
