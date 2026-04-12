'use client';

import { useEffect, useRef } from 'react';

interface InArticleAdProps {
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

export default function InArticleAd({ className = '' }: InArticleAdProps): React.ReactElement {
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
      console.error('In-article ad loading error:', error);
    }
  }, []);

  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';

  if (!pubId) {
    return <div className={className} />;
  }

  return (
    <div className={`in-article-ad my-8 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }} 
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={`ca-${pubId}`}
        data-ad-slot=""
      />
    </div>
  );
}