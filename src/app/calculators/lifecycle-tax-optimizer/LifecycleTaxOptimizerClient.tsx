'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Calculator, { CalcSlider, CalcSelect } from '@/components/Calculator';
import PayoffTimelineChart, { type TimelineSeries } from '@/components/PayoffTimelineChart';
import InArticleAd from '@/components/InArticleAd';
import { formatINR, formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeLifecycle,
  DEFAULT_LIFECYCLE_INPUTS,
  type LifecycleInputs,
} from '@/lib/lifecycle-tax-optimizer';

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }): React.ReactElement {
  return (
    <div className={`card ${highlight ? 'border-primary border-2' : ''}`}>
      <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-700' : 'text-primary'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-2 mt-1">{sub}</p>}
      {highlight && <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Lowest lifetime tax</span>}
    </div>
  );
}

export default function LifecycleTaxOptimizerClient(): React.ReactElement {
  const [inputs, setInputs] = useState<LifecycleInputs>(DEFAULT_LIFECYCLE_INPUTS);

  useEffect(() => { trackCalculatorUse('lifecycle-tax-optimizer'); }, []);

  const set = useCallback(<K extends keyof LifecycleInputs>(key: K, value: LifecycleInputs[K]): void => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const analysis = useMemo(() => analyzeLifecycle(inputs), [inputs]);

  // Cumulative tax per strategy for the chart.
  const series: TimelineSeries[] = useMemo(() => {
    const cum = (sel: 'newTax' | 'oldTax' | 'chosenTax'): number[] => {
      const out: number[] = [0];
      let s = 0;
      for (const row of analysis.years) { s += row[sel]; out.push(s); }
      return out;
    };
    return [
      { label: 'Optimal', color: '#007A78', timeline: cum('chosenTax') },
      { label: 'Always Old', color: '#d97706', timeline: cum('oldTax') },
      { label: 'Always New', color: '#6366f1', timeline: cum('newTax') },
    ];
  }, [analysis]);

  const npvBest = Math.min(analysis.npv.alwaysNew, analysis.npv.alwaysOld);
  const tableRows = useMemo(() => {
    // Show every year up to 12, then every 2-3 years to keep the table readable.
    return analysis.years.filter((r) => r.yearOffset < 12 || r.yearOffset % 2 === 0 || r.yearOffset === analysis.years.length - 1);
  }, [analysis.years]);

  return (
    <div>
      <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-6 text-sm text-primary-800">
        <strong>100% private.</strong> Your whole salary and tax projection is computed in your browser. nothing is sent to any server.
      </div>

      <Calculator title="Your profile" description="We project your tax under both regimes for every year to your horizon, then pick the cheaper path.">
        <CalcSelect id="emptype" label="Income type" value={inputs.isSalaried ? 'salaried' : 'business'} onChange={(v) => set('isSalaried', v === 'salaried')} options={[
          { value: 'salaried', label: 'Salaried (can switch regime every year)' },
          { value: 'business', label: 'Business / professional (locked once chosen)' },
        ]} />
        <CalcSlider id="age" label="Current age" value={inputs.currentAge} onChange={(v) => set('currentAge', v)} min={18} max={58} step={1} suffix=" yrs" />
        <CalcSlider id="horizon" label="Years to project" value={inputs.horizonYears} onChange={(v) => set('horizonYears', v)} min={3} max={40} step={1} suffix=" yrs" />
        <CalcSlider id="ctc" label="Current annual CTC" value={inputs.currentCTC} onChange={(v) => set('currentCTC', v)} min={300000} max={50000000} step={50000} prefix="₹ " displayValue={formatCompactINR(inputs.currentCTC)} />
        <CalcSlider id="growth" label="Expected annual CTC growth" value={inputs.ctcGrowthPct} onChange={(v) => set('ctcGrowthPct', v)} min={0} max={20} step={0.5} suffix="%" />
        <CalcSlider id="nps2" label="Employer NPS contribution (80CCD(2))" value={inputs.employerNpsPctOfCtc} onChange={(v) => set('employerNpsPctOfCtc', v)} min={0} max={14} step={1} suffix="% of CTC" />
        <CalcSlider id="rent" label="Monthly rent (for HRA)" value={inputs.monthlyRent} onChange={(v) => set('monthlyRent', v)} min={0} max={300000} step={1000} prefix="₹ " displayValue={formatCompactINR(inputs.monthlyRent)} />
        <CalcSelect id="metro" label="City type" value={inputs.isMetro ? 'metro' : 'non'} onChange={(v) => set('isMetro', v === 'metro')} options={[{ value: 'metro', label: 'Metro (50% HRA)' }, { value: 'non', label: 'Non-metro (40% HRA)' }]} />
        <CalcSlider id="d80c" label="Committed 80C (EPF, insurance, etc.)" value={inputs.existing80C} onChange={(v) => set('existing80C', v)} min={0} max={150000} step={5000} prefix="₹ " displayValue={formatCompactINR(inputs.existing80C)} />
        <CalcSlider id="d80d" label="Health insurance premium (80D)" value={inputs.base80D} onChange={(v) => set('base80D', v)} min={0} max={100000} step={5000} prefix="₹ " displayValue={formatCompactINR(inputs.base80D)} />
        <CalcSlider id="loan" label="Planned home loan amount (0 = none)" value={inputs.homeLoanAmount} onChange={(v) => set('homeLoanAmount', v)} min={0} max={50000000} step={500000} prefix="₹ " displayValue={formatCompactINR(inputs.homeLoanAmount)} />
        {inputs.homeLoanAmount > 0 && (
          <>
            <CalcSlider id="loanyr" label="Home loan starts in" value={inputs.homeLoanStartYearOffset} onChange={(v) => set('homeLoanStartYearOffset', v)} min={0} max={20} step={1} suffix=" yrs" />
            <CalcSlider id="loanrate" label="Home loan rate" value={inputs.homeLoanRatePct} onChange={(v) => set('homeLoanRatePct', v)} min={6} max={12} step={0.1} suffix="%" />
          </>
        )}
        <CalcSlider id="appetite" label="Willingness to lock money in 80C/NPS" value={inputs.lockInAppetitePct} onChange={(v) => set('lockInAppetitePct', v)} min={0} max={100} step={10} suffix="%" />
        <CalcSlider id="disc" label="Discount rate (for NPV of future tax)" value={inputs.discountRatePct} onChange={(v) => set('discountRatePct', v)} min={0} max={12} step={0.5} suffix="%" />
      </Calculator>

      {/* Verdict */}
      <div className="mt-8 card bg-green-50 border-green-200">
        <h2 className="text-lg font-bold mb-1">
          {analysis.switchingAllowed
            ? (analysis.crossoverYearOffset === null
              ? 'Stay in the new regime for the whole horizon'
              : `Start in the new regime, then switch to old around age ${analysis.crossoverAge}`)
            : `As a business, lock into the ${analysis.years[0]?.chosenRegime === 'old' ? 'old' : 'new'} regime`}
        </h2>
        <p className="text-sm text-ink">
          Optimising your regime choice over {inputs.horizonYears} years saves an estimated
          <strong> {formatINR(Math.round(analysis.totalSavedVsWorseStaticNPV))}</strong> (present value) versus the worse fixed strategy
          {analysis.crossoverYearOffset !== null && analysis.switchingAllowed ? <>, with the <strong>crossover in year {analysis.crossoverYearOffset + 1}</strong> (age {analysis.crossoverAge}) once your deductions outweigh the new regime&apos;s lower rates</> : null}.
        </p>
      </div>

      {/* NPV comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <StatCard label="Always New regime" value={formatCompactINR(analysis.npv.alwaysNew)} sub="Lifetime tax (NPV)" highlight={analysis.npv.alwaysNew <= npvBest && !analysis.switchingAllowed && analysis.years[0]?.chosenRegime === 'new'} />
        <StatCard label="Always Old regime" value={formatCompactINR(analysis.npv.alwaysOld)} sub="Lifetime tax (NPV)" highlight={analysis.npv.alwaysOld < analysis.npv.alwaysNew && !analysis.switchingAllowed} />
        <StatCard label={analysis.switchingAllowed ? 'Optimal switching' : 'Best fixed regime'} value={formatCompactINR(analysis.npv.optimal)} sub="Lifetime tax (NPV)" highlight />
      </div>

      {/* Recommended first-year mix */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-2">This year&apos;s recommended tax-saving mix</h3>
        {analysis.years[0]?.chosenRegime === 'old' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-sm"><span className="text-muted-2">Section 80C</span><div className="font-semibold">{formatINR(Math.round(analysis.recommendedFirstYearMix.ded80C))}</div></div>
            <div className="text-sm"><span className="text-muted-2">NPS 80CCD(1B)</span><div className="font-semibold">{formatINR(Math.round(analysis.recommendedFirstYearMix.ded80CCD1B))}</div></div>
            <div className="text-sm"><span className="text-muted-2">Health 80D</span><div className="font-semibold">{formatINR(Math.round(analysis.recommendedFirstYearMix.ded80D))}</div></div>
          </div>
        ) : (
          <p className="text-sm text-muted">You&apos;re in the <strong>new regime</strong> this year, so tax-saving lock-ins (80C, 80CCD(1B)) give no benefit. keep that money liquid or in unconstrained investments. Health cover (80D) and employer NPS (80CCD(2)) still make sense for non-tax reasons.</p>
        )}
      </div>

      {/* Chart */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-1">Cumulative tax paid over time</h3>
        <p className="text-xs text-muted-2 mb-3">Lower is better. The optimal line tracks whichever regime is cheaper each year.</p>
        <PayoffTimelineChart series={series} xLabel="Years from now" xTickStepOverride={inputs.horizonYears <= 15 ? 3 : 5} emptyMessage="Adjust inputs to see the projection." />
      </div>

      <InArticleAd />

      {/* Year-by-year table */}
      <div className="card my-6 overflow-x-auto">
        <h3 className="text-base font-semibold mb-3">Year-by-year projection</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-2 border-b border-line">
              <th className="py-2 font-medium">Year</th>
              <th className="py-2 font-medium">Age</th>
              <th className="py-2 font-medium text-right">Income</th>
              <th className="py-2 font-medium text-right">Old tax</th>
              <th className="py-2 font-medium text-right">New tax</th>
              <th className="py-2 font-medium text-center">Regime</th>
              <th className="py-2 font-medium text-right">Post-tax</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((r) => (
              <tr key={r.yearOffset} className="border-b border-line/60">
                <td className="py-2 text-muted-2">{r.yearOffset + 1}</td>
                <td className="py-2 text-ink">{r.age}</td>
                <td className="py-2 text-right">{formatCompactINR(r.grossIncome)}</td>
                <td className={`py-2 text-right ${r.chosenRegime === 'old' ? 'font-semibold text-primary' : 'text-muted-2'}`}>{formatCompactINR(r.oldTax)}</td>
                <td className={`py-2 text-right ${r.chosenRegime === 'new' ? 'font-semibold text-primary' : 'text-muted-2'}`}>{formatCompactINR(r.newTax)}</td>
                <td className="py-2 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded ${r.chosenRegime === 'old' ? 'bg-brand-yellow-soft/70 text-brown' : 'bg-navy/10 text-navy'}`}>{r.chosenRegime === 'old' ? 'Old' : 'New'}</span></td>
                <td className="py-2 text-right">{formatCompactINR(r.postTaxIncome)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Educational estimate, not tax advice.</strong> Projections assume current FY 2025-26 rules persist (you can override constants in the engine), simplified HRA (Basic = 40% of CTC) and a 20-year home-loan amortization. Regime-switching rules, surcharge, and the 80E/80C/80D specifics can change. verify with a qualified Chartered Accountant before filing or committing to lock-in products.
        </p>
      </div>
    </div>
  );
}
