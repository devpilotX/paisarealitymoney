'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'paisa-reality-cookie-consent';

export default function CookieConsent(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Failed to read cookie consent:', error);
    }
    return undefined;
  }, []);

  const handleAccept = useCallback((): void => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      setIsVisible(false);
    }
  }, []);

  const handleDecline = useCallback((): void => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="container-main py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              We use cookies to improve your experience, show relevant ads via Google AdSense,
              and analyze website traffic with Google Analytics.
              By clicking "Accept", you agree to our use of cookies.
              Read our{' '}
              <Link href="/privacy" className="link-internal">
                Privacy Policy
              </Link>{' '}
              for more details.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg
                         transition-colors duration-200 ease-in-out hover:bg-gray-200
                         min-h-[44px] min-w-[44px]"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="btn-primary text-sm px-6 py-2"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}