'use client';
import { useState } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="container-main py-12">
      <Breadcrumb items={[{ label: 'Forgot Password' }]} />
      <div className="max-w-md mx-auto">
        <h1 className="heading-1 text-center mb-8">Forgot Password</h1>
        {sent ? (
          <div className="card text-center">
            <p className="text-green-700 mb-4">If an account with that email exists, we sent a password reset link. Check your inbox.</p>
            <Link href="/login" className="link-internal">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-5">
            <p className="text-sm text-gray-600">Enter your email and we will send you a link to reset your password.</p>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-sm text-center text-gray-500">
              Remember your password? <Link href="/login" className="link-internal">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
