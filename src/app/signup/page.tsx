'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

export default function SignupPage(): React.ReactElement {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (data.success) { router.push('/dashboard'); }
      else { setError(data.error ?? 'Signup failed.'); }
    } catch { setError('Could not connect. Please try again.'); }
    finally { setLoading(false); }
  }, [name, email, password, router]);

  return (
    <div className="container-main py-12">
      <Breadcrumb items={[{ label: 'Sign Up' }]} />
      <div className="max-w-md mx-auto">
        <h1 className="heading-1 text-center mb-8">Create Account</h1>
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your name" required minLength={2} />
          </div>
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
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>
          <p className="text-sm text-center text-gray-500">
            Already have an account? <Link href="/login" className="link-internal">Log in</Link>
          </p>
          <p className="text-xs text-center text-gray-400">
            By signing up, you agree to our <Link href="/terms" className="link-internal">Terms</Link> and <Link href="/privacy" className="link-internal">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}