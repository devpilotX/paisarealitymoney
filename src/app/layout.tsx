import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
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
    'Paisa Reality helps you check your free Money Health Score, use 9 smart financial tools, track live rates, find government schemes, and compare bank rates in India.',
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
    google: 'UKt2p3p1YlGr_1Tk84QZ8UGMaIGeiPMArUEJqGCD0lU',
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
    icon: [{ url: '/favicon.ico' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#007A78',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: SITE_URL + '/paisa_reality_logo.png' },
    description:
      'Paisa Reality offers a free Money Health Score, smart financial calculators, live gold, silver, petrol and diesel rates, government scheme matching, and bank rate comparison for India.',
    areaServed: { '@type': 'Country', name: 'India' },
    knowsLanguage: ['en-IN', 'hi-IN'],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'PaisaReality',
    url: SITE_URL,
    inLanguage: ['en-IN', 'hi-IN'],
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };

  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <meta name="google-site-verification" content="UKt2p3p1YlGr_1Tk84QZ8UGMaIGeiPMArUEJqGCD0lU" />
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
      <body className="font-sans bg-white text-gray-900 antialiased flex flex-col min-h-screen">
        <Script id="sw-killswitch" strategy="afterInteractive">
  {`if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()));if(window.caches){caches.keys().then(k=>k.forEach(n=>caches.delete(n)))}}`}
</Script>
        <GoogleAnalytics />
        <AdSenseScript />
        <Header />
            <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        <YojanaMitra />
        <Script id="organization-jsonld" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <Script id="website-jsonld" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </body>
    </html>
  );
}
