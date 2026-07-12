'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

function ResetForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setMsg('');
    if (password !== confirm) { setMsg('Passwords do not match.'); return; }
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const d = await res.json() as { success: boolean; error?: string };
    setLoading(false);
    if (d.success) setDone(true);
    else setMsg(d.error || 'Failed to reset password.');
  }

  if (!token) return (
    <div className="text-center">
      <p className="text-brand-red">Invalid reset link. Please request a new one from the <Link href="/forgot-password" className="link-internal">forgot password</Link> page.</p>
    </div>
  );

  if (done) return (
    <div className="card text-center">
      <p className="text-green-700 mb-4">Password reset successfully!</p>
      <Link href="/login" className="btn-primary inline-block no-underline">Log In</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <label htmlFor="pw" className="block text-sm font-medium text-ink mb-1">New Password</label>
        <input id="pw" type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Min 8 characters" required minLength={8} />
      </div>
      <div>
        <label htmlFor="cpw" className="block text-sm font-medium text-ink mb-1">Confirm Password</label>
        <input id="cpw" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" required minLength={8} />
      </div>
      {msg && <p className="text-brand-red text-sm">{msg}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <div className="container-main py-12">
      <Breadcrumb items={[{ label: 'Reset Password' }]} />
      <div className="max-w-md mx-auto">
        <h1 className="heading-1 text-center mb-8">Reset Password</h1>
        <Suspense fallback={<p className="text-center text-muted-2">Loading...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
