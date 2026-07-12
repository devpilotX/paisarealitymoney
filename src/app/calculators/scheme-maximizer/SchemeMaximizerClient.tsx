'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Calculator, { CalcSlider, CalcSelect } from '@/components/Calculator';
import InArticleAd from '@/components/InArticleAd';
import { formatINR, formatCompactINR } from '@/lib/constants';
import { ALL_INDIAN_STATES } from '@/lib/cities';
import { trackCalculatorUse } from '@/lib/analytics';
import {
  analyzeSchemes,
  DEFAULT_SCHEME_PROFILE,
  DATASET_VERSION,
  type SchemeProfile,
  type EligibleScheme,
} from '@/lib/scheme-maximizer';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }): React.ReactElement {
  return (
    <label className="flex items-center gap-3 cursor-pointer min-h-[40px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded border-line accent-primary" />
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

function SchemeCard({ e }: { e: EligibleScheme }): React.ReactElement {
  const kindBadge = e.scheme.benefitKind === 'recurring'
    ? { label: `${formatINR(e.annualValue)}/yr`, cls: 'bg-green-100 text-green-800' }
    : e.scheme.benefitKind === 'one-time'
      ? { label: `${formatINR(e.annualValue)} one-time`, cls: 'bg-brand-yellow-soft/70 text-brown' }
      : { label: 'Access / credit', cls: 'bg-paper-2 text-muted' };
  return (
    <div className="border border-line rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="font-semibold text-navy">{e.scheme.name}</h4>
        <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${kindBadge.cls}`}>{kindBadge.label}</span>
      </div>
      <p className="text-xs text-muted-2 mb-2">{e.scheme.valuationNote}</p>
      <p className="text-sm text-ink mb-2"><strong>How to claim:</strong> {e.scheme.howToApply}</p>
      <div className="flex items-center justify-between gap-2">
        <a href={e.scheme.applyLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">Official link →</a>
        <span className="text-xs text-muted-2">Verified {e.scheme.lastVerified}</span>
      </div>
    </div>
  );
}

export default function SchemeMaximizerClient(): React.ReactElement {
  const [profile, setProfile] = useState<SchemeProfile>(DEFAULT_SCHEME_PROFILE);

  useEffect(() => { trackCalculatorUse('scheme-maximizer'); }, []);

  const set = useCallback(<K extends keyof SchemeProfile>(key: K, value: SchemeProfile[K]): void => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const a = useMemo(() => analyzeSchemes(profile), [profile]);

  const recurring = a.optimalSet.filter((e) => e.scheme.benefitKind === 'recurring');
  const oneTime = a.optimalSet.filter((e) => e.scheme.benefitKind === 'one-time');

  return (
    <div>
      <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-6 text-sm text-primary-800">
        <strong>100% private.</strong> Your profile is matched against the scheme dataset entirely in your browser. nothing is sent to any server. Dataset version {DATASET_VERSION}.
      </div>

      <Calculator title="Your profile" description="Tell us about yourself to find the central government schemes you can claim. and what they're worth per year.">
        <CalcSlider id="age" label="Age" value={profile.age ?? 0} onChange={(v) => set('age', v)} min={0} max={100} step={1} suffix=" yrs" />
        <CalcSelect id="gender" label="Gender" value={profile.gender ?? 'male'} onChange={(v) => set('gender', v as SchemeProfile['gender'])} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'transgender', label: 'Transgender' }]} />
        <CalcSlider id="income" label="Annual family income" value={profile.income ?? 0} onChange={(v) => set('income', v)} min={0} max={3000000} step={25000} prefix="₹ " displayValue={formatCompactINR(profile.income ?? 0)} />
        <CalcSelect id="occupation" label="Occupation" value={profile.occupation ?? 'farmer'} onChange={(v) => set('occupation', v as SchemeProfile['occupation'])} options={[
          { value: 'farmer', label: 'Farmer' }, { value: 'employed', label: 'Employed' }, { value: 'self_employed', label: 'Self-employed' },
          { value: 'business', label: 'Business' }, { value: 'student', label: 'Student' }, { value: 'unemployed', label: 'Unemployed' },
          { value: 'daily_wage', label: 'Daily wage' }, { value: 'homemaker', label: 'Homemaker' }, { value: 'retired', label: 'Retired' },
        ]} />
        <CalcSelect id="category" label="Category" value={profile.category ?? 'general'} onChange={(v) => set('category', v as SchemeProfile['category'])} options={[
          { value: 'general', label: 'General' }, { value: 'obc', label: 'OBC' }, { value: 'sc', label: 'SC' }, { value: 'st', label: 'ST' }, { value: 'ews', label: 'EWS' },
        ]} />
        <CalcSelect id="area" label="Area" value={profile.area ?? 'rural'} onChange={(v) => set('area', v as SchemeProfile['area'])} options={[{ value: 'rural', label: 'Rural' }, { value: 'urban', label: 'Urban' }]} />
        <CalcSelect id="state" label="State" value={profile.state ?? ''} onChange={(v) => set('state', v)} options={[{ value: '', label: 'Select state (for context)' }, ...ALL_INDIAN_STATES.map((s) => ({ value: s, label: s }))]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <Toggle label="Below Poverty Line (BPL)" checked={!!profile.bpl} onChange={(v) => set('bpl', v)} />
          <Toggle label="Own agricultural land" checked={!!profile.hasLandholding} onChange={(v) => set('hasLandholding', v)} />
          <Toggle label="Person with disability (80%+)" checked={!!profile.disability} onChange={(v) => set('disability', v)} />
          <Toggle label="Have a girl child under 10" checked={!!profile.hasGirlChildUnder10} onChange={(v) => set('hasGirlChildUnder10', v)} />
          <Toggle label="Widow" checked={!!profile.isWidow} onChange={(v) => set('isWidow', v)} />
        </div>
      </Calculator>

      {/* Headline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        <div className="card bg-green-50 border-green-200 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Your total benefit (conflict-resolved optimal set)</p>
          <p className="text-3xl font-bold text-green-700">{formatINR(a.totalAnnualBenefit)}<span className="text-base font-normal text-muted-2">/year</span></p>
          {a.totalOneTimeBenefit > 0 && <p className="text-sm text-muted mt-1">plus <strong>{formatINR(a.totalOneTimeBenefit)}</strong> in one-time benefits</p>}
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-muted-2 mb-1">Schemes you qualify for</p>
          <p className="text-3xl font-bold text-primary">{a.eligible.length}</p>
          <p className="text-xs text-muted-2 mt-1">{a.optimalSet.length} in your optimal (non-conflicting) set</p>
        </div>
      </div>

      {a.conflictsResolved && (
        <div className="rounded-lg bg-brand-yellow-soft/30 border border-brand-yellow/50 p-3 mb-6 text-sm text-brown">
          Some schemes you qualify for overlap (e.g. you can draw only one social-security pension). We picked the combination that maximises your total benefit.
        </div>
      )}

      {/* Recurring schemes */}
      {recurring.length > 0 && (
        <div className="my-6">
          <h2 className="heading-2 mb-1">Recurring benefits (every year)</h2>
          <p className="text-sm text-muted-2 mb-4">Ranked by annual rupee value. Apply to each via its official link.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurring.map((e) => <SchemeCard key={e.scheme.id} e={e} />)}
          </div>
        </div>
      )}

      <InArticleAd />

      {/* One-time schemes */}
      {oneTime.length > 0 && (
        <div className="my-6">
          <h2 className="heading-2 mb-1">One-time benefits</h2>
          <p className="text-sm text-muted-2 mb-4">Claimable once (housing subsidy, toolkit, maternity benefit, etc.).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {oneTime.map((e) => <SchemeCard key={e.scheme.id} e={e} />)}
          </div>
        </div>
      )}

      {/* Facilitation */}
      {a.facilitationSchemes.length > 0 && (
        <div className="card my-6">
          <h3 className="text-base font-semibold mb-1">Also available: credit &amp; access schemes (not a cash benefit)</h3>
          <p className="text-xs text-muted-2 mb-3">These give you access to loans or services. valuable, but the loan itself is not &ldquo;free money&rdquo;, so we count it as ₹0 in your total.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {a.facilitationSchemes.map((e) => <SchemeCard key={e.scheme.id} e={e} />)}
          </div>
        </div>
      )}

      {/* Near misses */}
      {a.nearMisses.length > 0 && (
        <div className="card my-6">
          <h3 className="text-base font-semibold mb-1">So close. change one thing to unlock these</h3>
          <p className="text-xs text-muted-2 mb-3">You miss each of these by a single criterion.</p>
          <ul className="space-y-2">
            {a.nearMisses.map((m) => (
              <li key={m.scheme.id} className="text-sm flex justify-between gap-3">
                <span className="text-ink">{m.scheme.name}</span>
                <span className="text-muted-2 text-right">{m.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.eligible.length === 0 && (
        <div className="card my-6 text-center text-muted">
          <p>No central schemes matched this exact profile. Check the near-misses above, and note that many <strong>state-specific</strong> schemes (not yet in this dataset) may apply. see your state portal.</p>
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Educational estimate, not legal or financial advice.</strong> Eligibility and amounts are simplified for the highest-impact <em>central</em> schemes and valued on a consistent basis (loans counted as ₹0 since the principal is repaid; insurance valued at an equivalent private premium). Actual eligibility, amounts and documents are decided by the implementing authority. always verify on the official portal before applying. Dataset version {DATASET_VERSION}; state schemes are being added.
        </p>
      </div>
    </div>
  );
}
