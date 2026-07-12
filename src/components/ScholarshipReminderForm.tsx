'use client';

import { useState, type FormEvent } from 'react';

export default function ScholarshipReminderForm({ slug }: { slug: string }): React.ReactElement {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(7);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setStatus('saving');
    setMessage('');
    try {
      const res = await fetch('/api/scholarships/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug, daysBefore: days }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong.');
        return;
      }
      setStatus('done');
      setMessage(data.message ?? 'Reminder set.');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'done') {
    return <p className="text-primary font-medium">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-ink">Your email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink">Remind me</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input-field mt-1"
        >
          <option value={3}>3 days before</option>
          <option value={7}>7 days before</option>
          <option value={14}>14 days before</option>
        </select>
      </label>
      <button type="submit" className="btn-primary w-full" disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving...' : 'Remind me before it closes'}
      </button>
      {status === 'error' && <p className="text-brand-red text-sm">{message}</p>}
      <p className="text-sm text-muted-2">
        We only use your email for this reminder. Always verify dates on the official portal.
      </p>
    </form>
  );
}
