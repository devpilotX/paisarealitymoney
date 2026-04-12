'use client';

import { useEffect, useRef } from 'react';

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

export default function AdBanner({
  slot = '',
  format = 'auto',
  className = '',
}: AdBannerProps): React.ReactElement | null {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';

  useEffect(() => {
    if (isAdLoaded.current || !pubId) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        isAdLoaded.current = true;
      }
    } catch (error) {
      console.error('AdSense loading error:', error);
    }
  }, [pubId]);

  if (!pubId) {
    return null;
  }

  return (
    <div className={`overflow-hidden ${className}`} style={{ minHeight: 0 }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={`ca-${pubId}`}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
