'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

interface Application {
  id: number; slug: string; name: string; status: string; reference_number: string | null;
  applied_date: string | null; notes: string | null; updated_at: string; official_url: string | null;
}

const STATUS = [
  { v: 'not_started', label: 'Not started', tone: 'badge-soft' },
  { v: 'applied', label: 'Applied', tone: 'badge-navy' },
  { v: 'under_review', label: 'Under review', tone: 'badge' },
  { v: 'approved', label: 'Approved', tone: 'badge-green' },
  { v: 'rejected', label: 'Rejected', tone: 'badge-red' },
];

function Tracker(): React.ReactElement {
  const router = useRouter();
  const add = useSearchParams().get('add');
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    const r = await fetch('/api/applications', { cache: 'no-store' }).catch(() => null);
    if (!r) { setError('We could not reach the server. Try again in a moment.'); return; }
    if (r.status === 401) { router.push('/login?next=/dashboard/tracker'); return; }
    const d = (await r.json()) as { success: boolean; applications?: Application[] };
    setApps(d.applications ?? []);
  }, [router]);

  const save = useCallback(async (slug: string, patch: Partial<Application>): Promise<void> => {
    const current = apps?.find((a) => a.slug === slug);
    await fetch('/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        status: patch.status ?? current?.status ?? 'not_started',
        reference_number: patch.reference_number ?? current?.reference_number ?? null,
        applied_date: patch.applied_date ?? current?.applied_date ?? null,
        notes: patch.notes ?? current?.notes ?? null,
      }),
    }).catch(() => null);
    await load();
  }, [apps, load]);

  useEffect(() => { void load(); }, [load]);

  // Arriving from "Track my application" on a saved scheme adds it once.
  useEffect(() => {
    if (!add || apps === null || apps.some((a) => a.slug === add)) return;
    void save(add, { status: 'not_started' }).then(() => router.replace('/dashboard/tracker'));
  }, [add, apps, save, router]);

  const remove = async (id: number): Promise<void> => {
    await fetch('/api/applications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null);
    await load();
  };

  return (
    <div className="container-main py-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Application tracker' }]} />
      <h1 className="heading-1 mt-4">Application tracker</h1>
      <p className="mt-3 text-muted max-w-2xl">
        Keep the status and reference number of every scheme you apply for in one place. Add a scheme from your{' '}
        <Link href="/dashboard/bookmarks" className="link-internal">saved schemes</Link>.
      </p>

      {error && <p role="alert" className="mt-8 callout-red">{error}</p>}
      {!error && apps === null && <p className="mt-10 text-muted-2">Loading your applications</p>}

      {apps && apps.length === 0 && (
        <div className="mt-10 card-flat text-center py-14">
          <p className="text-lg font-medium">No applications tracked yet</p>
          <p className="mt-2 text-muted max-w-md mx-auto">Save a scheme, then choose Track my application to follow it here.</p>
          <Link href="/schemes" className="btn-primary mt-6">Find schemes for you</Link>
        </div>
      )}

      {apps && apps.length > 0 && (
        <ul className="mt-8 space-y-3">
          {apps.map((a) => (
            <li key={a.id} className="card-flat !p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/schemes/${a.slug}`} className="font-semibold text-ink no-underline hover:text-navy">{a.name}</Link>
                  <p className="mt-1 text-sm text-muted-2">Last updated {new Date(a.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={STATUS.find((s) => s.v === a.status)?.tone ?? 'badge-soft'}>{STATUS.find((s) => s.v === a.status)?.label ?? a.status}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  <span className="label">Status</span>
                  <select className="input-field" value={a.status} onChange={(e) => void save(a.slug, { status: e.target.value })}>
                    {STATUS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="label">Reference number</span>
                  <input className="input-field" defaultValue={a.reference_number ?? ''} maxLength={80}
                    onBlur={(e) => e.target.value !== (a.reference_number ?? '') && void save(a.slug, { reference_number: e.target.value })} />
                </label>
                <label className="text-sm">
                  <span className="label">Applied on</span>
                  <input type="date" className="input-field" defaultValue={a.applied_date ?? ''}
                    onChange={(e) => void save(a.slug, { applied_date: e.target.value })} />
                </label>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                {a.official_url && <a href={a.official_url} target="_blank" rel="noopener noreferrer" className="link-internal">Official portal</a>}
                <button type="button" onClick={() => void remove(a.id)} className="text-muted hover:text-brand-red">Stop tracking</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TrackerPage(): React.ReactElement {
  return <Suspense fallback={null}><Tracker /></Suspense>;
}
