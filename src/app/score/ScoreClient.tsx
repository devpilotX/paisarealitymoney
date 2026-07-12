'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import ScoreGauge from '@/components/score/ScoreGauge';
import { computeScore } from '@/lib/health-score/score';
import { deriveScoreInput, type OnboardingForm } from '@/lib/health-score/derive';
import { PILLAR_NAMES, PILLAR_LABEL, type PillarName } from '@/lib/score-config';
import { cohortKey, cohortDescription, percentileRank, benchmarkSentence, type CityTier } from '@/lib/health-score/cohort';
import type { Benchmark } from '@/lib/db/benchmark-repo';
import { trackCalculatorUse } from '@/lib/analytics';

const ASSETS = ['equity', 'debt', 'gold', 'cash', 'realestate'] as const;

// Defaults mirror the brief's ~737 worked example.
const DEFAULT_FORM: OnboardingForm = {
  monthlyIncome: 60000, monthlyExpense: 45000, liquidSavings: 90000, monthlyDebtPayment: 12000,
  hasCcRevolving: false, monthlyInvested: 6000, assetClasses: ['equity', 'gold'], healthCover: 500000,
  termCover: 0, dependents: 0, age: 30, retirementAge: 60, currentCorpus: 500000, tracksSpending: true,
  missedEmi6mo: false, cibil: 760, hasWrittenBudget: false, taxRegime: 'new',
};

function Num({ label, value, onChange, prefix = '\u20B9' }: { label: string; value: number; onChange: (v: number) => void; prefix?: string }): React.ReactElement {
  return (
    <label className="block"><span className="block text-xs text-muted-2 mb-0.5">{label}</span>
      <div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-2 text-xs">{prefix}</span>
        <input type="number" value={Number.isFinite(value) ? value : 0} min={0} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-6 pr-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
    </label>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }): React.ReactElement {
  return (<label className="flex items-center gap-2 text-sm text-ink min-h-[40px] cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded border-line accent-primary" />{label}</label>);
}

