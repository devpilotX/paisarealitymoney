'use client';

import { useState } from 'react';

const API_BASE = 'https://api.devpilotx.com';

const SUBJECT_OPTIONS = [
  'Data correction (wrong price, rate, or scheme info)',
  'Bug report (something is broken)',
  'Feature request (new tool, city, or feature)',
  'General feedback',
  'Business inquiry (advertising, partnership)',
  'Other',
];

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
      subject: (data.get('subject') as string)?.trim() || 'Contact from paisareality.com',
      message: (data.get('message') as string)?.trim(),
      site: 'paisareality.com',
      sourcePage: typeof window !== 'undefined' ? window.location.pathname : '/contact',
    };
    try {
      const res = await fetch(API_BASE + '/v2/contact', {
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
          <label htmlFor="pr-name" className="block text-sm font-medium text-gray-800 mb-1.5">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            id="pr-name"
            name="name"
            required
            type="text"
            autoComplete="name"
            placeholder="Rahul Kumar"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-sm
                       placeholder:text-gray-400
                       focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                       transition-colors duration-150"
          />
        </div>
        <div>
          <label htmlFor="pr-email" className="block text-sm font-medium text-gray-800 mb-1.5">
            Your email <span className="text-red-500">*</span>
          </label>
          <input
            id="pr-email"
            name="email"
            required
            type="email"
            autoComplete="email"
            placeholder="rahul@example.com"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-sm
                       placeholder:text-gray-400
                       focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                       transition-colors duration-150"
          />
        </div>
      </div>

      <div>
        <label htmlFor="pr-subject" className="block text-sm font-medium text-gray-800 mb-1.5">
          What is this about? <span className="text-red-500">*</span>
        </label>
        <select
          id="pr-subject"
          name="subject"
          required
          defaultValue=""
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-sm
                     text-gray-700
                     focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                     transition-colors duration-150"
        >
          <option value="" disabled>Select a reason</option>
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pr-message" className="block text-sm font-medium text-gray-800 mb-1.5">
          Your message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="pr-message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what you need help with..."
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-sm
                     placeholder:text-gray-400 resize-y
                     focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                     transition-colors duration-150"
        />
      </div>

      {/* Honeypot */}
      <input type="text" name="company" autoComplete="off" tabIndex={-1} aria-hidden="true" className="hidden" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg
                     bg-primary text-white text-sm font-semibold min-h-[44px]
                     transition-all duration-200 hover:bg-primary-800 hover:shadow-md
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
        {message && (
          <p className={`text-sm ${status === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Or email us directly at <a href="mailto:connect@paisareality.com" className="text-primary hover:underline">connect@paisareality.com</a>
      </p>
    </form>
  );
}
