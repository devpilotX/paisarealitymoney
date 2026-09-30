'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface GrantCard {
  slug: string;
  name: string;
  provider: string;
  region: 'india' | 'international';
  level: string;
  state: string | null;
  kindLabel: string;
  fundingLabel: string;
  fundingType: string;
  amount: string | null;
  stage: string[];
  summary: string;
  statusLabel: string;
  status: string;
  deadlineText: string | null;
}

const REGIONS = [
  { v: 'all', label: 'All' },
  { v: 'india', label: 'India' },
  { v: 'international', label: 'International' },
];
const MONEY = [
  { v: 'all', label: 'Any' },
  { v: 'non-dilutive', label: 'No equity' },
  { v: 'equity', label: 'Takes equity' },
  { v: 'in-kind', label: 'Credits' },
];
const STAGES = [
  { v: 'all', label: 'Any stage' },
  { v: 'idea', label: 'Idea' },
  { v: 'prototype', label: 'Prototype' },
  { v: 'early-revenue', label: 'Early revenue' },
  { v: 'growth', label: 'Growth' },
];

function Segmented({ label, options, value, onChange }: {
  label: string; options: Array<{ v: string; label: string }>; value: string; onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-muted mb-2">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`h-9 px-3.5 rounded-full text-sm font-medium border transition-colors
              ${value === o.v ? 'bg-navy text-white border-navy' : 'bg-white text-ink border-line hover:border-navy/50'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function GrantsExplorer({ grants }: { grants: GrantCard[] }): React.ReactElement {
  const [region, setRegion] = useState('all');
  const [money, setMoney] = useState('all');
  const [stage, setStage] = useState('all');
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return grants.filter((g) =>
      (region === 'all' || g.region === region) &&
      (money === 'all' || g.fundingType === money || (money === 'non-dilutive' && g.fundingType === 'mixed')) &&
      (stage === 'all' || g.stage.includes(stage)) &&
      (!needle || `${g.name} ${g.provider} ${g.summary} ${g.state ?? ''}`.toLowerCase().includes(needle)),
    );
  }, [grants, region, money, stage, q]);

  const reset = (): void => { setRegion('all'); setMoney('all'); setStage('all'); setQ(''); };

  return (
    <div>
      <div className="card-flat !p-5 sm:!p-6 space-y-5">
        <div>
          <label htmlFor="grant-search" className="text-sm font-medium text-muted mb-2 block">Search</label>
          <input id="grant-search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Biotech, Karnataka, cloud credits..." className="input-field sm:max-w-md" />
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-5">
        <Segmented label="Where" options={REGIONS} value={region} onChange={setRegion} />
        <Segmented label="Money" options={MONEY} value={money} onChange={setMoney} />
        <Segmented label="Stage" options={STAGES} value={stage} onChange={setStage} />
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {shown.length === grants.length ? `${grants.length} programmes` : `${shown.length} of ${grants.length} programmes`}
      </p>

      {shown.length === 0 ? (
        <div className="mt-4 card-flat text-center py-12">
          <p className="text-ink font-medium">Nothing matches those filters.</p>
          <button type="button" onClick={reset} className="btn-link mt-3">Clear filters</button>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {shown.map((g) => (
            <li key={g.slug}>
              <Link href={`/grants/${g.slug}`} className="card card-link !p-6 h-full flex flex-col group">
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-2">
                  <span>{g.kindLabel}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{g.region === 'international' ? 'International' : g.state ?? (g.level === 'central' ? 'Government of India' : 'India')}</span>
                  <span className={`ml-auto ${g.status === 'open' || g.status === 'rolling' ? 'badge-green' : 'badge-soft'}`}>{g.statusLabel}</span>
                </div>
                <h3 className="mt-2 text-[17px] font-semibold leading-snug">{g.name}</h3>
                <p className="mt-1 text-sm text-muted-2">{g.provider}</p>
                <p className="mt-3 text-[15px] text-muted leading-relaxed flex-1">{g.summary}</p>
                <div className="mt-5 pt-4 border-t border-line-soft flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <span className="font-semibold text-ink">{g.amount ?? 'Amount case by case'}</span>
                  <span className="text-muted-2">{g.fundingLabel}</span>
                  {g.deadlineText && <span className="text-brand-red font-medium">{g.deadlineText}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
