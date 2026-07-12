'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

interface Application {
  id: number; scheme_name: string; status: string; applied_date: string | null; reference_number: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-paper-2 text-muted border border-line',
  applied: 'bg-navy/10 text-navy border border-navy/20',
  under_review: 'bg-brand-yellow-soft/70 text-brown border border-brand-yellow',
  approved: 'bg-green-100 text-green-800 border border-green-200',
  rejected: 'bg-brand-red/10 text-brand-red border border-brand-red/20',
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started', applied: 'Applied', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected',
};

export default function TrackerPage(): React.ReactElement {
  const router = useRouter();
  const [applications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json())
      .then((data: { success: boolean }) => { if (!data.success) router.push('/login'); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="container-main py-12 text-center"><p className="text-muted-2">Loading tracker...</p></div>;

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Application Tracker' }]} />
      <h1 className="heading-1 mb-6">Application Tracker</h1>
      {applications.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-line bg-paper-2">
              <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Scheme</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Applied Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Reference</th>
            </tr></thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-line/60">
                  <td className="py-3 px-4 font-medium text-ink">{app.scheme_name}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-[3px] ${STATUS_COLORS[app.status] ?? 'bg-paper-2 text-muted border border-line'}`}>
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted">{app.applied_date ?? '-'}</td>
                  <td className="py-3 px-4 text-sm text-muted">{app.reference_number ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-line bg-paper-2 text-navy mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M9 12h6M9 16h4" /></svg>
          </span>
          <p className="font-serif text-lg font-bold text-navy mb-2">No applications tracked yet</p>
          <p className="text-sm text-muted mb-6">After you apply for government schemes, track their status here.</p>
          <a href="/schemes" className="btn-primary no-underline">Find Schemes to Apply</a>
        </div>
      )}
    </div>
  );
}
