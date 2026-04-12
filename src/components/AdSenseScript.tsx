'use client';

import Script from 'next/script';

const ADSENSE_PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';

export default function AdSenseScript(): React.ReactElement | null {
  if (!ADSENSE_PUB_ID) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${ADSENSE_PUB_ID}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
