'use client';

import { useEffect, useRef } from 'react';

/** Fires a single best-effort impression beacon for a served ad creative. */
export default function AdImpression({ id }: { id: number }): null {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const body = JSON.stringify({ id });
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/api/ads/impression', new Blob([body], { type: 'application/json' }));
      } else {
        void fetch('/api/ads/impression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        });
      }
    } catch {
      // ignore
    }
  }, [id]);
  return null;
}
