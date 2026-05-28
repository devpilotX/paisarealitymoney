'use client';

import { useState } from 'react';

const API_BASE = 'https://api.devpilotx.com';

export default function ContactForm(): React.ReactElement {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus('sending');
    setMessage('');
    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: silently drop if filled
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
        setMessage('Thanks! We received your message and will reply soon.');
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
    <form data-dpx-contact onSubmit={onSubmit} className="space-y-4 max-w-2xl" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input id="pr-name" name="name" required type="text" autoComplete="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-600 focus:ring-teal-600" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input id="pr-email" name="email" required type="email" autoComplete="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-600 focus:ring-teal-600" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Subject</span>
        <input id="pr-subject" name="subject" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-600 focus:ring-teal-600" placeholder="What is this about?" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Message</span>
        <textarea id="pr-message" name="message" required rows={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-600 focus:ring-teal-600" />
      </label>
      {/* Honeypot: hidden from real users */}
      <input type="text" name="company" autoComplete="off" tabIndex={-1} aria-hidden="true" className="hidden" />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={status === 'sending'} className="inline-flex items-center justify-center rounded-md bg-teal-700 px-5 py-2.5 text-white text-sm font-medium shadow hover:bg-teal-800 disabled:opacity-60">
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
        {message ? (
          <p className={status === 'ok' ? 'text-sm text-teal-700' : 'text-sm text-red-700'}>{message}</p>
        ) : null}
      </div>
    </form>
  );
}
