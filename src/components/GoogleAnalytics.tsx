'use client';

import Script from 'next/script';
import { GA_ID } from '@/lib/analytics';

export default function GoogleAnalytics(): React.ReactElement | null {
  if (!GA_ID) {
    return null;
  }

  const gtagSrc =
    'https' + '://www.googletagmanager.com/gtag/js?id=' + GA_ID;

  return (
    <>
      <Script src={gtagSrc} strategy="lazyOnload" />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
