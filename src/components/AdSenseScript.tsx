'use client';

import Script from 'next/script';

const PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';
// Only load the AdSense library if at least one ad slot is configured. Loading
// it with no ad units to fill only costs performance, so we defer it until ads
// are actually set up.
const HAS_SLOT = Boolean(
  process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT || process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT,
);

/** Normalise a publisher id to the required ca-pub-XXXX form. */
export function adClientId(pubId: string): string {
  const id = pubId.trim().replace(/^ca-/, '');
  return id.startsWith('pub-') ? `ca-${id}` : `ca-pub-${id}`;
}

export default function AdSenseScript(): React.ReactElement | null {
  if (!PUB_ID || !HAS_SLOT) {
    return null;
  }
  const src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adClientId(PUB_ID);
  return <Script async src={src} crossOrigin="anonymous" strategy="lazyOnload" />;
}
