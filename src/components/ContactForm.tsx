'use client';

import { useState } from 'react';

const SUBJECT_OPTIONS = [
  'Data correction (wrong price, rate, or scheme info)',
  'Bug report (something is broken)',
  'Feature request (new tool, city, or feature)',
  'General feedback',
  'Business inquiry (advertising, partnership)',
  'Other',
];

const FIELD_CLASS =
  'w-full px-4 py-3 rounded-[5px] border border-line bg-paper text-sm text-ink ' +
  'placeholder:text-muted-2 focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none ' +
  'transition-colors duration-150';

export default function ContactForm(): React.ReactElement {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus('sending');
    setMessage('');
    const form = e.currentTarget;
    const data = new FormData(form);
    if ((data.get('company') as string)?.trim()) {
      setStatus('ok');
      setMessage('Thanks! We will get back to you shortly.');
      form.reset();
      return;
    }
    const payload = {
      name: (data.get('name') as string)?.trim(),
      email: (data.get('email') as string)?.trim(),
      message: (data.get('message') as string)?.trim(),
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (res.ok) {
        setStatus('ok');
        setMessage('Thanks! We received your message and will reply within 48 hours.');
        form.reset();
      } else {
        setStatus('err');
        setMessage(((json as { error?: string }).error) || 'Could not send. Please try again.');
      }
    } catch {
      setStatus('err');
      setMessage('Network error. Please try again in a moment.');
    }
  }

  return (
    <form data-dpx-contact onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="pr-name" className="block text-sm font-medium text-ink mb-1.5">
            Your name <span className="text-brand-red">*</span>
          </label>
          <input
            id="pr-name"
            name="name"
            required
            type="text"
            autoComplete="name"
            placeholder="Rahul Kumar"
            className={FIELD_CLASS}
          />
        </div>
        <div>
          <label htmlFor="pr-email" className="block text-sm font-medium text-ink mb-1.5">
            Your email <span className="text-brand-red">*</span>
          </label>
          <input
            id="pr-email"
            name="email"
            required
            type="email"
            autoComplete="email"
            placeholder="rahul@example.com"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pr-subject" className="block text-sm font-medium text-ink mb-1.5">
          What is this about? <span className="text-brand-red">*</span>
        </label>
        <select
          id="pr-subject"
          name="subject"
          required
          defaultValue=""
          className={FIELD_CLASS}
        >
          <option value="" disabled>Select a reason</option>
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pr-message" className="block text-sm font-medium text-ink mb-1.5">
          Your message <span className="text-brand-red">*</span>
        </label>
        <textarea
          id="pr-message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what you need help with..."
          className={`${FIELD_CLASS} resize-y`}
        />
      </div>

      {/* Honeypot */}
      <input type="text" name="company" autoComplete="off" tabIndex={-1} aria-hidden="true" className="hidden" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center justify-center px-6 py-3 rounded-[3px]
                     bg-navy text-paper text-sm font-bold min-h-[44px]
                     transition-all duration-200 hover:bg-navy-deep hover:shadow-md
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
        {message && (
          <p className={`text-sm ${status === 'ok' ? 'text-green-700' : 'text-brand-red'}`}>
            {message}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-2 mt-2">
        Or email us directly at <a href="mailto:connect@paisareality.com" className="text-navy font-medium hover:text-brand-red">connect@paisareality.com</a>
      </p>
    </form>
  );
}
