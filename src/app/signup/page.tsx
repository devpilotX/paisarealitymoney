'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, Field, FormError, safeNext } from '@/components/AuthShell';

/** Rough strength, only to nudge people away from the weakest choices. */
function strength(pw: string): { label: string; tone: string; width: string } | null {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length < 8) return { label: 'Too short', tone: 'bg-brand-red', width: 'w-1/5' };
  if (s <= 2) return { label: 'Weak', tone: 'bg-amber-500', width: 'w-2/5' };
  if (s <= 3) return { label: 'Fair', tone: 'bg-amber-500', width: 'w-3/5' };
  return { label: 'Strong', tone: 'bg-green-600', width: 'w-full' };
}

function SignupForm(): React.ReactElement {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const st = strength(password);

  const submit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Enter your name, at least 2 characters.'); return; }
    if (password.length < 8) { setError('Choose a password of at least 8 characters.'); return; }
    if (!agree) { setError('Please agree to the terms and privacy policy to continue.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (data.success) { router.push(next); router.refresh(); return; }
      setError(res.status === 429 ? 'Too many attempts. Wait 15 minutes and try again.' : data.error ?? 'Could not create your account.');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [name, email, password, agree, router, next]);

  return (
    <AuthShell
      title="Create your free account"
      lead="Takes under a minute. We will send one email to confirm your address."
      footer={<>Already have an account? <Link href="/login" className="link-internal">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field label="Your name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <Field label="Password" type="password" autoComplete="new-password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters. A short sentence works well." />
          {st && (
            <div className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden"><div className={`h-full ${st.tone} ${st.width} transition-all`} /></div>
              <span className="text-[13px] text-muted w-16 text-right">{st.label}</span>
            </div>
          )}
        </div>
        <label className="flex items-start gap-3 text-sm text-muted leading-relaxed cursor-pointer">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line text-navy focus:ring-navy/30" />
          <span>
            I agree to the <Link href="/terms" className="link-internal">terms</Link> and the{' '}
            <Link href="/privacy" className="link-internal">privacy policy</Link>. I can delete my account at any time.
          </span>
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full !min-h-[48px]">
          {loading ? 'Creating your account' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignupPage(): React.ReactElement {
  return <Suspense fallback={null}><SignupForm /></Suspense>;
}
