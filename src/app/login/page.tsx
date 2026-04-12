'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (data.success) { router.push('/dashboard'); }
      else { setError(data.error ?? 'Login failed.'); }
    } catch { setError('Could not connect. Please try again.'); }
    finally { setLoading(false); }
  }, [email, password, router]);

  return (
    <div className="container-main py-12">
      <Breadcrumb items={[{ label: 'Login' }]} />
      <div className="max-w-md mx-auto">
        <h1 className="heading-1 text-center mb-8">Log In</h1>
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Min 8 characters" required minLength={8} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
          <p className="text-sm text-center text-gray-500">
            Do not have an account? <Link href="/signup" className="link-internal">Sign up for free</Link>
          </p>
        </form>
      </div>
    </div>
  );
}