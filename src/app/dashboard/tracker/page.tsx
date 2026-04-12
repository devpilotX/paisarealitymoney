'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

interface Application {
  id: number; scheme_name: string; status: string; applied_date: string | null; reference_number: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  applied: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started', applied: 'Applied', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected',
};

export default function TrackerPage(): React.ReactElement {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json())
      .then((data: { success: boolean }) => { if (!data.success) router.push('/login'); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="container-main py-12 text-center"><p className="text-gray-500">Loading tracker...</p></div>;

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Application Tracker' }]} />
      <h1 className="heading-1 mb-6">Application Tracker</h1>
      {applications.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold">Scheme</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Applied Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Reference</th>
            </tr></thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{app.scheme_name}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[app.status] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{app.applied_date ?? '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{app.reference_number ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg text-gray-600 mb-4">No applications tracked yet</p>
          <p className="text-sm text-gray-500 mb-6">After you apply for government schemes, track their status here.</p>
          <a href="/schemes" className="btn-primary no-underline">Find Schemes to Apply</a>
        </div>
      )}
    </div>
  );
}