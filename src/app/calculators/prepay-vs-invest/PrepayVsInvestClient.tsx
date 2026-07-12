'use client';

import { useState, useEffect, useCallback } from 'react';
import Calculator, { CalcSlider, CalcSelect } from '@/components/Calculator';
import DistributionChart from '@/components/DistributionChart';
import SuccessGauge from '@/components/SuccessGauge';
import InArticleAd from '@/components/InArticleAd';
import { formatINR, formatCompactINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzePrepayVsInvest,
  DEFAULT_INPUTS,
  VEHICLE_DEFAULTS,
  type PrepayInvestInputs,
  type PrepayInvestAnalysis,
  type InvestmentVehicle,
} from '@/lib/prepay-vs-invest';

function StatCard({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'good' | 'warn' | 'bad' }): React.ReactElement {
  const toneClass = tone === 'good' ? 'text-green-700' : tone === 'warn' ? 'text-brown' : tone === 'bad' ? 'text-brand-red' : 'text-navy';
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-2 mt-1">{sub}</p>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }): React.ReactElement {
  return (
    <div className={`flex justify-between gap-4 text-sm py-1 ${strong ? 'font-semibold border-t border-line pt-2 mt-1' : ''}`}>
      <span className="text-muted">{label}</span>
      <span className={strong ? 'text-navy' : 'font-medium text-navy'}>{value}</span>
    </div>
  );
}

const SLAB_OPTIONS = [
  { value: '0', label: 'No tax (0%)' },
  { value: '5.2', label: '5% slab (5.2% incl. cess)' },
  { value: '20.8', label: '20% slab (20.8% incl. cess)' },
  { value: '31.2', label: '30% slab (31.2% incl. cess)' },
  { value: '35.88', label: '30% + surcharge (35.88%)' },
];

function riskLabel(g: number): string {
  if (g <= 0) return 'None. maximise expected ₹';
  if (g <= 2) return 'Low';
  if (g <= 5) return 'Moderate';
  return 'High. protect the downside';
}

