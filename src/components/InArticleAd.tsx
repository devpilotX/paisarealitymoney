'use client';

import { useEffect, useRef } from 'react';

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
  const isAdLoaded = useRef(false);
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT
    || process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT
    || '';

  useEffect(() => {
    if (isAdLoaded.current || !pubId || !adSlot) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        isAdLoaded.current = true;
      }
    } catch (error) {
      console.error('In-article ad loading error:', error);
    }
  }, [pubId, adSlot]);

  if (!pubId || !adSlot) {
    return null;
  }

  return (
    <div className={`overflow-hidden ${className}`} style={{ minHeight: 0 }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={`ca-${pubId}`}
        data-ad-slot={adSlot}
      />
    </div>
  );
}