export default function ScoreClient(): React.ReactElement {
  const [form, setForm] = useState<OnboardingForm>(DEFAULT_FORM);
  const [cityTier, setCityTier] = useState<CityTier>('metro');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ scoreId: string } | null>(null);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);

  useEffect(() => { trackCalculatorUse('health-score'); }, []);
  const set = useCallback(<K extends keyof OnboardingForm>(k: K, v: OnboardingForm[K]) => { setForm((p) => ({ ...p, [k]: v })); setSaved(null); }, []);

  const result = useMemo(() => computeScore(deriveScoreInput(form)), [form]);

  // "You vs people like you" - fetch the cohort benchmark (null if cohort < 50; show nothing).
  const cohort = useMemo(() => cohortKey(form.age, cityTier, form.monthlyIncome * 12), [form.age, cityTier, form.monthlyIncome]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/benchmark?cohort=${encodeURIComponent(cohort)}`);
        const data = await res.json() as { success: boolean; benchmark: Benchmark | null };
        if (active) setBenchmark(data.success ? data.benchmark : null);
      } catch { if (active) setBenchmark(null); }
    })();
    return () => { active = false; };
  }, [cohort]);

  const toggleAsset = (a: string): void => set('assetClasses', form.assetClasses.includes(a) ? form.assetClasses.filter((x) => x !== a) : [...form.assetClasses, a]);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const res = await fetch('/api/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...deriveScoreInput(form), taxRegime: form.taxRegime, source: 'onboarding' }) });
      const data = await res.json() as { success: boolean; scoreId?: string };
      if (data.success && data.scoreId) setSaved({ scoreId: data.scoreId });
    } finally { setSaving(false); }
  };

  const beatsLine = benchmark
    ? benchmarkSentence('overall score', percentileRank(result.totalScore, benchmark.totalPercentiles), cohortDescription(form.age, cityTier, form.monthlyIncome * 12))
    : null;

  return (
    <div>
      {/* Hero gauge - at the very top, like a CIBIL score */}
      <div className="card text-center mb-6">
        <ScoreGauge score={result.totalScore} band={result.band} />
        {beatsLine && <p className="text-sm text-primary font-medium mt-2">{beatsLine}</p>}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
          {result.topActions.map((a, i) => (
            <a key={i} href={a.link} className="block text-left rounded-lg border border-line p-3 no-underline hover:border-primary">
              <span className="text-xs text-green-700 font-semibold">+{a.pointsRecoverable} pts</span>
              <span className="block text-sm text-ink mt-0.5">{a.label}</span>
            </a>
          ))}
        </div>
        <div className="mt-4">
          <button type="button" onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save my score'}</button>
          {saved && <a href={`/score/r/${saved.scoreId}`} className="ml-3 link-internal">Share / view result -&gt;</a>}
          <p className="text-xs text-muted-2 mt-2">Saving keeps your history. Works logged-out; sign in to keep it across devices.</p>
        </div>
        <EmailScore score={result.totalScore} band={result.band} pillars={PILLAR_NAMES.map(n => ({ name: PILLAR_LABEL[n], score: result.pillars[n].score }))} />
      </div>

      {/* Pillar breakdown */}
      <div className="card mb-6">
        <h2 className="heading-3 mb-3">Your eight pillars</h2>
        <div className="space-y-3">
          {PILLAR_NAMES.map((n: PillarName) => { const p = result.pillars[n]; return (
            <div key={n}>
              <div className="flex justify-between text-sm mb-1"><span className="font-medium text-ink">{PILLAR_LABEL[n]}</span><span className="text-muted-2">{p.score}/100</span></div>
              <div className="h-2 bg-line/40 rounded-full overflow-hidden"><div className="h-2 rounded-full bg-primary" style={{ width: `${p.score}%` }} /></div>
              <p className="text-xs text-muted-2 mt-1">{p.reason}</p>
            </div>
          ); })}
        </div>
      </div>

      {/* Inputs */}
      <div className="card">
        <h2 className="heading-3 mb-3">Your details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Num label="Monthly income" value={form.monthlyIncome} onChange={(v) => set('monthlyIncome', v)} />
          <Num label="Monthly expense" value={form.monthlyExpense} onChange={(v) => set('monthlyExpense', v)} />
          <Num label="Liquid savings" value={form.liquidSavings} onChange={(v) => set('liquidSavings', v)} />
          <Num label="Monthly EMIs" value={form.monthlyDebtPayment} onChange={(v) => set('monthlyDebtPayment', v)} />
          <Num label="Monthly invested" value={form.monthlyInvested} onChange={(v) => set('monthlyInvested', v)} />
          <Num label="Current corpus" value={form.currentCorpus} onChange={(v) => set('currentCorpus', v)} />
          <Num label="Term cover" value={form.termCover ?? 0} onChange={(v) => set('termCover', v)} />
          <Num label="Health cover" value={form.healthCover ?? 0} onChange={(v) => set('healthCover', v)} />
          <Num label="Age" value={form.age} onChange={(v) => set('age', v)} prefix="" />
          <Num label="Retirement age" value={form.retirementAge} onChange={(v) => set('retirementAge', v)} prefix="" />
          <Num label="Dependents" value={form.dependents} onChange={(v) => set('dependents', v)} prefix="" />
          <Num label="CIBIL (optional)" value={form.cibil ?? 0} onChange={(v) => set('cibil', v > 0 ? v : undefined)} prefix="" />
          <label className="block"><span className="block text-xs text-muted-2 mb-0.5">City tier</span>
            <select value={cityTier} onChange={(e) => setCityTier(e.target.value as CityTier)} className="w-full px-2 py-2 border border-line rounded-lg text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="metro">Metro</option><option value="tier1">Tier 1</option><option value="tier2">Tier 2</option><option value="tier3">Tier 3</option>
            </select>
          </label>
        </div>
        <div className="mt-3">
          <span className="block text-xs text-muted-2 mb-1">Asset classes you hold</span>
          <div className="flex flex-wrap gap-2">
            {ASSETS.map((a) => (
              <button key={a} type="button" onClick={() => toggleAsset(a)} className={`text-xs px-3 py-1.5 rounded-full border ${form.assetClasses.includes(a) ? 'border-primary bg-primary-50 text-primary' : 'border-line text-muted'}`}>{a}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Toggle label="Carry a credit-card balance" checked={form.hasCcRevolving} onChange={(v) => set('hasCcRevolving', v)} />
          <Toggle label="Missed an EMI in 6 months" checked={form.missedEmi6mo} onChange={(v) => set('missedEmi6mo', v)} />
          <Toggle label="I track my spending" checked={form.tracksSpending} onChange={(v) => set('tracksSpending', v)} />
          <Toggle label="I keep a written budget" checked={form.hasWrittenBudget} onChange={(v) => set('hasWrittenBudget', v)} />
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800"><strong>Educational only, not financial advice.</strong> Your score is an estimate from the details you enter and is computed in your browser. Required-corpus and tax figures reuse our Retirement and Tax engines with conservative defaults.</p>
      </div>
    </div>
  );
}

function EmailScore({ score, band, pillars }: { score: number; band: string; pillars: { name: string; score: number }[] }): React.ReactElement {
  const [email, setEmail] = useState('');
  const [subscribe, setSubscribe] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'err'>('idle');

  const send = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/score/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, score, band, pillars, subscribe }),
      });
      setStatus(res.ok ? 'done' : 'err');
    } catch { setStatus('err'); }
  };

  if (status === 'done') return <p className="text-sm text-green-700 mt-4">Score sent to your email!</p>;

  return (
    <form onSubmit={send} className="mt-4 flex flex-col gap-2">
      <p className="text-sm text-muted">Email me my result:</p>
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          className="flex-1 px-3 py-2 text-sm border border-line rounded-lg focus:border-primary focus:outline-none" />
        <button type="submit" disabled={status === 'sending'} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-800 disabled:opacity-60">
          {status === 'sending' ? '...' : 'Send'}
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-2 cursor-pointer">
        <input type="checkbox" checked={subscribe} onChange={e => setSubscribe(e.target.checked)} className="rounded border-line accent-primary" />
        Also subscribe to the newsletter
      </label>
      {status === 'err' && <p className="text-xs text-red-600">Failed to send. Try again.</p>}
    </form>
  );
}
