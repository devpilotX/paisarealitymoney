'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Calculator, { CalcSlider, CalcSelect } from '@/components/Calculator';
import InArticleAd from '@/components/InArticleAd';
import { formatINR, formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeBudget,
  DEFAULT_BUDGET_INPUTS,
  type BudgetInputs,
  type SpendCategory,
  type Goal,
} from '@/lib/budget-optimizer';

const STATUS_STYLE: Record<string, { tone: string; title: string }> = {
  deficit: { tone: 'bg-brand-red/5 border-brand-red/30', title: 'You are in a monthly deficit' },
  tight: { tone: 'bg-brand-yellow-soft/30 border-brand-yellow/50', title: 'Things are tight, savings below target' },
  healthy: { tone: 'bg-green-50 border-green-200', title: 'Healthy budget' },
  excellent: { tone: 'bg-green-50 border-green-200', title: 'Excellent, you are a strong saver' },
};

function NumField({ label, value, onChange, prefix = '₹', step = 500 }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; step?: number }): React.ReactElement {
  return (
    <label className="block">
      <span className="block text-xs text-muted-2 mb-0.5">{label}</span>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-2 text-xs">{prefix}</span>
        <input type="number" value={Number.isFinite(value) ? value : 0} min={0} step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-6 pr-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </label>
  );
}

function SplitBar({ label, needs, wants, savings, total }: { label: string; needs: number; wants: number; savings: number; total: number }): React.ReactElement {
  const pct = (v: number): number => (total > 0 ? (Math.max(0, v) / total) * 100 : 0);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-muted-2 mb-1"><span>{label}</span><span>{formatCompactINR(total)}</span></div>
      <div className="flex h-5 rounded-md overflow-hidden bg-paper-2" role="img" aria-label={`${label}: needs ${Math.round(pct(needs))}%, wants ${Math.round(pct(wants))}%, savings ${Math.round(pct(savings))}%`}>
        <div style={{ width: `${pct(needs)}%` }} className="bg-brown" title={`Needs ${formatCompactINR(needs)}`} />
        <div style={{ width: `${pct(wants)}%` }} className="bg-brand-yellow" title={`Wants ${formatCompactINR(wants)}`} />
        <div style={{ width: `${pct(savings)}%` }} className="bg-primary" title={`Savings ${formatCompactINR(savings)}`} />
      </div>
    </div>
  );
}

