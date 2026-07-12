'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import PayoffTimelineChart, { type TimelineSeries } from '@/components/PayoffTimelineChart';
import InArticleAd from '@/components/InArticleAd';
import { formatINR, formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeDebt,
  DEFAULT_DEBT_INPUTS,
  newLoanId,
  loanTypeLabel,
  type Loan,
  type LoanType,
  type DebtInputs,
  type StrategyKey,
} from '@/lib/debt-optimizer';

const STRATEGY_COLORS: Record<StrategyKey, string> = {
  'tax-aware': '#007A78',
  avalanche: '#d97706',
  snowball: '#6366f1',
  minimums: '#9ca3af',
};

const LOAN_TYPES: LoanType[] = ['home', 'education', 'personal', 'car', 'credit-card'];

const SLAB_OPTIONS = [
  { value: '0', label: 'No tax (0%)' },
  { value: '5.2', label: '5% slab (5.2%)' },
  { value: '20.8', label: '20% slab (20.8%)' },
  { value: '31.2', label: '30% slab (31.2%)' },
  { value: '35.88', label: '30% + surcharge (35.88%)' },
];

function months(n: number): string {
  const y = Math.floor(n / 12);
  const m = n % 12;
  return y > 0 ? `${y}y ${m}m` : `${m}m`;
}

function NumField({ label, value, onChange, prefix, suffix, step = 1, min = 0 }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number; min?: number }): React.ReactElement {
  return (
    <label className="block">
      <span className="block text-xs text-muted-2 mb-0.5">{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-2 text-xs">{prefix}</span>}
        <input
          type="number" value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min} step={step}
          className={`w-full px-2 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-7' : ''}`}
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-2 text-xs">{suffix}</span>}
      </div>
    </label>
  );
}

