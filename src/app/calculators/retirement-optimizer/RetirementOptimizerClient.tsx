'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Calculator, { CalcSlider, CalcSelect } from '@/components/Calculator';
import FanChart from '@/components/FanChart';
import SuccessGauge from '@/components/SuccessGauge';
import InArticleAd from '@/components/InArticleAd';
import { formatINR, formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeRetirement,
  DEFAULT_INPUTS,
  deterministicCorpusAtRetirement,
  annualExpenseAtAge,
  closedFormRequiredCorpus,
  equityFractionAtAge,
  HISTORICAL_RETURNS_AS_OF,
  type RetirementInputs,
  type FullAnalysis,
} from '@/lib/retirement-optimizer';

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'good' | 'warn' | 'bad' }): React.ReactElement {
  const toneClass =
    tone === 'good' ? 'text-green-700' : tone === 'warn' ? 'text-amber-700' : tone === 'bad' ? 'text-red-700' : 'text-primary';
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }): React.ReactElement {
  return (
    <div className={`flex justify-between gap-4 text-sm py-1 ${strong ? 'font-semibold border-t border-gray-200 pt-2 mt-1' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span className={strong ? 'text-gray-900' : 'font-medium text-gray-900'}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RetirementOptimizerClient(): React.ReactElement {
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_INPUTS);
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [computing, setComputing] = useState<boolean>(true);
  const [showWorking, setShowWorking] = useState<boolean>(false);

  const workerRef = useRef<Worker | null>(null);
  const workerOkRef = useRef<boolean>(false);

  const set = useCallback(<K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]): void => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Set up the worker once (with graceful fallback to synchronous compute).
  useEffect(() => {
    trackCalculatorUse('retirement-optimizer');
    try {
      const worker = new Worker(new URL('./retirement.worker.ts', import.meta.url));
      worker.onmessage = (e: MessageEvent<FullAnalysis>): void => {
        setAnalysis(e.data);
        setComputing(false);
      };
      worker.onerror = (): void => {
        workerOkRef.current = false;
      };
      workerRef.current = worker;
      workerOkRef.current = true;
    } catch {
      workerOkRef.current = false;
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Debounced recompute whenever inputs change.
  useEffect(() => {
    setComputing(true);
    const id = setTimeout(() => {
      const worker = workerRef.current;
      if (worker && workerOkRef.current) {
        worker.postMessage(inputs);
      } else {
        // Synchronous fallback (e.g. worker unsupported): compute on the main thread.
        const result = analyzeRetirement(inputs);
        setAnalysis(result);
        setComputing(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [inputs]);

  // Derived "show calculation" figures (cheap, deterministic. safe to compute inline).
  const working = useMemo(() => {
    const det = deterministicCorpusAtRetirement(inputs);
    const firstWithdrawal = annualExpenseAtAge(inputs, inputs.retirementAge);
    const postReturnApprox =
      (inputs.minEquityPct / 100) * inputs.equityReturnPct + (1 - inputs.minEquityPct / 100) * inputs.debtReturnPct;
    const detRequired = closedFormRequiredCorpus(
      firstWithdrawal,
      inputs.generalInflationPct,
      postReturnApprox,
      Math.max(1, inputs.endAge - inputs.retirementAge),
    );
    return { det, firstWithdrawal, detRequired, postReturnApprox };
  }, [inputs]);

  const target = inputs.desiredSuccessProbabilityPct / 100;
  const success = analysis?.base.successProbability ?? 0;
  const onTrack = success >= target;

  // Decade-spaced rows of the fan chart for the working table.
  const decadeBands = useMemo(() => {
    if (!analysis) return [];
    return analysis.base.fanChart.filter(
      (b) => b.age % 10 === 0 || b.age === inputs.retirementAge || b.age === inputs.endAge,
    );
  }, [analysis, inputs.retirementAge, inputs.endAge]);

  const yesNo = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

  return (
    <div>
      {/* Privacy assurance */}
      <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-6 text-sm text-primary-800">
        <strong>100% private.</strong> Every calculation. all {(inputs.numSimulations ?? 10000).toLocaleString('en-IN')} simulations , 
        runs inside your browser. Your age, savings and income are never sent to any server.
      </div>

      {/* ---------------- Inputs ---------------- */}
      <Calculator
        title="Your retirement plan"
        description="Enter your details. Results recompute automatically. Open ‘Advanced assumptions’ to fine-tune returns, inflation, glide path, EPF and NPS."
      >
        <CalcSlider id="currentAge" label="Current age" value={inputs.currentAge} onChange={(v) => set('currentAge', v)} min={18} max={70} step={1} suffix=" yrs" />
        <CalcSlider id="retirementAge" label="Retirement age" value={inputs.retirementAge} onChange={(v) => set('retirementAge', v)} min={Math.max(inputs.currentAge + 1, 35)} max={75} step={1} suffix=" yrs" />
        <CalcSlider id="endAge" label="Plan until age (life expectancy)" value={inputs.endAge} onChange={(v) => set('endAge', v)} min={Math.max(inputs.retirementAge + 1, 70)} max={105} step={1} suffix=" yrs" />
        <CalcSlider id="currentCorpus" label="Current retirement savings" value={inputs.currentCorpus} onChange={(v) => set('currentCorpus', v)} min={0} max={100000000} step={100000} prefix="₹ " displayValue={formatCompactINR(inputs.currentCorpus)} />
        <CalcSlider id="monthlySIP" label="Current monthly investment (SIP)" value={inputs.monthlySIP} onChange={(v) => set('monthlySIP', v)} min={0} max={500000} step={1000} prefix="₹ " displayValue={formatCompactINR(inputs.monthlySIP)} />
        <CalcSlider id="stepUp" label="Annual SIP step-up" value={inputs.annualStepUpPct} onChange={(v) => set('annualStepUpPct', v)} min={0} max={20} step={1} suffix="%" />
        <CalcSlider id="expense" label="Monthly expense in retirement (today's money)" value={inputs.currentMonthlyExpense} onChange={(v) => set('currentMonthlyExpense', v)} min={5000} max={1000000} step={5000} prefix="₹ " displayValue={formatCompactINR(inputs.currentMonthlyExpense)} />
        <CalcSlider id="target" label="Desired success probability" value={inputs.desiredSuccessProbabilityPct} onChange={(v) => set('desiredSuccessProbabilityPct', v)} min={50} max={99} step={1} suffix="%" />
      </Calculator>

      {/* Advanced assumptions */}
      <details className="card mt-4">
        <summary className="cursor-pointer font-semibold text-gray-900 select-none">Advanced assumptions (returns, inflation, glide path, EPF &amp; NPS)</summary>
        <div className="mt-5 space-y-5">
          <p className="text-xs text-gray-500">Every figure below is an editable assumption, not a hidden constant. Indian defaults are pre-filled.</p>

          <CalcSlider id="genInfl" label="General inflation" value={inputs.generalInflationPct} onChange={(v) => set('generalInflationPct', v)} min={0} max={12} step={0.5} suffix="%" />
          <CalcSlider id="medInfl" label="Medical inflation" value={inputs.medicalInflationPct} onChange={(v) => set('medicalInflationPct', v)} min={0} max={18} step={0.5} suffix="%" />
          <CalcSlider id="medShare" label="Share of expenses that are medical" value={inputs.medicalExpenseSharePct} onChange={(v) => set('medicalExpenseSharePct', v)} min={0} max={60} step={5} suffix="%" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <CalcSlider id="eqRet" label="Equity return" value={inputs.equityReturnPct} onChange={(v) => set('equityReturnPct', v)} min={4} max={18} step={0.5} suffix="%" />
            <CalcSlider id="eqVol" label="Equity volatility" value={inputs.equityVolPct} onChange={(v) => set('equityVolPct', v)} min={5} max={35} step={1} suffix="%" />
            <CalcSlider id="dbRet" label="Debt return" value={inputs.debtReturnPct} onChange={(v) => set('debtReturnPct', v)} min={3} max={12} step={0.5} suffix="%" />
            <CalcSlider id="dbVol" label="Debt volatility" value={inputs.debtVolPct} onChange={(v) => set('debtVolPct', v)} min={1} max={12} step={1} suffix="%" />
            <CalcSlider id="gdRet" label="Gold return" value={inputs.goldReturnPct} onChange={(v) => set('goldReturnPct', v)} min={3} max={15} step={0.5} suffix="%" />
            <CalcSlider id="gdVol" label="Gold volatility" value={inputs.goldVolPct} onChange={(v) => set('goldVolPct', v)} min={5} max={25} step={1} suffix="%" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
            <CalcSlider id="startEq" label="Start equity %" value={inputs.startEquityPct} onChange={(v) => set('startEquityPct', v)} min={0} max={100} step={5} suffix="%" />
            <CalcSlider id="startDb" label="Start debt %" value={inputs.startDebtPct} onChange={(v) => set('startDebtPct', v)} min={0} max={100} step={5} suffix="%" />
            <CalcSlider id="startGd" label="Start gold %" value={inputs.startGoldPct} onChange={(v) => set('startGoldPct', v)} min={0} max={100} step={5} suffix="%" />
          </div>

          <CalcSelect id="glide" label="Glide path (how equity de-risks with age)" value={inputs.glidePath} onChange={(v) => set('glidePath', v as RetirementInputs['glidePath'])} options={[
            { value: 'custom-linear', label: 'Linear de-risk to floor by retirement' },
            { value: 'age-based-100', label: 'Equity % = 100 − age' },
            { value: 'age-based-120', label: 'Equity % = 120 − age (aggressive)' },
            { value: 'none', label: 'Fixed allocation (no glide)' },
          ]} />
          <CalcSlider id="minEq" label="Minimum equity floor" value={inputs.minEquityPct} onChange={(v) => set('minEquityPct', v)} min={0} max={60} step={5} suffix="%" />

          <CalcSelect id="model" label="Return model" value={inputs.returnModel ?? 'normal'} onChange={(v) => set('returnModel', v as RetirementInputs['returnModel'])} options={[
            { value: 'normal', label: 'Normal distribution (editable mean & volatility)' },
            { value: 'bootstrap', label: `Bootstrap historical years (as of ${HISTORICAL_RETURNS_AS_OF})` },
          ]} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <CalcSlider id="pri" label="Part-time / rental income in retirement (monthly, today's money)" value={inputs.postRetirementMonthlyIncome} onChange={(v) => set('postRetirementMonthlyIncome', v)} min={0} max={300000} step={5000} prefix="₹ " displayValue={formatCompactINR(inputs.postRetirementMonthlyIncome)} />
            <CalcSlider id="priY" label="…for how many years" value={inputs.postRetirementIncomeYears} onChange={(v) => set('postRetirementIncomeYears', v)} min={0} max={30} step={1} suffix=" yrs" />
          </div>

          <CalcSelect id="model-epf" label="Include EPF?" value={inputs.includeEPF ? 'yes' : 'no'} onChange={(v) => set('includeEPF', v === 'yes')} options={yesNo} />
          {inputs.includeEPF && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
              <CalcSlider id="epfBal" label="EPF balance" value={inputs.epfCurrentBalance} onChange={(v) => set('epfCurrentBalance', v)} min={0} max={20000000} step={50000} prefix="₹ " displayValue={formatCompactINR(inputs.epfCurrentBalance)} />
              <CalcSlider id="epfCon" label="EPF monthly contribution" value={inputs.epfMonthlyContribution} onChange={(v) => set('epfMonthlyContribution', v)} min={0} max={100000} step={500} prefix="₹ " displayValue={formatCompactINR(inputs.epfMonthlyContribution)} />
              <CalcSlider id="epfRet" label="EPF rate" value={inputs.epfReturnPct} onChange={(v) => set('epfReturnPct', v)} min={6} max={10} step={0.05} suffix="%" />
            </div>
          )}

          <CalcSelect id="model-nps" label="Include NPS? (60% lump sum + 40% annuity)" value={inputs.includeNPS ? 'yes' : 'no'} onChange={(v) => set('includeNPS', v === 'yes')} options={yesNo} />
          {inputs.includeNPS && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <CalcSlider id="npsBal" label="NPS balance" value={inputs.npsCurrentBalance} onChange={(v) => set('npsCurrentBalance', v)} min={0} max={20000000} step={50000} prefix="₹ " displayValue={formatCompactINR(inputs.npsCurrentBalance)} />
              <CalcSlider id="npsCon" label="NPS monthly contribution" value={inputs.npsMonthlyContribution} onChange={(v) => set('npsMonthlyContribution', v)} min={0} max={150000} step={500} prefix="₹ " displayValue={formatCompactINR(inputs.npsMonthlyContribution)} />
              <CalcSlider id="npsRet" label="NPS return" value={inputs.npsReturnPct} onChange={(v) => set('npsReturnPct', v)} min={5} max={14} step={0.5} suffix="%" />
              <CalcSlider id="npsAnn" label="Annuity rate (on the 40%)" value={inputs.npsAnnuityRatePct} onChange={(v) => set('npsAnnuityRatePct', v)} min={4} max={9} step={0.25} suffix="%" />
            </div>
          )}

          <CalcSelect id="sims" label="Monte Carlo simulations" value={String(inputs.numSimulations ?? 10000)} onChange={(v) => set('numSimulations', Number(v))} options={[
            { value: '5000', label: '5,000 (fastest)' },
            { value: '10000', label: '10,000 (recommended)' },
            { value: '20000', label: '20,000 (most precise)' },
          ]} />
        </div>
      </details>

      {/* ---------------- Results ---------------- */}
      <div className="mt-10" aria-live="polite">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="heading-2">Your retirement outlook</h2>
          {computing && (
            <span className="text-sm text-gray-500 inline-flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
              Simulating {(inputs.numSimulations ?? 10000).toLocaleString('en-IN')} scenarios…
            </span>
          )}
        </div>

        {analysis && (
          <>
            {/* Gauge + verdict */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
              <div className="card">
                <SuccessGauge probability={success} target={target} label={`Chance your corpus lasts to age ${inputs.endAge}`} />
              </div>
              <div className={`card ${onTrack ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <h3 className="text-base font-semibold mb-2">{onTrack ? '✅ You are on track' : '⚠️ Likely shortfall'}</h3>
                <p className="text-sm text-gray-700">
                  {onTrack ? (
                    <>At ₹{formatCompactINR(inputs.monthlySIP)}/month, your plan succeeds in <strong>{Math.round(success * 100)}%</strong> of simulated futures. at or above your {inputs.desiredSuccessProbabilityPct}% target. You could consider retiring earlier or spending a little more.</>
                  ) : (
                    <>At ₹{formatCompactINR(inputs.monthlySIP)}/month, your plan succeeds in only <strong>{Math.round(success * 100)}%</strong> of futures, below your {inputs.desiredSuccessProbabilityPct}% target. Raise your SIP to <strong>{formatCompactINR(analysis.requiredMonthlySIP.value)}/month</strong>, trim retirement spending toward <strong>{formatCompactINR(analysis.safeMonthlyWithdrawalToday)}/month</strong>, or delay retirement.</>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Why: success depends on whether early-retirement market crashes (sequence-of-returns risk) drain the corpus before it can recover. which a single “average return” hides.
                </p>
              </div>
            </div>

            {/* Headline numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label={`Corpus needed at ${inputs.retirementAge}`} value={formatCompactINR(analysis.requiredCorpusAtRetirement)} sub={`${formatCompactINR(analysis.requiredCorpusToday)} in today's money`} />
              <StatCard label={`SIP for ${inputs.desiredSuccessProbabilityPct}% success`} value={`${formatCompactINR(analysis.requiredMonthlySIP.value)}/mo`} sub={analysis.requiredMonthlySIP.value <= inputs.monthlySIP ? 'Your current SIP is enough' : `+${formatCompactINR(Math.max(0, analysis.requiredMonthlySIP.value - inputs.monthlySIP))}/mo more needed`} tone={analysis.requiredMonthlySIP.value <= inputs.monthlySIP ? 'good' : 'warn'} />
              <StatCard label="Safe spending (today's money)" value={`${formatCompactINR(analysis.safeMonthlyWithdrawalToday)}/mo`} sub={`Sustainable at ${inputs.desiredSuccessProbabilityPct}% confidence`} />
              <StatCard label="Worst-10% run-out age" value={analysis.base.worstCaseDepletionAge ? `Age ${analysis.base.worstCaseDepletionAge}` : 'Survives'} sub={analysis.base.worstCaseDepletionAge ? 'In the unluckiest 1-in-10 markets' : 'Even in poor markets'} tone={analysis.base.worstCaseDepletionAge ? 'bad' : 'good'} />
            </div>

            {/* Fan chart */}
            <div className="card mb-6">
              <h3 className="text-base font-semibold mb-1">Projected corpus over time</h3>
              <p className="text-xs text-gray-500 mb-3">
                Median (dark line) with 25–75th (inner) and 10–90th (outer) percentile bands across {(inputs.numSimulations ?? 10000).toLocaleString('en-IN')} simulations. The fan widens because returns are uncertain. the spread is the real risk.
              </p>
              <FanChart bands={analysis.base.fanChart} retirementAge={inputs.retirementAge} />
            </div>

            <InArticleAd />

            {/* Sensitivity */}
            <div className="card my-6 overflow-x-auto">
              <h3 className="text-base font-semibold mb-1">Sensitivity. what moves the needle</h3>
              <p className="text-xs text-gray-500 mb-3">How your {Math.round(success * 100)}% success probability changes if one assumption is wrong.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 font-medium">Scenario</th>
                    <th className="py-2 font-medium text-right">Success %</th>
                    <th className="py-2 font-medium text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.sensitivity.map((row) => (
                    <tr key={row.label} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{row.label}</td>
                      <td className="py-2 text-right font-medium">{Math.round(row.successProbability * 100)}%</td>
                      <td className={`py-2 text-right font-medium ${row.deltaVsBase > 0.5 ? 'text-green-700' : row.deltaVsBase < -0.5 ? 'text-red-700' : 'text-gray-400'}`}>
                        {row.deltaVsBase > 0 ? '+' : ''}{row.deltaVsBase.toFixed(0)} pp
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Show calculation */}
            <div className="card my-6">
              <button
                type="button"
                onClick={() => setShowWorking((s) => !s)}
                className="w-full flex items-center justify-between text-left font-semibold text-gray-900 min-h-[44px]"
                aria-expanded={showWorking}
              >
                <span>Show the full calculation</span>
                <span className={`transition-transform ${showWorking ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
              </button>

              {showWorking && (
                <div className="mt-4 space-y-5 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">1. Accumulation (today → retirement)</h4>
                    <p className="text-gray-600 mb-2">
                      {analysis.yearsToRetirement} years of a ₹{formatCompactINR(inputs.monthlySIP)}/month SIP, stepped up {inputs.annualStepUpPct}%/yr, plus your ₹{formatCompactINR(inputs.currentCorpus)} starting corpus, compounded at each year&apos;s glide-path return. Equity moves from {Math.round(equityFractionAtAge(inputs, inputs.currentAge) * 100)}% today to {Math.round(equityFractionAtAge(inputs, inputs.retirementAge) * 100)}% at retirement.
                    </p>
                    <Row label="Expected (deterministic) corpus at retirement" value={formatINR(Math.round(working.det))} />
                    <Row label="Median (50th percentile) corpus" value={formatINR(Math.round(analysis.base.corpusAtRetirement.p50))} />
                    <Row label="Pessimistic (10th percentile)" value={formatINR(Math.round(analysis.base.corpusAtRetirement.p10))} />
                    <Row label="Optimistic (90th percentile)" value={formatINR(Math.round(analysis.base.corpusAtRetirement.p90))} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">2. Spending in retirement</h4>
                    <p className="text-gray-600 mb-2">
                      Today&apos;s ₹{formatCompactINR(inputs.currentMonthlyExpense)}/month becomes ₹{formatCompactINR(working.firstWithdrawal / 12)}/month at age {inputs.retirementAge} after inflation ({inputs.generalInflationPct}% general, {inputs.medicalInflationPct}% on the {inputs.medicalExpenseSharePct}% medical share). Each later year is inflated again.
                    </p>
                    <Row label="First-year withdrawal (nominal, at retirement)" value={formatINR(Math.round(working.firstWithdrawal))} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">3. Required corpus &amp; the sequence-risk buffer</h4>
                    <p className="text-gray-600 mb-2">
                      With zero volatility, the present value of all future withdrawals (discounted at a conservative {working.postReturnApprox.toFixed(1)}%) is the bare minimum. The Monte Carlo adds a buffer because a crash in your first retirement years is far more damaging than the same crash later.
                    </p>
                    <Row label="Deterministic minimum (closed-form PV)" value={formatINR(Math.round(working.detRequired))} />
                    <Row label={`Monte Carlo required corpus (${inputs.desiredSuccessProbabilityPct}% success)`} value={formatINR(Math.round(analysis.requiredCorpusAtRetirement))} strong />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">4. Corpus percentiles by age</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-200">
                            <th className="py-1.5 font-medium">Age</th>
                            <th className="py-1.5 font-medium text-right">10th %ile</th>
                            <th className="py-1.5 font-medium text-right">Median</th>
                            <th className="py-1.5 font-medium text-right">90th %ile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {decadeBands.map((b) => (
                            <tr key={b.age} className="border-b border-gray-100">
                              <td className="py-1.5 text-gray-700">{b.age}{b.age === inputs.retirementAge ? ' (retire)' : ''}</td>
                              <td className="py-1.5 text-right">{formatCompactINR(b.p10)}</td>
                              <td className="py-1.5 text-right font-medium">{formatCompactINR(b.p50)}</td>
                              <td className="py-1.5 text-right">{formatCompactINR(b.p90)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Model: nominal returns, annual steps with an exact monthly-SIP factor, seeded RNG (reproducible), withdrawals at the start of each year. Returns are drawn {inputs.returnModel === 'bootstrap' ? `by resampling historical years (dataset as of ${HISTORICAL_RETURNS_AS_OF})` : 'from a normal distribution per asset class'}. EPF/NPS, when enabled, grow at their fixed expected rates; NPS applies the 60% lump-sum / 40% annuity rule.
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Educational estimate, not financial, tax or investment advice.</strong> Projections are scenarios based on your assumptions and random simulation. not predictions or a recommendation to buy or sell any security. Market returns are uncertain and past performance does not guarantee future results. The bundled historical dataset is approximate and for illustration only. Verify with a SEBI-registered investment adviser before acting.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
