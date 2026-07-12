'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import SchemeCard from '@/components/SchemeCard';

interface BookmarkedScheme {
  id: number; slug: string; name: string; category: string;
  level: string; benefit_summary: string; benefit_amount_max: number | null;
}

export default function BookmarksPage(): React.ReactElement {
  const router = useRouter();
  const [schemes] = useState<BookmarkedScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json())
      .then((data: { success: boolean }) => { if (!data.success) router.push('/login'); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="container-main py-12 text-center"><p className="text-muted-2">Loading bookmarks...</p></div>;

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Saved Schemes' }]} />
      <h1 className="heading-1 mb-6">Saved Schemes</h1>
      {schemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schemes.map((s) => (
            <SchemeCard key={s.id} slug={s.slug} name={s.name} category={s.category} level={s.level} benefitSummary={s.benefit_summary} benefitAmountMax={s.benefit_amount_max} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-line bg-paper-2 text-navy mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>
          </span>
          <p className="font-serif text-lg font-bold text-navy mb-2">No saved schemes yet</p>
          <p className="text-sm text-muted mb-6">When you find schemes you like, save them here for easy access.</p>
          <a href="/schemes" className="btn-primary no-underline">Find Schemes</a>
        </div>
      )}
    </div>
  );
}
