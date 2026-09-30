import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import PublicOnly from '@/components/PublicOnly';
import { CONSENT_BOOTSTRAP } from '@/lib/consent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import AdSenseScript from '@/components/AdSenseScript';
import YojanaMitra from '@/components/YojanaMitra';
import Script from 'next/script'
import { SITE_URL, SITE_NAME } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Paisa Reality: Free Money Health Score and Smart Tools',
    template: '%s',
  },
  description:
    'Check your free Money Health Score, use smart financial tools, track live gold and fuel rates, find government schemes and compare bank rates.',
  keywords: [
    'money health score',
    'financial health score india',
    'smart financial tools',
    'retirement calculator india',
    'debt payoff calculator',
    'old vs new tax regime calculator',
    'government schemes india',
    'gold rate today',
    'silver rate today',
    'petrol price today',
    'EMI calculator',
    'SIP calculator',
    'bank rates india',
  ],
  authors: [{ name: 'Paisa Reality' }],
  creator: 'Paisa Reality',
  publisher: 'Paisa Reality',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    // The env var lets the token change without a code edit; the fallback keeps
    // the existing Search Console property verified if it is left unset.
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'UKt2p3p1YlGr_1Tk84QZ8UGMaIGeiPMArUEJqGCD0lU',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Paisa Reality: Money Health Score and Smart Financial Tools',
    description:
      'Check your free Money Health Score, use 10 smart tools for retirement, debt, and tax planning, and track live rates, schemes, and bank rates in India.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paisa Reality: Money Health Score and Smart Financial Tools',
    description:
      'Check your free Money Health Score and use 10 smart tools for retirement, debt, and tax planning. Plus live rates, schemes, and bank rates.',
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-IN': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F2237',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SITE_URL + '/#organization',
    name: SITE_NAME,
    // The spellings people search for. Google reads these for brand queries.
    alternateName: ['PaisaReality', 'Paisa Reality India', 'paisareality.com', '\u092A\u0948\u0938\u093E \u0930\u093F\u092F\u0932\u093F\u091F\u0940'],
    url: SITE_URL,
    // Google needs a logo of at least 112 x 112 px; the wordmark is only 107 px tall.
    logo: { '@type': 'ImageObject', url: SITE_URL + '/icon-512.png', width: 512, height: 512 },
    image: SITE_URL + '/icon-512.png',
    description:
      'Paisa Reality offers a free Money Health Score, smart financial calculators, live gold, silver, petrol and diesel rates, government scheme matching, and bank rate comparison for India.',
    areaServed: { '@type': 'Country', name: 'India' },
    knowsLanguage: ['en-IN', 'hi-IN'],
    email: 'connect@paisareality.com',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'connect@paisareality.com',
      url: SITE_URL + '/contact',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    publishingPrinciples: SITE_URL + '/editorial-policy',
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_URL + '/#website',
    name: SITE_NAME,
    alternateName: ['PaisaReality', 'paisareality.com'],
    url: SITE_URL + '/',
    inLanguage: ['en-IN', 'hi-IN'],
    publisher: { '@id': SITE_URL + '/#organization' },
  };

  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6484525483464374" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.country" content="India" />
        <meta name="language" content="English" />
        <meta name="distribution" content="global" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        <link rel="dns-prefetch" href="https://tpc.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className="font-sans bg-white text-ink antialiased flex flex-col min-h-screen">
        <Script id="sw-killswitch" strategy="afterInteractive">
  {`if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()));if(window.caches){caches.keys().then(k=>k.forEach(n=>caches.delete(n)))}}`}
</Script>
        <Script id="consent-default" strategy="beforeInteractive">{CONSENT_BOOTSTRAP}</Script>
        <GoogleAnalytics />
        <AdSenseScript />
        <PublicOnly><Header /></PublicOnly>
            <main className="flex-1">{children}</main>
        <PublicOnly><Footer /></PublicOnly>
        <PublicOnly><CookieConsent /></PublicOnly>
        <PublicOnly><YojanaMitra /></PublicOnly>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </body>
    </html>
  );
}
