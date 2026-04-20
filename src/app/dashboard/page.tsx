'use client';
// forcing cache clear on every load to ensure latest code is used, remove in production

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

interface UserData {
  id: number; name: string; email: string; plan: string;
}

export default function DashboardPage(): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then((res) => res.json())
      .then((data: { success: boolean; user?: UserData }) => {
        if (data.success && data.user) setUser(data.user);
        else router.push('/login');
      }).catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="container-main py-12 text-center"><p className="text-gray-500">Loading...</p></div>;
  if (!user) return <div />;

  const dashboardLinks = [
    { href: '/dashboard/bookmarks', title: 'Saved Schemes', desc: 'View schemes you have bookmarked', icon: '📌' },
    { href: '/dashboard/tracker', title: 'Application Tracker', desc: 'Track your scheme applications', icon: '📋' },
    { href: '/schemes', title: 'Find Schemes', desc: 'Discover new schemes for you', icon: '🔍' },
    { href: '/calculators', title: 'Calculators', desc: 'EMI, SIP, FD, Tax calculators', icon: '🧮' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-1 mb-1">Welcome, {user.name}</h1>
          <p className="text-sm text-gray-500">{user.email} | Plan: <span className="font-medium text-primary">{user.plan === 'premium' ? 'Premium' : 'Free'}</span></p>
        </div>
        {user.plan === 'free' && (
          <Link href="/pricing" className="btn-primary no-underline text-sm">Upgrade to Premium</Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dashboardLinks.map((item) => (
          <Link key={item.href} href={item.href} className="card no-underline group">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">{item.title}</h2>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}