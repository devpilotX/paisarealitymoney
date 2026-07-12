'use client';

import { useEffect, useMemo, useState } from 'react';
import Calculator, { CalcSelect, CalcSlider } from '@/components/Calculator';
import InArticleAd from '@/components/InArticleAd';
import { formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeOffer,
  DEFAULT_OFFER,
  type Moneyback,
  type OfferInput,
  type OfferMode,
  type VerdictBand,
} from '@/lib/real-return';

const BAND_STYLES: Record<VerdictBand, { box: string; badge: string }> = {
  invalid: { box: 'bg-paper-2 border-line', badge: 'bg-line text-ink' },
  loss: { box: 'bg-red-50 border-red-300', badge: 'bg-red-600 text-white' },
  'below-savings': { box: 'bg-red-50 border-red-300', badge: 'bg-red-600 text-white' },
  'below-inflation': { box: 'bg-red-50 border-red-300', badge: 'bg-red-500 text-white' },
  'below-ppf': { box: 'bg-brand-red/5 border-brand-red/40', badge: 'bg-brand-red text-paper' },
  moderate: { box: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-500 text-white' },
  competitive: { box: 'bg-green-50 border-green-300', badge: 'bg-green-600 text-white' },
  'too-good': { box: 'bg-red-50 border-red-400', badge: 'bg-red-700 text-white' },
};

export default function RealReturnClient(): React.ReactElement {
  const [inputs, setInputs] = useState<OfferInput>(DEFAULT_OFFER);

  useEffect(() => { trackCalculatorUse('real-return'); }, []);

  const set = <K extends keyof OfferInput>(key: K, value: OfferInput[K]): void => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const setMoneyback = (index: number, patch: Partial<Moneyback>): void => {
    setInputs((prev) => {
      const list = prev.moneybacks.map((mb, i) => (i === index ? { ...mb, ...patch } : mb));
      return { ...prev, moneybacks: list };
    });
  };

  const addMoneyback = (): void => {
    setInputs((prev) => ({ ...prev, moneybacks: [...prev.moneybacks, { year: Math.max(2, Math.floor(prev.maturityYear / 2)), amount: 50000 }] }));
  };

  const removeMoneyback = (index: number): void => {
    setInputs((prev) => ({ ...prev, moneybacks: prev.moneybacks.filter((_, i) => i !== index) }));
  };

  const a = useMemo(() => analyzeOffer(inputs), [inputs]);
  const style = BAND_STYLES[a.verdict.band];

  return (
    <div>
      <div className="rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-3 mb-6 text-sm text-yellow-900">
        <strong>Educational only — not advice.</strong> Type in any offer exactly as it was pitched to you. We compute
        the one number the pitch never mentions: the real annual return. Your inputs stay in your browser.
      </div>

      <Calculator
        title="Type in the offer you were pitched"
        description='Example: "Pay Rs 50,000 a year for 15 years, get Rs 14 lakh at year 20." That is the default below — change it to your offer.'
      >
        <CalcSelect
          id="mode"
          label="What shape is the offer?"
          value={inputs.mode}
          onChange={(v) => set('mode', v as OfferMode)}
          options={[
            { value: 'endowment', label: 'Pay every year, get a lump sum later (endowment style)' },
            { value: 'moneyback', label: 'Pay every year, get payouts along the way (money-back style)' },
            { value: 'lumpsum', label: 'Pay once, get an amount later (FD / "double your money" style)' },
          ]}
        />
        {inputs.mode === 'lumpsum' ? (
          <CalcSlider id="lumpsum" label="Amount you pay today" value={inputs.lumpsumPaid} onChange={(v) => set('lumpsumPaid', v)} min={10000} max={10000000} step={10000} prefix="₹ " displayValue={formatCompactINR(inputs.lumpsumPaid)} />
        ) : (
          <>
            <CalcSlider id="annual" label="Amount you pay per year" value={inputs.annualPayment} onChange={(v) => set('annualPayment', v)} min={5000} max={1000000} step={5000} prefix="₹ " displayValue={formatCompactINR(inputs.annualPayment)} />
            <CalcSlider id="payyears" label="For how many years do you pay?" value={inputs.payingYears} onChange={(v) => set('payingYears', Math.min(v, inputs.maturityYear))} min={1} max={40} step={1} suffix=" years" />
          </>
        )}
        <CalcSlider id="matyear" label="Final amount arrives in year" value={inputs.maturityYear} onChange={(v) => set('maturityYear', v)} min={1} max={40} step={1} suffix=" years" />
        <CalcSlider id="matamount" label="Final amount you receive" value={inputs.maturityAmount} onChange={(v) => set('maturityAmount', v)} min={0} max={30000000} step={50000} prefix="₹ " displayValue={formatCompactINR(inputs.maturityAmount)} />

        {inputs.mode === 'moneyback' && (
          <div>
            <p className="text-sm font-medium text-ink mb-2">Payouts along the way</p>
            {inputs.moneybacks.length === 0 && (
              <p className="text-xs text-muted-2 mb-2">Add each money-back payout the plan promises (for example Rs 1 lakh in year 5).</p>
            )}
            <div className="space-y-2">
              {inputs.moneybacks.map((mb, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label className="text-xs text-muted-2">
                    Year
                    <input type="number" min={1} max={inputs.maturityYear} value={mb.year} onChange={(e) => setMoneyback(i, { year: Number(e.target.value) })} className="input-field mt-0.5 w-20" />
                  </label>
                  <label className="text-xs text-muted-2 flex-1">
                    Amount (₹)
                    <input type="number" min={0} step={10000} value={mb.amount} onChange={(e) => setMoneyback(i, { amount: Number(e.target.value) })} className="input-field mt-0.5 w-full" />
                  </label>
                  <button type="button" onClick={() => removeMoneyback(i)} className="text-xs text-red-600 underline mt-4" aria-label={`Remove payout ${i + 1}`}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {inputs.moneybacks.length < 6 && (
              <button type="button" onClick={addMoneyback} className="mt-2 text-sm text-primary underline">
                + Add a payout
              </button>
            )}
          </div>
        )}
      </Calculator>

      {/* The verdict */}
      <div className={`rounded-xl border-2 px-5 py-5 mt-8 ${style.box}`}>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>REAL ANNUAL RETURN</span>
          <span className="text-3xl font-extrabold text-navy">{a.irrPct !== null ? `${a.irrPct}%` : '—'}</span>
        </div>
        <h2 className="text-lg font-bold text-navy mb-1">{a.verdict.title}</h2>
        <p className="text-sm text-ink">{a.verdict.message}</p>
      </div>

      {a.valid && (
        <>
          {/* Agent's number vs reality */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">The pitch says</p>
              <p className="text-2xl font-bold text-navy">{a.multiple}x your money</p>
              <p className="text-xs text-muted-2 mt-1">Pay {formatCompactINR(a.totalPaid)}, receive {formatCompactINR(a.totalReceived)}</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">The math says</p>
              <p className="text-2xl font-bold text-primary">{a.irrPct !== null ? `${a.irrPct}% / year` : '—'}</p>
              <p className="text-xs text-muted-2 mt-1">{a.doublingYears !== null ? `Money doubles every ~${Math.round(a.doublingYears)} years at this rate` : 'This money never doubles'}</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Buying power today</p>
              <p className="text-2xl font-bold text-navy">{formatCompactINR(a.receivedTodayValue)}</p>
              <p className="text-xs text-muted-2 mt-1">What everything you receive is worth in today&apos;s rupees (6% inflation)</p>
            </div>
          </div>

          {/* Benchmarks */}
          <div className="card my-6 overflow-x-auto">
            <h3 className="text-base font-semibold mb-1">The same payments, somewhere boring instead</h3>
            <p className="text-xs text-muted-2 mb-3">
              If you invested the exact same amounts on the exact same dates, here is what you would have by year {a.horizonYears}. The offer gives you {formatCompactINR(a.totalReceived)} in total.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-2 border-b border-line">
                  <th className="py-2 font-medium">Alternative</th>
                  <th className="py-2 font-medium text-right">Rate</th>
                  <th className="py-2 font-medium text-right">Value at year {a.horizonYears}</th>
                  <th className="py-2 font-medium text-right">vs this offer</th>
                </tr>
              </thead>
              <tbody>
                {a.benchmarks.map((b) => {
                  const diff = b.futureValue - a.totalReceived;
                  return (
                    <tr key={b.name} className="border-b border-line/60">
                      <td className="py-2 text-ink"><div className="font-medium">{b.name}</div><div className="text-xs text-muted-2">{b.note}</div></td>
                      <td className="py-2 text-right text-muted">{b.ratePct}%</td>
                      <td className="py-2 text-right font-medium">{formatCompactINR(b.futureValue)}</td>
                      <td className={`py-2 text-right font-medium ${diff > 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {diff > 0 ? `+${formatCompactINR(diff)}` : `−${formatCompactINR(Math.abs(diff))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-2 mt-2">Money-back payouts arrive earlier than maturity; the real-return figure above already accounts for that timing.</p>
          </div>

          <InArticleAd />

          {/* Red flags */}
          {a.redFlags.length > 0 && (
            <div className="card my-6 border-red-200">
              <h3 className="text-base font-semibold mb-3 text-red-700">Read this before you sign</h3>
              <ul className="space-y-2 list-disc pl-5">
                {a.redFlags.map((f, i) => (
                  <li key={i} className="text-sm text-ink">{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-paper-2 border border-line rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Assumptions</h4>
            <ul className="space-y-1 list-disc pl-5">
              {a.assumptions.map((s, i) => (
                <li key={i} className="text-xs text-muted-2">{s}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
