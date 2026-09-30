'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthShell, Field, FormError } from '@/components/AuthShell';

function ResetForm(): React.ReactElement {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Choose a password of at least 8 characters.'); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json() as { success: boolean; error?: string };
      if (d.success) setDone(true);
      else setError(d.error ?? 'This reset link is invalid or has expired.');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="This link is incomplete" footer={<Link href="/login" className="link-internal">Back to log in</Link>}>
        <p className="text-ink leading-relaxed">Open the reset link straight from the email, or ask for a new one.</p>
        <Link href="/forgot-password" className="btn-primary w-full mt-6">Get a new link</Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password changed">
        <p className="text-ink leading-relaxed">
          Your new password is set and any other reset links for this account no longer work. We have emailed you a
          confirmation.
        </p>
        <Link href="/login" className="btn-primary w-full mt-6">Log in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" footer={<Link href="/login" className="link-internal">Back to log in</Link>}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError message={error} />
        {error.includes('expired') && (
          <p className="text-sm"><Link href="/forgot-password" className="link-internal">Send me a new link</Link></p>
        )}
        <Field label="New password" type="password" autoComplete="new-password" required minLength={8}
          value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters." />
        <Field label="Type it again" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button type="submit" disabled={loading} className="btn-primary w-full !min-h-[48px]">
          {loading ? 'Saving' : 'Set new password'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage(): React.ReactElement {
  return <Suspense fallback={null}><ResetForm /></Suspense>;
}
