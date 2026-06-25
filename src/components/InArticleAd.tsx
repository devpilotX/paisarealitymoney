'use client';

import { useEffect, useRef, useState } from 'react';
import { adClientId } from './AdSenseScript';

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

export default function InArticleAd({
  className = '',
}: {
  className?: string;
}): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [inView, setInView] = useState(false);
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';
  const adSlot =
    process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT
    || process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT
    || '';

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
      style={{ minHeight: 250 }}
    >
      {inView && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={adClientId(pubId)}
          data-ad-slot={adSlot}
        />
      )}
    </div>
  );
}
