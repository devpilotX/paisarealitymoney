'use client';
import { useId, useState } from 'react';

/** Newsletter sign-up. `tone="dark"` for the footer, `"light"` elsewhere. */
export default function SubscribeForm({ tone = 'dark' }: { tone?: 'dark' | 'light' }): React.ReactElement {
  const id = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const dark = tone === 'dark';

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

  if (status === 'ok') {
    return (
      <p role="status" className={`text-sm ${dark ? 'text-emerald-300' : 'text-green-700'}`}>
        You are subscribed. A confirmation is on its way to your inbox.
      </p>
    );
  }

  return (
    <div>
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor={id} className="sr-only">Email address</label>
      <input
        id={id} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={dark
          ? 'flex-1 min-w-0 h-11 px-3.5 text-sm rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20'
          : 'input-field flex-1 min-w-0'}
      />
      <button type="submit" disabled={status === 'loading'}
        className={dark
          ? 'h-11 px-5 text-sm font-semibold rounded-lg bg-white text-[#0B1220] hover:bg-white/90 transition-colors disabled:opacity-60'
          : 'btn-primary'}>
        {status === 'loading' ? 'Subscribing' : 'Subscribe'}
      </button>
    </form>
    {status === 'err' && (
      <p role="alert" className={`mt-2 text-sm ${dark ? 'text-red-300' : 'text-brand-red'}`}>That did not work. Check the address and try again.</p>
    )}
    </div>
  );
}