export default function DebtOptimizerClient(): React.ReactElement {
  const [inputs, setInputs] = useState<DebtInputs>(DEFAULT_DEBT_INPUTS);
  const [useTarget, setUseTarget] = useState<boolean>(false);
  const [targetMonths, setTargetMonths] = useState<number>(36);

  useEffect(() => { trackCalculatorUse('debt-optimizer'); }, []);

  const updateLoan = useCallback((id: string, patch: Partial<Loan>): void => {
    setInputs((prev) => ({ ...prev, loans: prev.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);
  const addLoan = useCallback((): void => {
    setInputs((prev) => ({ ...prev, loans: [...prev.loans, { id: newLoanId(), name: 'New loan', type: 'personal', balance: 200000, annualRatePct: 14, minPayment: 5000, prepaymentPenaltyPct: 0 }] }));
  }, []);
  const removeLoan = useCallback((id: string): void => {
    setInputs((prev) => ({ ...prev, loans: prev.loans.filter((l) => l.id !== id) }));
  }, []);

  const analysis = useMemo(() => {
    const withTarget: DebtInputs = { ...inputs, targetPayoffMonths: useTarget ? targetMonths : undefined };
    return analyzeDebt(withTarget);
  }, [inputs, useTarget, targetMonths]);

  const rec = analysis.strategies[analysis.recommended];
  const orderedStrategies: StrategyKey[] = ['tax-aware', 'avalanche', 'snowball', 'minimums'];

  const series: TimelineSeries[] = orderedStrategies
    .filter((k) => k !== 'minimums')
    .map((k) => ({ label: analysis.strategies[k].label.split(' (')[0]!, color: STRATEGY_COLORS[k], timeline: analysis.strategies[k].timeline }));

  const loanNameById = useMemo(() => Object.fromEntries(inputs.loans.map((l) => [l.id, l.name])), [inputs.loans]);

  return (
    <div>
      <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-6 text-sm text-primary-800">
        <strong>100% private.</strong> All optimisation runs in your browser. Your loan details never leave your device.
      </div>

      {/* Loan list */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading-3">Your loans</h2>
          <button type="button" onClick={addLoan} className="text-sm font-medium text-primary border border-primary rounded-lg px-3 py-1.5 min-h-[40px] hover:bg-primary-50">+ Add loan</button>
        </div>
        <div className="space-y-4">
          {inputs.loans.map((l) => (
            <div key={l.id} className="border border-line rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={l.name} onChange={(e) => updateLoan(l.id, { name: e.target.value })} aria-label="Loan name" className="flex-1 px-2 py-2 border border-line rounded-lg text-sm font-medium min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary" />
                <select value={l.type} onChange={(e) => updateLoan(l.id, { type: e.target.value as LoanType })} aria-label="Loan type" className="px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary">
                  {LOAN_TYPES.map((t) => <option key={t} value={t}>{loanTypeLabel(t)}</option>)}
                </select>
                {inputs.loans.length > 1 && (
                  <button type="button" onClick={() => removeLoan(l.id)} aria-label={`Remove ${l.name}`} className="text-muted-2 hover:text-red-600 px-2 min-h-[40px] text-lg">, </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <NumField label="Balance" value={l.balance} onChange={(v) => updateLoan(l.id, { balance: v })} prefix="₹" step={10000} />
                <NumField label="Rate" value={l.annualRatePct} onChange={(v) => updateLoan(l.id, { annualRatePct: v })} suffix="%" step={0.1} />
                <NumField label="Min / month" value={l.minPayment} onChange={(v) => updateLoan(l.id, { minPayment: v })} prefix="₹" step={500} />
                <NumField label="Prepay penalty" value={l.prepaymentPenaltyPct} onChange={(v) => updateLoan(l.id, { prepaymentPenaltyPct: v })} suffix="%" step={0.5} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget & tax */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumField label="Total monthly budget for all debt" value={inputs.monthlyBudget} onChange={(v) => setInputs((p) => ({ ...p, monthlyBudget: v }))} prefix="₹" step={1000} />
          <label className="block">
            <span className="block text-xs text-muted-2 mb-0.5">Tax regime</span>
            <select value={inputs.taxRegime} onChange={(e) => setInputs((p) => ({ ...p, taxRegime: e.target.value as 'old' | 'new' }))} className="w-full px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="new">New regime (no loan-interest deductions)</option>
              <option value="old">Old regime (Sec 24(b) + 80E available)</option>
            </select>
          </label>
          {inputs.taxRegime === 'old' && (
            <label className="block">
              <span className="block text-xs text-muted-2 mb-0.5">Your marginal tax rate</span>
              <select value={String(inputs.marginalSlabPct)} onChange={(e) => setInputs((p) => ({ ...p, marginalSlabPct: Number(e.target.value) }))} className="w-full px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary">
                {SLAB_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <span className="block text-xs text-muted-2 mb-0.5">Target debt-free date (optional)</span>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={useTarget} onChange={(e) => setUseTarget(e.target.checked)} className="w-4 h-4 accent-primary" aria-label="Enable target payoff date" />
              <input type="number" value={targetMonths} onChange={(e) => setTargetMonths(parseInt(e.target.value) || 1)} min={1} disabled={!useTarget} className="w-24 px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] disabled:bg-paper-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              <span className="text-sm text-muted-2">months</span>
            </div>
          </label>
        </div>
      </div>

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="rounded-lg bg-brand-yellow-soft/30 border border-brand-yellow/50 p-4 mb-6">
          {analysis.warnings.map((w, i) => <p key={i} className="text-sm text-brown">{w}</p>)}
        </div>
      )}

      {/* Verdict */}
      {rec.clearedAll && (
        <div className="card mb-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-bold mb-1">Pay them in this order: {analysis.ranking.map((r) => r.name).join(' → ')}</h3>
          <p className="text-sm text-ink">
            The <strong>tax-aware plan</strong> clears all your debt in <strong>{months(rec.months)}</strong> and saves
            <strong> {formatINR(Math.round(analysis.interestSavedVsMinimums))}</strong> in interest versus paying only the minimums
            {analysis.monthsSavedVsMinimums > 0 ? <>. and gets you debt-free <strong>{months(analysis.monthsSavedVsMinimums)}</strong> sooner</> : null}.
            {useTarget && analysis.targetBudget !== null ? <> To be debt-free in {targetMonths} months, budget about <strong>{formatINR(analysis.targetBudget)}/month</strong>.</> : null}
          </p>
        </div>
      )}

      {/* Strategy comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {orderedStrategies.map((k) => {
          const s = analysis.strategies[k];
          const isRec = k === analysis.recommended;
          return (
            <div key={k} className={`card ${isRec ? 'border-primary border-2' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: STRATEGY_COLORS[k] }} aria-hidden="true" />
                <h3 className="text-sm font-semibold">{s.label.split(' (')[0]}</h3>
              </div>
              <p className="text-2xl font-bold text-primary">{s.clearedAll ? months(s.months) : ', '}</p>
              <p className="text-xs text-muted-2 mt-1">Total interest: {s.clearedAll ? formatCompactINR(s.totalInterest) : 'n/a'}</p>
              {inputs.taxRegime === 'old' && s.totalShield > 0 && <p className="text-xs text-muted-2">After-tax: {formatCompactINR(s.afterTaxInterest)}</p>}
              {isRec && <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Recommended</span>}
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="card mb-6">
        <h3 className="text-base font-semibold mb-1">Debt payoff timeline</h3>
        <p className="text-xs text-muted-2 mb-3">Total outstanding balance over time. A steeper drop means faster freedom.</p>
        <PayoffTimelineChart series={series} />
      </div>

      <InArticleAd />

      {/* Tax-adjusted ranking */}
      <div className="card my-6 overflow-x-auto">
        <h3 className="text-base font-semibold mb-1">Tax-adjusted ranking. what to attack first</h3>
        <p className="text-xs text-muted-2 mb-3">The effective rate is the true cost after Indian tax deductions. Highest effective rate gets your surplus first.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-2 border-b border-line">
              <th className="py-2 font-medium">#</th>
              <th className="py-2 font-medium">Loan</th>
              <th className="py-2 font-medium text-right">Balance</th>
              <th className="py-2 font-medium text-right">Nominal</th>
              <th className="py-2 font-medium text-right">Effective</th>
            </tr>
          </thead>
          <tbody>
            {analysis.ranking.map((r, i) => (
              <tr key={r.id} className="border-b border-line/60">
                <td className="py-2 text-muted-2">{i + 1}</td>
                <td className="py-2 text-ink">{r.name} <span className="text-xs text-muted-2">({loanTypeLabel(r.type)})</span></td>
                <td className="py-2 text-right">{formatCompactINR(r.balance)}</td>
                <td className="py-2 text-right">{r.nominalRatePct.toFixed(2)}%</td>
                <td className={`py-2 text-right font-semibold ${r.effectiveRatePct < r.nominalRatePct ? 'text-green-700' : 'text-navy'}`}>{r.effectiveRatePct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {inputs.taxRegime === 'old' && (
          <p className="text-xs text-muted-2 mt-2">Green effective rates are below nominal thanks to Section 24(b) (home, ₹2L cap) or Section 80E (education, full interest). This can reorder which loan you should clear first.</p>
        )}
      </div>

      {/* Payoff order detail */}
      {rec.clearedAll && (
        <div className="card my-6">
          <h3 className="text-base font-semibold mb-3">Recommended payoff order &amp; dates</h3>
          <ol className="space-y-2">
            {rec.payoffOrder.map((id, i) => (
              <li key={id} className="flex justify-between text-sm">
                <span className="text-ink">{i + 1}. {loanNameById[id]}</span>
                <span className="font-medium text-navy">cleared by month {rec.perLoanPayoffMonth[id]} ({months(rec.perLoanPayoffMonth[id] ?? 0)})</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Educational estimate, not financial or tax advice.</strong> Results assume your budget and minimums stay constant and that interest accrues as modelled (credit cards daily, others monthly). Section 24(b)/80E shields are modelled for the old regime and simplified. verify caps, the 80E 8-year limit, and prepayment penalty terms with your lender and a qualified professional before acting.
        </p>
      </div>
    </div>
  );
}
