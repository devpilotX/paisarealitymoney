'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CONSENT_KEY, applyConsent } from '@/lib/consent';

const COOKIE_CONSENT_KEY = CONSENT_KEY;

export default function CookieConsent(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Shown as soon as the page is interactive. A delayed reveal made this
        // paragraph the Largest Contentful Paint on mobile (measured ~4 s).
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to read cookie consent:', error);
    }
    return undefined;
  }, []);

  const handleAccept = useCallback((): void => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      applyConsent('accepted');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      setIsVisible(false);
    }
  }, []);

  const handleDecline = useCallback((): void => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
      applyConsent('declined');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed z-[60] bottom-[88px] sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-[420px] bg-white border border-line rounded-xl shadow-lift p-5"
      role="dialog"
      aria-label="Cookie choices"
    >
      <p className="text-[14.5px] text-ink leading-relaxed">
        We use cookies to keep you signed in, count visits with Google Analytics and personalise the ads that keep
        the site free. Essential only turns analytics and ad personalisation off; ads still appear, just not
        based on you. More in our{' '}
        <Link href="/privacy" className="link-internal">privacy policy</Link>.
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={handleAccept} className="btn-primary flex-1 !min-h-[42px]">Accept all</button>
        <button type="button" onClick={handleDecline} className="btn-secondary flex-1 !min-h-[42px]">Essential only</button>
      </div>
    </div>
  );
}