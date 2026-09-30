'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import CategoryIcon from '@/components/CategoryIcon';

interface Saved {
  id: number; slug: string; name: string; category: string; level: string;
  benefit_summary: string | null; saved_at: string;
}

export default function BookmarksPage(): React.ReactElement {
  const router = useRouter();
  const [schemes, setSchemes] = useState<Saved[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/bookmarks', { cache: 'no-store' })
      .then(async (r) => {
        if (r.status === 401) { router.push('/login?next=/dashboard/bookmarks'); return; }
        const d = (await r.json()) as { success: boolean; schemes?: Saved[]; error?: string };
        if (d.success) setSchemes(d.schemes ?? []); else setError(d.error ?? 'Could not load your saved schemes.');
      })
      .catch(() => setError('We could not reach the server. Try again in a moment.'));
  }, [router]);

  const remove = async (slug: string): Promise<void> => {
    const prev = schemes;
    setSchemes((s) => s?.filter((x) => x.slug !== slug) ?? null);
    const r = await fetch('/api/bookmarks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) }).catch(() => null);
    if (!r?.ok) setSchemes(prev);
  };

  return (
    <div className="container-main py-8">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Saved schemes' }]} />
      <h1 className="heading-1 mt-4">Saved schemes</h1>
      <p className="mt-3 text-muted">Schemes you saved from their pages. Remove one when you no longer need it.</p>

      {error && <p role="alert" className="mt-8 callout-red">{error}</p>}
      {!error && schemes === null && <p className="mt-10 text-muted-2">Loading your saved schemes</p>}

      {schemes && schemes.length === 0 && (
        <div className="mt-10 card-flat text-center py-14">
          <p className="text-lg font-medium">Nothing saved yet</p>
          <p className="mt-2 text-muted max-w-md mx-auto">Open any scheme and press Save scheme. It will appear here so you can come back to it.</p>
          <Link href="/schemes" className="btn-primary mt-6">Find schemes for you</Link>
        </div>
      )}

      {schemes && schemes.length > 0 && (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {schemes.map((s) => (
            <li key={s.slug} className="card-flat !p-5 flex gap-4">
              <CategoryIcon category={s.category} className="w-10 h-10" />
              <div className="min-w-0 flex-1">
                <Link href={`/schemes/${s.slug}`} className="font-semibold text-ink no-underline hover:text-navy">{s.name}</Link>
                {s.benefit_summary && <p className="mt-1 text-[15px] text-muted line-clamp-2">{s.benefit_summary}</p>}
                <div className="mt-3 flex gap-4 text-sm">
                  <Link href={`/dashboard/tracker?add=${s.slug}`} className="link-internal">Track my application</Link>
                  <button type="button" onClick={() => void remove(s.slug)} className="text-muted hover:text-brand-red">Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