export default function BudgetOptimizerClient(): React.ReactElement {
  const [inputs, setInputs] = useState<BudgetInputs>(DEFAULT_BUDGET_INPUTS);
  const [useCTC, setUseCTC] = useState<boolean>(false);
  const [ctc, setCtc] = useState<number>(1500000);
  const [trimWantsPct, setTrimWantsPct] = useState<number>(0);

  useEffect(() => { trackCalculatorUse('budget-optimizer'); }, []);

  const set = useCallback(<K extends keyof BudgetInputs>(key: K, value: BudgetInputs[K]): void => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);
  const setCategoryAmount = useCallback((key: string, amount: number): void => {
    setInputs((prev) => ({ ...prev, categories: prev.categories.map((c) => (c.key === key ? { ...c, amount } : c)) }));
  }, []);
  const setGoal = useCallback((idx: number, patch: Partial<Goal>): void => {
    setInputs((prev) => ({ ...prev, goals: prev.goals.map((g, i) => (i === idx ? { ...g, ...patch } : g)) }));
  }, []);

  const effectiveInputs: BudgetInputs = useMemo(() => ({
    ...inputs,
    monthlyAfterTaxIncome: useCTC ? undefined : inputs.monthlyAfterTaxIncome,
    annualCTC: useCTC ? ctc : undefined,
  }), [inputs, useCTC, ctc]);

  const analysis = useMemo(() => analyzeBudget(effectiveInputs), [effectiveInputs]);

  // What-if: trim all wants by trimWantsPct and recompute.
  const whatIf = useMemo(() => {
    if (trimWantsPct <= 0) return null;
    const trimmed: SpendCategory[] = effectiveInputs.categories.map((c) => (c.type === 'wants' ? { ...c, amount: c.amount * (1 - trimWantsPct / 100) } : c));
    return analyzeBudget({ ...effectiveInputs, categories: trimmed });
  }, [effectiveInputs, trimWantsPct]);

  const needsCats = inputs.categories.filter((c) => c.type === 'needs');
  const wantsCats = inputs.categories.filter((c) => c.type === 'wants');
  const savingsCats = inputs.categories.filter((c) => c.type === 'savings');
  const statusStyle = STATUS_STYLE[analysis.status]!;

  return (
    <div>
      <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-6 text-sm text-primary-800">
        <strong>Free &amp; private.</strong> No login, no ads in your data. every number stays in your browser.
      </div>

      <Calculator title="Your income & profile" description="We adapt the 50/30/20 rule to your income, city and job stability. then find your surplus.">
        <CalcSelect id="mode" label="Income input" value={useCTC ? 'ctc' : 'income'} onChange={(v) => setUseCTC(v === 'ctc')} options={[
          { value: 'income', label: 'Enter monthly take-home' },
          { value: 'ctc', label: 'Enter annual CTC (we estimate take-home)' },
        ]} />
        {useCTC ? (
          <CalcSlider id="ctc" label="Annual CTC" value={ctc} onChange={setCtc} min={300000} max={50000000} step={50000} prefix="₹ " displayValue={formatCompactINR(ctc)} />
        ) : (
          <CalcSlider id="income" label="Monthly take-home income" value={inputs.monthlyAfterTaxIncome ?? 0} onChange={(v) => set('monthlyAfterTaxIncome', v)} min={10000} max={2000000} step={1000} prefix="₹ " displayValue={formatCompactINR(inputs.monthlyAfterTaxIncome ?? 0)} />
        )}
        <CalcSelect id="city" label="City tier" value={inputs.cityTier} onChange={(v) => set('cityTier', v as BudgetInputs['cityTier'])} options={[
          { value: 'metro', label: 'Metro (Mumbai, Delhi, Bengaluru…)' },
          { value: 'tier2', label: 'Tier-2 city' },
          { value: 'tier3', label: 'Tier-3 / town' },
        ]} />
        <CalcSelect id="stability" label="Job stability" value={inputs.jobStability} onChange={(v) => set('jobStability', v as BudgetInputs['jobStability'])} options={[
          { value: 'stable', label: 'Very stable (govt / large firm)' },
          { value: 'normal', label: 'Normal' },
          { value: 'unstable', label: 'Variable / startup / freelance' },
        ]} />
        <CalcSelect id="irregular" label="Is your income irregular?" value={inputs.irregularIncome ? 'yes' : 'no'} onChange={(v) => set('irregularIncome', v === 'yes')} options={[{ value: 'no', label: 'No, steady' }, { value: 'yes', label: 'Yes. budget conservatively' }]} />
        <NumField label="Emergency fund saved so far" value={inputs.emergencyFundCurrent} onChange={(v) => set('emergencyFundCurrent', v)} step={10000} />
      </Calculator>

      {/* Spends */}
      <details className="card mt-4" open>
        <summary className="cursor-pointer font-semibold text-navy select-none">Your monthly spends</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-brown uppercase tracking-wide mb-2">Needs</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {needsCats.map((c) => <NumField key={c.key} label={c.label} value={c.amount} onChange={(v) => setCategoryAmount(c.key, v)} />)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">Wants</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {wantsCats.map((c) => <NumField key={c.key} label={c.label} value={c.amount} onChange={(v) => setCategoryAmount(c.key, v)} />)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Savings / investments</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {savingsCats.map((c) => <NumField key={c.key} label={c.label} value={c.amount} onChange={(v) => setCategoryAmount(c.key, v)} />)}
            </div>
          </div>
        </div>
      </details>

      {/* Goals */}
      <details className="card mt-4">
        <summary className="cursor-pointer font-semibold text-navy select-none">Your goals</summary>
        <div className="mt-4 space-y-3">
          {inputs.goals.map((g, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
              <label className="block"><span className="block text-xs text-muted-2 mb-0.5">Goal</span>
                <input type="text" value={g.name} onChange={(e) => setGoal(i, { name: e.target.value })} className="w-full px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary" /></label>
              <NumField label="Target ₹" value={g.targetAmount} onChange={(v) => setGoal(i, { targetAmount: v })} step={10000} />
              <NumField label="Saved ₹" value={g.currentSaved} onChange={(v) => setGoal(i, { currentSaved: v })} step={10000} />
              <NumField label="Months" value={g.deadlineMonths} onChange={(v) => setGoal(i, { deadlineMonths: v })} prefix="" step={1} />
            </div>
          ))}
        </div>
      </details>

      {/* Status */}
      <div className={`card mt-8 ${statusStyle.tone}`}>
        <h2 className="text-lg font-bold mb-1">{statusStyle.title}</h2>
        <p className="text-sm text-ink">
          {analysis.isDeficit
            ? <>You spend <strong>{formatINR(analysis.deficitAmount)}</strong> more than your take-home each month. Fix this before investing.</>
            : <>Your take-home is <strong>{formatINR(analysis.afterTaxIncome)}</strong>/month. You have a monthly surplus of <strong>{formatINR(analysis.monthlySurplus)}</strong> (a {Math.round(analysis.currentSavingsRate * 100)}% savings rate vs a recommended {Math.round(analysis.recommendedSavingsRate * 100)}%).</>}
        </p>
      </div>

      {/* Split comparison */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-3">Your split vs the recommended split</h3>
        <SplitBar label="Recommended" needs={analysis.recommendedAmounts.needs} wants={analysis.recommendedAmounts.wants} savings={analysis.recommendedAmounts.savings} total={analysis.afterTaxIncome} />
        <SplitBar label="Your current" needs={analysis.currentTotals.needs} wants={analysis.currentTotals.wants} savings={Math.max(0, analysis.monthlySurplus)} total={analysis.afterTaxIncome} />
        <div className="flex flex-wrap gap-4 text-xs text-muted-2 mt-2">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brown" />Needs</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-yellow" />Wants</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary" />Savings</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="card"><p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Monthly surplus</p><p className="text-2xl font-bold text-primary">{formatCompactINR(analysis.monthlySurplus)}</p><p className="text-xs text-muted-2 mt-1">Capacity to save &amp; invest</p></div>
        <div className="card"><p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Surplus found by trimming</p><p className="text-2xl font-bold text-green-700">{formatCompactINR(analysis.surplusFound)}</p><p className="text-xs text-muted-2 mt-1">If overspends are cut to benchmark</p></div>
        <div className="card"><p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Emergency fund gap</p><p className="text-2xl font-bold text-primary">{formatCompactINR(analysis.emergencyFund.gap)}</p><p className="text-xs text-muted-2 mt-1">{analysis.emergencyFund.gap <= 0 ? `Fully funded (${analysis.emergencyFund.recommendedMonths} mo)` : analysis.emergencyFund.monthsToFill === Infinity ? 'No surplus to fill it yet' : `~${analysis.emergencyFund.monthsToFill} months to fill`}</p></div>
      </div>

      <InArticleAd />

      {/* Overspend flags */}
      {analysis.overspendFlags.length > 0 && (
        <div className="card my-6">
          <h3 className="text-base font-semibold mb-3">Where you&apos;re over benchmark</h3>
          <div className="space-y-2">
            {analysis.overspendFlags.map((f) => (
              <div key={f.key} className="flex justify-between items-center text-sm">
                <span className="text-ink">{f.label}</span>
                <span className="text-muted-2">{formatCompactINR(f.actual)} <span className="text-muted-2">vs</span> {formatCompactINR(f.benchmark)} <span className="font-semibold text-red-600">(+{formatCompactINR(f.overBy)})</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What-if */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-1">What if you trim your wants?</h3>
        <CalcSlider id="trim" label="Cut all 'wants' spending by" value={trimWantsPct} onChange={setTrimWantsPct} min={0} max={50} step={5} suffix="%" />
        {whatIf && (
          <p className="text-sm text-ink mt-2">
            Cutting wants by {trimWantsPct}% raises your monthly surplus from <strong>{formatCompactINR(analysis.monthlySurplus)}</strong> to <strong className="text-green-700">{formatCompactINR(whatIf.monthlySurplus)}</strong>. a savings rate of <strong>{Math.round(whatIf.currentSavingsRate * 100)}%</strong>{analysis.emergencyFund.gap > 0 && whatIf.emergencyFund.monthsToFill !== Infinity ? <>, filling your emergency fund in ~{whatIf.emergencyFund.monthsToFill} months (was {analysis.emergencyFund.monthsToFill === Infinity ? 'never' : `${analysis.emergencyFund.monthsToFill}`})</> : null}.
          </p>
        )}
      </div>

      {/* Goals */}
      {analysis.goals.length > 0 && (
        <div className="card my-6 overflow-x-auto">
          <h3 className="text-base font-semibold mb-3">Goal feasibility</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-2 border-b border-line"><th className="py-2 font-medium">Goal</th><th className="py-2 font-medium text-right">Needed/mo</th><th className="py-2 font-medium text-center">On track?</th></tr></thead>
            <tbody>
              {analysis.goals.map((g, i) => (
                <tr key={i} className="border-b border-line/60">
                  <td className="py-2 text-ink">{g.name}</td>
                  <td className="py-2 text-right">{formatCompactINR(g.requiredMonthly)}</td>
                  <td className="py-2 text-center">{g.feasibleWithinDeadline ? <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded">Feasible</span> : <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded">+{formatCompactINR(g.shortfallMonthly)}/mo short</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action list */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-3">Your prioritised action plan</h3>
        <ol className="space-y-2 list-decimal pl-5">
          {analysis.actionList.map((a, i) => <li key={i} className="text-sm text-ink">{a}</li>)}
        </ol>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Educational estimate, not financial advice.</strong> Benchmarks are general guidelines, not rules. your ideal split depends on your circumstances. The CTC→take-home estimate is approximate (assumes EPF on 40% basic and standard tax). Verify with a qualified advisor before major financial decisions.
        </p>
      </div>
    </div>
  );
}
