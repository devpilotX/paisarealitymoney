'use client';

import Script from 'next/script';

const ADSENSE_CLIENT = 'ca-pub-6484525483464374';
const ADSENSE_SRC =
  'https' + '://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;

export default function AdSenseScript(): React.ReactElement | null {
  return (
    <Script
      async
      src={ADSENSE_SRC}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
