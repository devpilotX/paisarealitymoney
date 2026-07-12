'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import InArticleAd from '@/components/InArticleAd';
import { formatINR, formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeHarvest,
  defaultHarvestInputs,
  type HarvestInputs,
  type HarvestLot,
  type AssetType,
  type HarvestAction,
} from '@/lib/tax-harvesting';

let idc = 0;
function newId(): string { idc += 1; return `lot-${idc}-${Math.floor(Math.random() * 1e6)}`; }

function NumField({ label, value, onChange, prefix, step = 1 }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; step?: number }): React.ReactElement {
  return (
    <label className="block">
      <span className="block text-xs text-muted-2 mb-0.5">{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-2 text-xs">{prefix}</span>}
        <input type="number" value={Number.isFinite(value) ? value : 0} min={0} step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full ${prefix ? 'pl-6' : 'pl-2'} pr-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary`} />
      </div>
    </label>
  );
}

const ACTION_STYLE: Record<HarvestAction['type'], { tone: string; label: string }> = {
  'harvest-loss': { tone: 'border-l-4 border-red-400 bg-red-50', label: 'Harvest loss' },
  'gain-harvest': { tone: 'border-l-4 border-green-500 bg-green-50', label: 'Gain harvest' },
  wait: { tone: 'border-l-4 border-brand-yellow bg-brand-yellow-soft/40', label: 'Wait' },
  avoid: { tone: 'border-l-4 border-line bg-paper-2', label: 'Avoid' },
};

const TERM_BADGE: Record<string, string> = {
  long: 'bg-green-100 text-green-800',
  short: 'bg-brand-yellow-soft/70 text-brown',
  debt: 'bg-navy/10 text-navy',
};

export default function TaxHarvestingClient(): React.ReactElement {
  const [inputs, setInputs] = useState<HarvestInputs>(defaultHarvestInputs);

  useEffect(() => { trackCalculatorUse('tax-harvesting'); }, []);

  const updateLot = useCallback((id: string, patch: Partial<HarvestLot>): void => {
    setInputs((prev) => ({ ...prev, lots: prev.lots.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);
  const addLot = useCallback((): void => {
    setInputs((prev) => ({ ...prev, lots: [...prev.lots, { id: newId(), name: 'New holding', assetType: 'equity', buyDate: new Date().toISOString().slice(0, 10), buyPrice: 100, qty: 100, currentPrice: 120 }] }));
  }, []);
  const removeLot = useCallback((id: string): void => {
    setInputs((prev) => ({ ...prev, lots: prev.lots.filter((l) => l.id !== id) }));
  }, []);
  const setField = useCallback(<K extends keyof HarvestInputs>(key: K, value: HarvestInputs[K]): void => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const a = useMemo(() => analyzeHarvest(inputs), [inputs]);

  return (
    <div>
      <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-6 text-sm text-primary-800">
        <strong>100% private.</strong> Your portfolio is analysed entirely in your browser. nothing is uploaded anywhere.
      </div>

      {/* Lots */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading-3">Your holdings (lots)</h2>
          <button type="button" onClick={addLot} className="text-sm font-medium text-primary border border-primary rounded-lg px-3 py-1.5 min-h-[40px] hover:bg-primary-50">+ Add lot</button>
        </div>
        <div className="space-y-3">
          {inputs.lots.map((l) => (
            <div key={l.id} className="border border-line rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={l.name} onChange={(e) => updateLot(l.id, { name: e.target.value })} aria-label="Holding name" className="flex-1 px-2 py-2 border border-line rounded-lg text-sm font-medium min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary" />
                <select value={l.assetType} onChange={(e) => updateLot(l.id, { assetType: e.target.value as AssetType })} aria-label="Asset type" className="px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                </select>
                {inputs.lots.length > 1 && <button type="button" onClick={() => removeLot(l.id)} aria-label={`Remove ${l.name}`} className="text-muted-2 hover:text-red-600 px-2 min-h-[40px] text-lg">, </button>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="block"><span className="block text-xs text-muted-2 mb-0.5">Buy date</span>
                  <input type="date" value={l.buyDate} onChange={(e) => updateLot(l.id, { buyDate: e.target.value })} className="w-full px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary" /></label>
                <NumField label="Buy price" value={l.buyPrice} onChange={(v) => updateLot(l.id, { buyPrice: v })} prefix="₹" step={1} />
                <NumField label="Quantity" value={l.qty} onChange={(v) => updateLot(l.id, { qty: v })} step={1} />
                <NumField label="Current price" value={l.currentPrice} onChange={(v) => updateLot(l.id, { currentPrice: v })} prefix="₹" step={1} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Realized / carry-forward / settings */}
      <details className="card mb-6">
        <summary className="cursor-pointer font-semibold text-navy select-none">Already realized this year, carried-forward losses &amp; settings</summary>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <NumField label="Realized equity STCG" value={inputs.realizedSTCG} onChange={(v) => setField('realizedSTCG', v)} prefix="₹" step={5000} />
          <NumField label="Realized equity LTCG" value={inputs.realizedLTCG} onChange={(v) => setField('realizedLTCG', v)} prefix="₹" step={5000} />
          <NumField label="Realized debt gain" value={inputs.realizedDebtGain} onChange={(v) => setField('realizedDebtGain', v)} prefix="₹" step={5000} />
          <NumField label="Carried-forward STCL" value={inputs.carriedForwardSTCL} onChange={(v) => setField('carriedForwardSTCL', v)} prefix="₹" step={5000} />
          <NumField label="Carried-forward LTCL" value={inputs.carriedForwardLTCL} onChange={(v) => setField('carriedForwardLTCL', v)} prefix="₹" step={5000} />
          <NumField label="Your tax slab (for debt)" value={inputs.marginalSlabPct} onChange={(v) => setField('marginalSlabPct', v)} step={0.1} />
          <label className="block"><span className="block text-xs text-muted-2 mb-0.5">As of date</span>
            <input type="date" value={inputs.currentDate} onChange={(e) => setField('currentDate', e.target.value)} className="w-full px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary" /></label>
        </div>
      </details>

      {/* Headline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-green-50 border-green-200"><p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Tax saved this year</p><p className="text-2xl font-bold text-green-700">{formatCompactINR(a.taxSaved)}</p><p className="text-xs text-muted-2 mt-1">By harvesting losses to offset gains</p></div>
        <div className="card"><p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Tax-free gains to harvest</p><p className="text-2xl font-bold text-primary">{formatCompactINR(a.gainHarvestAmount)}</p><p className="text-xs text-muted-2 mt-1">Basis reset worth ~{formatCompactINR(a.basisStepUpBenefit)} in future tax</p></div>
        <div className="card"><p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Exemption headroom left</p><p className="text-2xl font-bold text-primary">{formatCompactINR(a.exemptionHeadroomRemaining)}</p><p className="text-xs text-muted-2 mt-1">of the ₹1.25L LTCG exemption</p></div>
      </div>

      {/* Before / after */}
      <div className="card mb-6">
        <h3 className="text-base font-semibold mb-3">Tax: without vs with harvesting</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-paper-2"><p className="text-xs text-muted-2 mb-1">Without harvesting</p><p className="text-xl font-bold text-navy">{formatINR(a.baseline.tax)}</p></div>
          <div className="text-center p-3 rounded-lg bg-green-50"><p className="text-xs text-muted-2 mb-1">With harvesting</p><p className="text-xl font-bold text-green-700">{formatINR(a.afterHarvest.tax)}</p></div>
        </div>
        <div className="mt-3 text-xs text-muted-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>Losses to carry forward. STCL: <strong>{formatCompactINR(a.afterHarvest.carrySTCL)}</strong>, LTCL: <strong>{formatCompactINR(a.afterHarvest.carryLTCL)}</strong> (8 years)</span>
        </div>
      </div>

      <InArticleAd />

      {/* Action list */}
      <div className="card my-6">
        <h3 className="text-base font-semibold mb-3">Your action list</h3>
        <div className="space-y-2">
          {a.actions.length === 0 && <p className="text-sm text-muted-2">No harvesting actions. your lots are all short-term gains or there is nothing to optimise right now.</p>}
          {a.actions.map((act, i) => (
            <div key={i} className={`rounded-lg p-3 ${ACTION_STYLE[act.type].tone}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{ACTION_STYLE[act.type].label}</span>
                <span className="text-sm font-medium text-navy">{act.lotName}</span>
              </div>
              <p className="text-sm text-ink">{act.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Classification table */}
      <div className="card my-6 overflow-x-auto">
        <h3 className="text-base font-semibold mb-3">Holding classification</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-2 border-b border-line">
            <th className="py-2 font-medium">Holding</th><th className="py-2 font-medium text-center">Term</th>
            <th className="py-2 font-medium text-right">Qty</th><th className="py-2 font-medium text-right">Gain / loss</th>
          </tr></thead>
          <tbody>
            {a.classified.map((c) => (
              <tr key={c.id} className="border-b border-line/60">
                <td className="py-2 text-ink">{c.name}</td>
                <td className="py-2 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded ${TERM_BADGE[c.term]}`}>{c.term === 'long' ? 'LTCG' : c.term === 'short' ? 'STCG' : 'Debt'}</span>{c.nearBoundary ? <span className="ml-1 text-xs text-brown">~{c.daysToLongTerm}d to LT</span> : null}</td>
                <td className="py-2 text-right">{c.qty.toLocaleString('en-IN')}</td>
                <td className={`py-2 text-right font-medium ${c.isGain ? 'text-green-700' : 'text-red-600'}`}>{c.isGain ? '+' : ''}{formatCompactINR(c.totalGainLoss)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Educational estimate, not tax or investment advice.</strong> This is not a recommendation to buy or sell any security (SEBI Investment Adviser Regulations). Tax is computed at FY 2025-26 rates (LTCG 12.5% over ₹1.25L, STCG 20%, debt at slab) plus 4% cess; surcharge and lot-level FIFO matching at your broker may change the exact figures. India has no formal wash-sale rule, but re-buying purely to harvest is a judgement call. verify with a qualified CA before transacting.
        </p>
      </div>
    </div>
  );
}
