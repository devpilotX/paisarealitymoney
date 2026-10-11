'use client';

import { useEffect } from 'react';
import { usePlan } from '@/lib/use-plan';

const PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';

/** Normalise a publisher id to the required ca-pub-XXXX form. */
export function adClientId(pubId: string): string {
  const id = pubId.trim().replace(/^ca-/, '');
  return id.startsWith('pub-') ? `ca-${id}` : `ca-pub-${id}`;
}

/**
 * Loads the AdSense library whenever a publisher id is configured.
 *
 * This used to also require an ad unit slot id, on the reasoning that loading
 * the library with nothing to fill only costs performance. That reasoning was
 * wrong in one important way: AdSense Auto ads need the library and no slot ids
 * at all. With both slot variables left empty since launch, the gate meant the
 * library never shipped to a single visitor, so the site served zero ads for
 * two months while carrying 110 ad placements. Verified against the production
 * bundles: no client chunk referenced pagead2.googlesyndication.com.
 *
 * strategy="lazyOnload" already keeps it off the critical path.
 */
export default function AdSenseScript(): null {
  // Premium members get the site without ads, so the library is never loaded for them.
  const plan = usePlan();
  const enabled = Boolean(PUB_ID) && plan !== 'unknown' && plan !== 'premium';

  // Injected by hand rather than through next/script: AdSense logs "AdSense head
  // tag doesn't support data-nscript attribute" for next/script tags. Timing
  // matches lazyOnload: after window load, when the browser is idle.
  useEffect(() => {
    if (!enabled || document.querySelector('script[src*="adsbygoogle.js"]')) return;
    const inject = (): void => {
      const s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adClientId(PUB_ID);
      document.head.appendChild(s);
    };
    const idle = (): void => { ('requestIdleCallback' in window) ? window.requestIdleCallback(inject) : setTimeout(inject, 1); };
    if (document.readyState === 'complete') { idle(); return; }
    window.addEventListener('load', idle, { once: true });
    return () => window.removeEventListener('load', idle);
  }, [enabled]);

  return null;
}
