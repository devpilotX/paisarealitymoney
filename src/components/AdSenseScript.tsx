'use client';

import Script from 'next/script';

const ADSENSE_CLIENT = 'ca-pub-6484525483464374';

export default function AdSenseScript(): React.ReactElement | null {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
