'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Calculator, { CalcSlider, CalcSelect } from '@/components/Calculator';
import PayoffTimelineChart, { type TimelineSeries } from '@/components/PayoffTimelineChart';
import InArticleAd from '@/components/InArticleAd';
import { formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeGoldPlan,
  DEFAULT_GOLD_INPUTS,
  GOLD_DATASET_AS_OF,
  type GoldPlanInputs,
  type RiskProfile,
  type Instrument,
} from '@/lib/gold-planner';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }): React.ReactElement {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-muted-2 mt-1">{sub}</p>}
    </div>
  );
}

export default function GoldPlannerClient(): React.ReactElement {
  const [inputs, setInputs] = useState<GoldPlanInputs>(DEFAULT_GOLD_INPUTS);

  useEffect(() => { trackCalculatorUse('gold-planner'); }, []);

  const set = useCallback(<K extends keyof GoldPlanInputs>(key: K, value: GoldPlanInputs[K]): void => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const a = useMemo(() => analyzeGoldPlan(inputs), [inputs]);

  const series: TimelineSeries[] = useMemo(() => [
    { label: 'SIP value', color: '#007A78', timeline: a.backtest.sipValuePath },
    { label: 'Lump-sum value', color: '#d97706', timeline: a.backtest.lumpsumValuePath },
    { label: 'Amount invested', color: '#9ca3af', timeline: a.backtest.investedPath },
  ].filter((s) => s.timeline.some((v) => v > 0)), [a.backtest]);

  return (
    <div>
      {/* Prominent compliance banner */}
      <div className="rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-3 mb-6 text-sm text-yellow-900">
        <strong>Educational &amp; historical only. not advice, not a prediction.</strong> This tool explains gold&apos;s
        historical behaviour and helps you plan a disciplined allocation. It does not tell you whether to buy or sell, and
        it cannot predict prices. Dataset as of {GOLD_DATASET_AS_OF}.
      </div>

      <Calculator title="Plan your gold allocation" description="Explore how a disciplined gold plan would have behaved historically. All figures are scenarios from a bundled dataset.">
        <CalcSelect id="risk" label="Your risk profile" value={inputs.riskProfile} onChange={(v) => set('riskProfile', v as RiskProfile)} options={[
          { value: 'conservative', label: 'Conservative' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'aggressive', label: 'Aggressive' },
        ]} />
        <CalcSlider id="sip" label="Yearly gold investment (SIP)" value={inputs.monthlyOrAnnualSIP} onChange={(v) => set('monthlyOrAnnualSIP', v)} min={0} max={2000000} step={10000} prefix="₹ " displayValue={formatCompactINR(inputs.monthlyOrAnnualSIP)} />
        <CalcSlider id="lump" label="One-time lump sum (optional)" value={inputs.lumpsum} onChange={(v) => set('lumpsum', v)} min={0} max={10000000} step={50000} prefix="₹ " displayValue={formatCompactINR(inputs.lumpsum)} />
        <CalcSlider id="horizon" label="Horizon (historical window)" value={inputs.horizonYears} onChange={(v) => set('horizonYears', v)} min={1} max={18} step={1} suffix=" years" />
        <CalcSelect id="instrument" label="Instrument" value={inputs.instrument} onChange={(v) => set('instrument', v as Instrument)} options={[
          { value: 'sgb', label: 'Sovereign Gold Bond (SGB)' },
          { value: 'etf', label: 'Gold ETF / Gold Fund' },
          { value: 'physical', label: 'Physical gold' },
          { value: 'digital', label: 'Digital gold' },
        ]} />
        <CalcSlider id="slab" label="Your tax slab (for short-term gains)" value={inputs.marginalSlabPct} onChange={(v) => set('marginalSlabPct', v)} min={0} max={42} step={0.1} suffix="%" />
      </Calculator>

      {/* Allocation band */}
      <div className="card mt-8 bg-primary-50 border-primary-100">
        <h2 className="text-lg font-bold mb-1">Educational allocation band: {a.allocationBand.minPct} to {a.allocationBand.maxPct}% in gold</h2>
        <p className="text-sm text-ink">{a.allocationBand.note}</p>
      </div>

      {/* Historical stats */}
      <div className="my-6">
        <h2 className="heading-2 mb-1">Gold&apos;s historical behaviour</h2>
        <p className="text-sm text-muted-2 mb-4">Based on {a.stats.years} years of bundled INR gold data (as of {GOLD_DATASET_AS_OF}). Past patterns do not predict the future.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Avg annual return" value={`${a.stats.avgAnnualReturnPct}%`} sub="Historical average" />
          <Stat label="Volatility" value={`${a.stats.volatilityPct}%`} sub="Year-to-year swings" />
          <Stat label="Worst drawdown" value={`${a.stats.maxDrawdownPct}%`} sub="Peak-to-trough fall" />
          <Stat label="Nifty correlation" value={`${a.stats.niftyCorrelation}`} sub="Historically low = diversifier" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Stat label="Best year" value={`${a.stats.bestYear.pct}%`} sub={`in ${a.stats.bestYear.year}`} />
          <Stat label="Worst year" value={`${a.stats.worstYear.pct}%`} sub={`in ${a.stats.worstYear.year}`} />
          <Stat label={`${a.entryTimingSpread.windowYears}-yr return range by entry`} value={`${a.entryTimingSpread.minCagrPct}% to ${a.entryTimingSpread.maxCagrPct}%`} sub={`${a.entryTimingSpread.spreadPct}-pt spread. timing is hard`} />
        </div>
      </div>

      {/* Rolling returns */}
      <div className="card my-6 overflow-x-auto">
        <h3 className="text-base font-semibold mb-1">Rolling returns by holding period</h3>
        <p className="text-xs text-muted-2 mb-3">Annualised return across every historical window of each length. The wide min to max range is the point: outcomes depend heavily on when you started.</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-2 border-b border-line"><th className="py-2 font-medium">Holding</th><th className="py-2 font-medium text-right">Worst</th><th className="py-2 font-medium text-right">Average</th><th className="py-2 font-medium text-right">Best</th><th className="py-2 font-medium text-right">% positive</th></tr></thead>
          <tbody>
            {a.rolling.map((r) => (
              <tr key={r.windowYears} className="border-b border-line/60">
                <td className="py-2 text-ink">{r.windowYears} year{r.windowYears > 1 ? 's' : ''}</td>
                <td className={`py-2 text-right ${r.minCagrPct < 0 ? 'text-red-600' : ''}`}>{r.minCagrPct}%</td>
                <td className="py-2 text-right font-medium">{r.avgCagrPct}%</td>
                <td className="py-2 text-right text-green-700">{r.maxCagrPct}%</td>
                <td className="py-2 text-right">{Math.round(r.positiveShare * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SIP vs lumpsum backtest */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-1">SIP vs lump-sum: a historical replay</h3>
        <p className="text-xs text-muted-2 mb-3">
          How investing your amount as a yearly SIP vs all-at-once would have played out over the last {a.backtest.windowYears} years of the dataset
          {inputs.instrument === 'sgb' ? ' (including SGB 2.5% interest)' : ''}. This is a historical scenario, not a forecast.
        </p>
        {series.length > 0 ? (
          <>
            <PayoffTimelineChart series={series} xLabel="Years into the window" xTickStepOverride={a.backtest.windowYears <= 12 ? 2 : 3} emptyMessage="Enter an amount to see the historical backtest." />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm">
              <div><span className="text-muted-2 block text-xs">Total invested</span><strong>{formatCompactINR(a.backtest.totalInvested)}</strong></div>
              {a.backtest.sipFinalValue > 0 && <div><span className="text-muted-2 block text-xs">SIP final value</span><strong className="text-primary">{formatCompactINR(a.backtest.sipFinalValue)}</strong></div>}
              {a.backtest.lumpsumFinalValue > 0 && <div><span className="text-muted-2 block text-xs">Lump-sum final value</span><strong className="text-navy">{formatCompactINR(a.backtest.lumpsumFinalValue)}</strong></div>}
            </div>
          </>
        ) : <p className="text-sm text-muted-2 py-6 text-center">Enter a yearly SIP or lump sum to see the historical backtest.</p>}
      </div>

      <InArticleAd />

      {/* Instrument comparison */}
      <div className="card my-6 overflow-x-auto">
        <h3 className="text-base font-semibold mb-1">Ways to hold gold. tax &amp; key notes</h3>
        <p className="text-xs text-muted-2 mb-3">Tax as of FY 2025-26. Long-term gains taxed at 12.5% + 4% cess; short-term at your slab. Verify current rules before acting.</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-2 border-b border-line"><th className="py-2 font-medium">Instrument</th><th className="py-2 font-medium">Long-term after</th><th className="py-2 font-medium">Notes</th></tr></thead>
          <tbody>
            {a.allInstruments.map((inst) => (
              <tr key={inst.instrument} className={`border-b border-line/60 ${inst.instrument === inputs.instrument ? 'bg-primary-50' : ''}`}>
                <td className="py-2 font-medium text-ink">{inst.label}</td>
                <td className="py-2 text-muted">{inst.longTermMonths} months → {inst.longTermRatePct}%</td>
                <td className="py-2 text-muted"><div>{inst.extra}</div><div className={`text-xs mt-0.5 ${inst.instrument === 'digital' ? 'text-red-600 font-medium' : 'text-muted-2'}`}>{inst.sebiCaveat}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Educational notes */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-3">What the history teaches</h3>
        <ul className="space-y-2 list-disc pl-5">
          {a.educationalNotes.map((n, i) => <li key={i} className="text-sm text-ink">{n}</li>)}
        </ul>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-xs text-yellow-900"><strong>Disclaimer:</strong> {a.disclaimer}</p>
      </div>
    </div>
  );
}
