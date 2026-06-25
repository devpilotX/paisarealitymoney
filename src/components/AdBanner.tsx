'use client';

import { useEffect, useRef, useState } from 'react';
import { adClientId } from './AdSenseScript';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

const RESERVED_HEIGHT: Record<string, number> = {
  horizontal: 90,
  auto: 100,
  vertical: 250,
  rectangle: 250,
};

export default function AdBanner({
  slot = '',
  format = 'auto',
  className = '',
}: AdBannerProps): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [inView, setInView] = useState(false);
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';
  const adSlot = slot || process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT || '';

  // Load the ad only when it is about to enter the viewport. Lighthouse audits
  // the page without scrolling, so deferring keeps the initial load fast.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pubId || !adSlot || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pubId, adSlot]);

  useEffect(() => {
    if (!inView || pushed.current || !pubId || !adSlot) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // The AdSense library may not be ready yet; ignore silently.
    }
  }, [inView, pubId, adSlot]);

  if (!pubId || !adSlot) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={{ minHeight: RESERVED_HEIGHT[format] ?? 100 }}
    >
      {inView && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adClientId(pubId)}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
