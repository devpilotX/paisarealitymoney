'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, Field, FormError, safeNext } from '@/components/AuthShell';

function LoginForm(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (data.success) {
        router.push(next);
        router.refresh();
        return;
      }
      setError(res.status === 429 ? 'Too many attempts. Wait 15 minutes and try again.' : data.error ?? 'Could not log you in.');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, router, next]);

  return (
    <AuthShell
      title="Log in"
      lead="Welcome back. Use the email you signed up with."
      footer={<>New here? <Link href={`/signup${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`} className="link-internal">Create a free account</Link></>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field label="Email" type="email" autoComplete="email" inputMode="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
          hint={<Link href="/forgot-password" className="text-sm font-medium text-navy no-underline hover:underline">Forgot password?</Link>} />
        <button type="submit" disabled={loading || !email || !password} className="btn-primary w-full !min-h-[48px]">
          {loading ? 'Logging in' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage(): React.ReactElement {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