export default function PrepayVsInvestClient(): React.ReactElement {
  const [inputs, setInputs] = useState<PrepayInvestInputs>(DEFAULT_INPUTS);
  const [analysis, setAnalysis] = useState<PrepayInvestAnalysis | null>(null);
  const [computing, setComputing] = useState<boolean>(true);
  const [showWorking, setShowWorking] = useState<boolean>(false);

  const set = useCallback(<K extends keyof PrepayInvestInputs>(key: K, value: PrepayInvestInputs[K]): void => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setVehicle = useCallback((v: InvestmentVehicle): void => {
    setInputs((prev) => ({ ...prev, vehicle: v, expectedReturnPct: VEHICLE_DEFAULTS[v].returnPct, volatilityPct: VEHICLE_DEFAULTS[v].volPct }));
  }, []);

  useEffect(() => { trackCalculatorUse('prepay-vs-invest'); }, []);

  // Debounced synchronous compute (engine is fast; no worker needed).
  useEffect(() => {
    setComputing(true);
    const id = setTimeout(() => {
      setAnalysis(analyzePrepayVsInvest(inputs));
      setComputing(false);
    }, 180);
    return () => clearTimeout(id);
  }, [inputs]);

  const tenureYears = Math.round(inputs.remainingTenureMonths / 12);
  const f = analysis ? analysis.optimalInvestFraction : 0;
  const investMonthly = Math.round(inputs.monthlySurplus * f);
  const prepayMonthly = inputs.monthlySurplus - investMonthly;

  const verdictText = (): { title: string; tone: string; body: string } => {
    if (!analysis) return { title: '', tone: '', body: '' };
    const conf = Math.round(analysis.probInvestBeatsPrepay * 100);
    if (analysis.verdict === 'invest') {
      return { title: `Invest the surplus. ${conf}% chance of higher net worth`, tone: 'bg-green-50 border-green-200', body: `On a risk-adjusted basis, investing your ₹${formatCompactINR(inputs.monthlySurplus)}/month beats prepaying. Investing finishes ahead in ${conf}% of 10,000 simulated futures.` };
    }
    if (analysis.verdict === 'prepay') {
      return { title: `Prepay your loan. the safer win`, tone: 'bg-brand-yellow-soft/30 border-brand-yellow/50', body: `Your guaranteed after-tax loan rate of ${analysis.effectiveRate.effectiveAfterTaxRatePct.toFixed(2)}% is hard to beat for the risk. Investing only wins in ${conf}% of scenarios. not enough to justify the risk at your risk-aversion setting.` };
    }
    return { title: `Split it. invest ${Math.round(f * 100)}%, prepay ${Math.round((1 - f) * 100)}%`, tone: 'bg-primary-50 border-primary-100', body: `A hybrid maximises your risk-adjusted (certainty-equivalent) wealth: invest about ₹${formatCompactINR(investMonthly)}/month and prepay ₹${formatCompactINR(prepayMonthly)}/month. Investing alone wins in ${conf}% of futures.` };
  };

  const v = verdictText();

  return (
    <div>
      <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-6 text-sm text-primary-800">
        <strong>100% private.</strong> All {(inputs.numSimulations ?? 10000).toLocaleString('en-IN')} simulations run in your browser. Your loan and income details never leave your device.
      </div>

      {/* Inputs */}
      <Calculator title="Your loan & surplus" description="Compare prepaying your home loan against investing the extra money. Results update automatically.">
        <CalcSlider id="principal" label="Outstanding loan principal" value={inputs.outstandingPrincipal} onChange={(x) => set('outstandingPrincipal', x)} min={100000} max={50000000} step={100000} prefix="₹ " displayValue={formatCompactINR(inputs.outstandingPrincipal)} />
        <CalcSlider id="rate" label="Loan interest rate" value={inputs.annualRatePct} onChange={(x) => set('annualRatePct', x)} min={5} max={15} step={0.05} suffix="%" />
        <CalcSlider id="tenure" label="Remaining tenure" value={tenureYears} onChange={(x) => set('remainingTenureMonths', x * 12)} min={1} max={30} step={1} suffix=" years" />
        <CalcSlider id="surplus" label="Monthly surplus to deploy" value={inputs.monthlySurplus} onChange={(x) => set('monthlySurplus', x)} min={0} max={500000} step={1000} prefix="₹ " displayValue={formatCompactINR(inputs.monthlySurplus)} />
        <CalcSlider id="lump" label="One-time lump sum (optional)" value={inputs.lumpSum} onChange={(x) => set('lumpSum', x)} min={0} max={20000000} step={50000} prefix="₹ " displayValue={formatCompactINR(inputs.lumpSum)} />
        <CalcSlider id="horizon" label="Comparison horizon" value={inputs.horizonYears} onChange={(x) => set('horizonYears', x)} min={1} max={30} step={1} suffix=" years" />

        <CalcSelect id="vehicle" label="If you invest, where?" value={inputs.vehicle} onChange={(x) => setVehicle(x as InvestmentVehicle)} options={[
          { value: 'equity', label: VEHICLE_DEFAULTS.equity.label },
          { value: 'hybrid', label: VEHICLE_DEFAULTS.hybrid.label },
          { value: 'debt', label: VEHICLE_DEFAULTS.debt.label },
        ]} />
        <CalcSlider id="ret" label="Expected return" value={inputs.expectedReturnPct} onChange={(x) => set('expectedReturnPct', x)} min={3} max={18} step={0.5} suffix="%" />
        <CalcSlider id="vol" label="Volatility (risk)" value={inputs.volatilityPct} onChange={(x) => set('volatilityPct', x)} min={0} max={35} step={1} suffix="%" />

        <CalcSelect id="regime" label="Tax regime" value={inputs.taxRegime} onChange={(x) => set('taxRegime', x as 'old' | 'new')} options={[
          { value: 'new', label: 'New regime (no home-loan interest deduction)' },
          { value: 'old', label: 'Old regime (Section 24(b) available)' },
        ]} />
        <CalcSelect id="slab" label="Your marginal tax rate" value={String(inputs.marginalSlabPct)} onChange={(x) => set('marginalSlabPct', Number(x))} options={SLAB_OPTIONS} />
        {inputs.taxRegime === 'old' && (
          <CalcSelect id="claim" label="Claim Section 24(b) interest deduction? (self-occupied)" value={inputs.claimSec24b ? 'yes' : 'no'} onChange={(x) => set('claimSec24b', x === 'yes')} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        )}

        <CalcSlider id="risk" label="Your risk aversion" value={inputs.riskAversion} onChange={(x) => set('riskAversion', x)} min={0} max={10} step={1} displayValue={`${inputs.riskAversion}. ${riskLabel(inputs.riskAversion)}`} />
        <CalcSlider id="penalty" label="Prepayment penalty (usually 0% on floating loans)" value={inputs.prepaymentPenaltyPct} onChange={(x) => set('prepaymentPenaltyPct', x)} min={0} max={5} step={0.5} suffix="%" />
      </Calculator>

      {/* Results */}
      <div className="mt-10" aria-live="polite">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="heading-2">The verdict</h2>
          {computing && (
            <span className="text-sm text-muted-2 inline-flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
              Simulating {(inputs.numSimulations ?? 10000).toLocaleString('en-IN')} scenarios…
            </span>
          )}
        </div>

        {analysis && (
          <>
            <div className={`card mb-6 ${v.tone}`}>
              <h3 className="text-lg font-bold mb-1">{v.title}</h3>
              <p className="text-sm text-ink">{v.body}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
              <div className="card">
                <SuccessGauge probability={analysis.probInvestBeatsPrepay} target={0.5} label="Chance investing beats prepaying" />
              </div>
              <div className="space-y-3">
                <StatCard label="Prepay. guaranteed value" value={formatCompactINR(analysis.prepayValue)} sub={`Risk-free at ${analysis.effectiveRate.effectiveAfterTaxRatePct.toFixed(2)}% effective after-tax loan rate`} />
                <StatCard label="Invest. expected value" value={formatCompactINR(analysis.investDistribution.mean)} sub={`Median ${formatCompactINR(analysis.investDistribution.p50)} · 10th to 90th: ${formatCompactINR(analysis.investDistribution.p10)} to ${formatCompactINR(analysis.investDistribution.p90)}`} tone="good" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Breakeven return needed" value={analysis.breakevenReturnPct === null ? '> 50%' : `${analysis.breakevenReturnPct.toFixed(1)}%`} sub="Investment return required to tie prepaying" />
              <StatCard label="Recommended split" value={`${Math.round(f * 100)}% invest / ${Math.round((1 - f) * 100)}% prepay`} sub="Maximises risk-adjusted wealth" tone="default" />
              <StatCard label="If you prepay it all" value={`${(analysis.tenureCutMonths / 12).toFixed(1)} yrs sooner`} sub={`Saves ${formatCompactINR(analysis.afterTaxInterestSaved)} interest (after tax)`} tone="good" />
            </div>

            {/* Distribution */}
            <div className="card mb-6">
              <h3 className="text-base font-semibold mb-1">Net-worth distribution: invest vs prepay</h3>
              <p className="text-xs text-muted-2 mb-3">
                After-tax outcomes of investing across {(inputs.numSimulations ?? 10000).toLocaleString('en-IN')} simulated futures. Bars right of the red line beat the guaranteed prepay outcome; bars left fall short.
              </p>
              <DistributionChart histogram={analysis.investHistogram} prepayValue={analysis.prepayValue} median={analysis.investDistribution.p50} probInvestBeats={analysis.probInvestBeatsPrepay} />
            </div>

            <InArticleAd />

            {/* Amortization comparison */}
            <div className="card my-6 overflow-x-auto">
              <h3 className="text-base font-semibold mb-3">What prepaying does to your loan</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-2 border-b border-line">
                    <th className="py-2 font-medium">&nbsp;</th>
                    <th className="py-2 font-medium text-right">Without prepay</th>
                    <th className="py-2 font-medium text-right">With full prepay</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line/60"><td className="py-2 text-muted">Monthly EMI</td><td className="py-2 text-right">{formatINR(Math.round(analysis.emi))}</td><td className="py-2 text-right">{formatINR(Math.round(analysis.emi))}</td></tr>
                  <tr className="border-b border-line/60"><td className="py-2 text-muted">Total interest paid</td><td className="py-2 text-right">{formatINR(Math.round(analysis.amortNoPrepay.totalInterest))}</td><td className="py-2 text-right">{formatINR(Math.round(analysis.amortWithPrepay.totalInterest))}</td></tr>
                  <tr className="border-b border-line/60"><td className="py-2 text-muted">Loan cleared in</td><td className="py-2 text-right">{(analysis.amortNoPrepay.payoffMonths / 12).toFixed(1)} yrs</td><td className="py-2 text-right">{(analysis.amortWithPrepay.payoffMonths / 12).toFixed(1)} yrs</td></tr>
                </tbody>
              </table>
              <div className="mt-3 text-sm text-ink">
                Prepaying saves <strong>{formatINR(Math.round(analysis.interestSaved))}</strong> in interest{analysis.effectiveRate.shieldApplies ? <> (<strong>{formatINR(Math.round(analysis.afterTaxInterestSaved))}</strong> after losing the tax shield)</> : null} and clears the loan <strong>{(analysis.tenureCutMonths / 12).toFixed(1)} years</strong> early.
              </div>
            </div>

            {/* Show working */}
            <div className="card my-6">
              <button type="button" onClick={() => setShowWorking((s) => !s)} className="w-full flex items-center justify-between text-left font-semibold text-navy min-h-[44px]" aria-expanded={showWorking}>
                <span>Show the after-tax math</span>
                <span className={`transition-transform ${showWorking ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
              </button>
              {showWorking && (
                <div className="mt-4 space-y-5 text-sm">
                  <div>
                    <h4 className="font-semibold text-navy mb-1">1. Effective after-tax loan rate (the prepay "return")</h4>
                    <Row label="Nominal loan rate" value={`${analysis.effectiveRate.nominalRatePct.toFixed(2)}%`} />
                    {analysis.effectiveRate.shieldApplies ? (
                      <>
                        <Row label="Avg. annual Section 24(b) tax saved" value={formatINR(Math.round(analysis.effectiveRate.avgAnnualShield))} />
                        <Row label="Effective after-tax loan rate" value={`${analysis.effectiveRate.effectiveAfterTaxRatePct.toFixed(2)}%`} strong />
                        <p className="text-muted-2 text-xs mt-1">The shield only reduces the rate for interest under the ₹2L cap. Prepaying also gives up some of this deduction. that loss is netted off the interest saved.</p>
                      </>
                    ) : (
                      <p className="text-muted-2 text-xs mt-1">No Section 24(b) shield in the new regime (or not claimed), so the effective rate equals the nominal {analysis.effectiveRate.nominalRatePct.toFixed(2)}%.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy mb-1">2. Investing the surplus (after capital-gains tax)</h4>
                    <Row label="Total surplus invested (cost basis)" value={formatINR(Math.round(analysis.investedPrincipal))} />
                    <Row label="Median outcome (after tax)" value={formatINR(Math.round(analysis.investDistribution.p50))} />
                    <Row label="Expected outcome (after tax)" value={formatINR(Math.round(analysis.investDistribution.mean))} />
                    <Row label="Pessimistic (10th percentile)" value={formatINR(Math.round(analysis.investDistribution.p10))} />
                    <Row label="Optimistic (90th percentile)" value={formatINR(Math.round(analysis.investDistribution.p90))} />
                    <p className="text-muted-2 text-xs mt-1">{inputs.vehicle === 'debt' ? 'Debt gains taxed at your slab rate.' : 'Equity/hybrid gains: 12.5% LTCG over the ₹1.25L exemption (20% STCG if held under a year).'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy mb-1">3. Risk-adjusted hybrid split (certainty-equivalent wealth)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-left text-muted-2 border-b border-line"><th className="py-1.5 font-medium">Invest %</th><th className="py-1.5 font-medium text-right">Expected wealth</th><th className="py-1.5 font-medium text-right">Certainty-equivalent</th></tr></thead>
                        <tbody>
                          {analysis.hybridCurve.filter((_, i) => i % 4 === 0).map((pt) => (
                            <tr key={pt.investFraction} className={`border-b border-line/60 ${Math.abs(pt.investFraction - f) < 0.001 ? 'bg-primary-50 font-semibold' : ''}`}>
                              <td className="py-1.5 text-ink">{Math.round(pt.investFraction * 100)}%</td>
                              <td className="py-1.5 text-right">{formatCompactINR(pt.expectedWealth)}</td>
                              <td className="py-1.5 text-right">{formatCompactINR(pt.certaintyEquivalent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-muted-2 text-xs mt-1">Certainty-equivalent applies CRRA utility (risk aversion γ = {inputs.riskAversion}). The split with the highest certainty-equivalent is your risk-adjusted optimum: <strong>{Math.round(f * 100)}% invest</strong>.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Educational estimate, not financial, tax or investment advice.</strong> Outcomes are simulated scenarios based on your assumptions, not predictions or a recommendation to buy or sell any security. Market returns are uncertain and past performance does not guarantee future results. Tax rules are modelled for FY 2025-26 and simplified. verify Section 24(b), capital-gains and surcharge specifics with a qualified professional before acting.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
