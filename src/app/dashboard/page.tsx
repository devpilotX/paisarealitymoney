'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

interface UserData {
  id: number; name: string; email: string; plan: string;
}

type IconKey = 'user' | 'bell' | 'pin' | 'clipboard' | 'search' | 'calc';

const ICONS: Record<IconKey, React.ReactElement> = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  pin: <path d="M6 3h12v18l-6-4-6 4z" />,
  clipboard: <><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M9 12h6M9 16h4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  calc: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></>,
};

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

  const logout = useCallback(() => {
    document.cookie = 'auth-token=; path=/; max-age=0';
    document.cookie = 'refresh-token=; path=/; max-age=0';
    router.push('/login');
  }, [router]);

  if (loading) return <div className="container-main py-12 text-center"><p className="text-muted-2">Loading...</p></div>;
  if (!user) return <div />;

  const dashboardLinks: Array<{ href: string; title: string; desc: string; icon: IconKey }> = [
    { href: '/dashboard/account', title: 'My Account', desc: 'Edit profile, change password, verify email', icon: 'user' },
    { href: '/dashboard/alerts', title: 'Price Alerts', desc: 'Get an email when gold or silver hits your target price', icon: 'bell' },
    { href: '/dashboard/bookmarks', title: 'Saved Schemes', desc: 'View schemes you have bookmarked', icon: 'pin' },
    { href: '/dashboard/tracker', title: 'Application Tracker', desc: 'Track your scheme applications', icon: 'clipboard' },
    { href: '/schemes', title: 'Find Schemes', desc: 'Discover new schemes for you', icon: 'search' },
    { href: '/calculators', title: 'Calculators', desc: 'EMI, SIP, FD, Tax calculators', icon: 'calc' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-1 mb-1">Welcome, {user.name}</h1>
          <p className="text-sm text-muted-2">
            {user.email} | Plan:{' '}
            {user.plan === 'premium'
              ? <span className="badge-soft">Premium</span>
              : <span className="font-medium text-navy">Free</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.plan === 'free' && (
            <Link href="/pricing" className="btn-primary no-underline text-sm">Upgrade</Link>
          )}
          <button onClick={logout} className="text-sm text-brand-red hover:underline">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dashboardLinks.map((item) => (
          <Link key={item.href} href={item.href} className="card no-underline group flex flex-col">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-[5px] border border-line bg-paper-2 text-navy mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[item.icon]}
              </svg>
            </span>
            <h2 className="font-serif text-lg font-bold text-navy group-hover:text-brand-red transition-colors">{item.title}</h2>
            <p className="text-sm text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
