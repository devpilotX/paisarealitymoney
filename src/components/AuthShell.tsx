'use client';

import { useId, useState } from 'react';
import Link from 'next/link';

/**
 * Shared frame for the sign-in family of pages: a narrow centred form on the
 * left, and on wide screens a plain panel saying what an account is for.
 */
export function AuthShell({ title, lead, children, footer }: {
  title: string;
  lead?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen-minus-header grid lg:grid-cols-2">
      <div className="flex items-start lg:items-center justify-center px-5 pt-10 pb-14 sm:py-20">
        <div className="w-full max-w-[400px]">
          <h1 className="text-[32px] font-semibold tracking-[-0.025em] leading-tight">{title}</h1>
          {lead && <p className="mt-3 text-muted leading-relaxed">{lead}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 pt-6 border-t border-line text-[15px] text-muted">{footer}</div>}
        </div>
      </div>
      <aside className="hidden lg:flex items-center bg-paper-2 border-l border-line px-16">
        <div className="max-w-md">
          <p className="text-2xl font-semibold tracking-[-0.02em] leading-snug text-ink">
            Everything on Paisa Reality works without an account. Sign in when you want it to remember things for you.
          </p>
          <ul className="mt-8 space-y-4 text-[15px] text-muted">
            {[
              ['Price alerts', 'An email when gold or silver in your city reaches a price you pick.'],
              ['Saved schemes', 'Keep a shortlist and track each application you make.'],
              ['Score history', 'See how your Money Health Score changes over time.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <svg className="w-5 h-5 mt-0.5 text-navy shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.5 4.5L19 7" /></svg>
                <span><strong className="font-medium text-ink">{t}.</strong> {d}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-muted-2 leading-relaxed">
            We never sell or share your details. You can delete your account and its data at any time from your dashboard.{' '}
            <Link href="/privacy" className="link-internal">Privacy policy</Link>
          </p>
        </div>
      </aside>
    </div>
  );
}

export function Field({ label, hint, error, ...input }: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string; hint?: React.ReactNode; error?: string;
}): React.ReactElement {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = input.type === 'password';
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label">{label}</label>
        {typeof hint !== 'string' && hint}
      </div>
      <div className="relative">
        <input
          id={id}
          {...input}
          type={isPassword && show ? 'text' : input.type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`input-field ${isPassword ? 'pr-16' : ''} ${error ? '!border-brand-red focus:!ring-brand-red/20' : ''}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm font-medium text-muted hover:text-navy rounded"
            aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {typeof hint === 'string' && <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted-2">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1.5 text-sm text-brand-red">{error}</p>}
    </div>
  );
}

export function FormError({ message }: { message: string }): React.ReactElement | null {
  if (!message) return null;
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div>;
}

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard';
  return raw;
}
