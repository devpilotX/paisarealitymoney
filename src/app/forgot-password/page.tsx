'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { AuthShell, Field, FormError } from '@/components/AuthShell';

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) { setError('Too many requests. Wait 15 minutes and try again.'); return; }
      setSent(true);
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  if (sent) {
    return (
      <AuthShell title="Check your inbox" footer={<Link href="/login" className="link-internal">Back to log in</Link>}>
        <p className="text-ink leading-relaxed">
          If an account exists for <strong className="font-medium">{email}</strong>, we have sent a link to reset the
          password. It works once and expires in one hour.
        </p>
        <p className="mt-4 text-sm text-muted leading-relaxed">
          Nothing after a few minutes? Check spam, or make sure you typed the address you signed up with.
        </p>
        <button type="button" onClick={() => setSent(false)} className="btn-secondary w-full mt-6">Try another email</button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      lead="Enter the email on your account and we will send you a link to choose a new password."
      footer={<>Remembered it? <Link href="/login" className="link-internal">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={loading || !email} className="btn-primary w-full !min-h-[48px]">
          {loading ? 'Sending' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  );
}
