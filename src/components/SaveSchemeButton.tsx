'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/** Save or unsave a scheme to the signed-in user's list. Visitors get a sign-in link instead. */
export default function SaveSchemeButton({ slug }: { slug: string }): React.ReactElement | null {
  const [state, setState] = useState<'loading' | 'out' | 'saved' | 'unsaved' | 'busy'>('loading');

  useEffect(() => {
    let alive = true;
    fetch('/api/bookmarks', { cache: 'no-store' })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 401) { setState('out'); return; }
        const d = (await r.json()) as { schemes?: Array<{ slug: string }> };
        setState(d.schemes?.some((s) => s.slug === slug) ? 'saved' : 'unsaved');
      })
      .catch(() => alive && setState('out'));
    return () => { alive = false; };
  }, [slug]);

  const toggle = async (): Promise<void> => {
    const was = state;
    setState('busy');
    const res = await fetch('/api/bookmarks', {
      method: was === 'saved' ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => null);
    setState(res?.ok ? (was === 'saved' ? 'unsaved' : 'saved') : was);
  };

  if (state === 'loading') return null;
  if (state === 'out') {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/schemes/${slug}`)}`} className="btn-secondary">
        Log in to save this scheme
      </Link>
    );
  }
  const saved = state === 'saved';
  return (
    <button type="button" onClick={() => void toggle()} disabled={state === 'busy'} aria-pressed={saved} className="btn-secondary">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinejoin="round" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
      {saved ? 'Saved' : 'Save scheme'}
    </button>
  );
}
