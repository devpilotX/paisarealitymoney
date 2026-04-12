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
}: AdBannerProps): React.ReactElement {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef<boolean>(false);

  useEffect(() => {
    if (isAdLoaded.current) {
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
  }, []);

  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';

  if (!pubId) {
    return <div className={className} />;
  }

  return (
    <div className={`ad-container my-4 text-center ${className}`} ref={adRef}>
      <ins
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