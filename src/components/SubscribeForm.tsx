'use client';
import { useState } from 'react';

export default function SubscribeForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'ok' : 'err');
      if (res.ok) setEmail('');
    } catch { setStatus('err'); }
  }

  if (status === 'ok') return <p className="text-sm text-green-700">Subscribed! Check your inbox.</p>;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Your email"
        className="flex-1 px-3 py-2 text-sm rounded-[3px] bg-paper border border-line text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy"
      />
      <button type="submit" disabled={status === 'loading'}
        className="px-4 py-2 text-sm font-bold text-paper bg-navy rounded-[3px] hover:bg-navy-deep disabled:opacity-60">
        {status === 'loading' ? '...' : 'Subscribe'}
      </button>
    </form>
  );
}
