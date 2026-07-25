'use client';

import Script from 'next/script';

const PUB_ID = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? '';

/** Normalise a publisher id to the required ca-pub-XXXX form. */
export function adClientId(pubId: string): string {
  const id = pubId.trim().replace(/^ca-/, '');
  return id.startsWith('pub-') ? `ca-${id}` : `ca-pub-${id}`;
}

/**
 * Loads the AdSense library whenever a publisher id is configured.
 *
 * This used to also require an ad unit slot id, on the reasoning that loading
 * the library with nothing to fill only costs performance. That reasoning was
 * wrong in one important way: AdSense Auto ads need the library and no slot ids
 * at all. With both slot variables left empty since launch, the gate meant the
 * library never shipped to a single visitor, so the site served zero ads for
 * two months while carrying 110 ad placements. Verified against the production
 * bundles: no client chunk referenced pagead2.googlesyndication.com.
 *
 * strategy="lazyOnload" already keeps it off the critical path.
 */
export default function AdSenseScript(): React.ReactElement | null {
  if (!PUB_ID) {
    return null;
  }
  const src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adClientId(PUB_ID);
  return <Script async src={src} crossOrigin="anonymous" strategy="lazyOnload" />;
}
