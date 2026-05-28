import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import AdSenseScript from '@/components/AdSenseScript';
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const SITE_URL = 'https' + '://paisareality.com';
const SEARCH_TARGET = SITE_URL + '/search?q={search_term_string}';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Paisa Reality - Gold Rate, Schemes, Calculators, Bank Rates',
    template: '%s | Paisa Reality',
  },
  description:
    'Find Indian government schemes with eligibility, benefits, documents, and official apply links. Check gold, silver, petrol, and diesel prices. Use free calculators and compare bank rates.',
  keywords: [
    'government schemes india',
    'sarkari yojana',
    'pm yojana',
    'gold rate today',
    'silver rate today',
    'petrol price today',
    'diesel price today',
    'government schemes',
    'EMI calculator',
    'SIP calculator',
    'FD calculator',
    'bank rates',
    'India',
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
    alternateLocale: 'hi_IN',
    url: SITE_URL,
    siteName: 'Paisa Reality',
    title: 'Paisa Reality - Gold Rate, Schemes, Calculators, Bank Rates',
    description:
      "India's one-stop money hub.",
    images: [
      {
        url: '/paisa_reality_logo.png',
        width: 512,
        height: 512,
        alt: 'Paisa Reality - India\'s Money Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paisa Reality - Gold Rate, Schemes, Calculators, Bank Rates',
    description:
      "India's one-stop money hub.",
    images: ['/paisa_reality_logo.png'],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-IN': SITE_URL,
      'hi-IN': SITE_URL + '/hi',
      'x-default': SITE_URL,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
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
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <meta name="google-site-verification" content="UKt2p3p1YlGr_1Tk84QZ8UGMaIGeiPMArUEJqGCD0lU" />
        <meta name="google-adsense-account" content="ca-pub-6484525483464374" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.country" content="India" />
        <meta name="language" content="English,Hindi" />
        <meta name="distribution" content="global" />
      </head>
      <body className="font-sans bg-white text-gray-900 antialiased flex flex-col min-h-screen">
        <Script id="sw-killswitch" strategy="beforeInteractive">
  {`if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()));if(window.caches){caches.keys().then(k=>k.forEach(n=>caches.delete(n)))}}`}
</Script>
        <GoogleAnalytics />
        <AdSenseScript />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        <Script
          src="https://api.devpilotx.com/widget.js"
          data-assistant="yojana-mitra"
          strategy="afterInteractive"
        />
        <Script id="organization-jsonld" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Paisa Reality',
          url: SITE_URL,
          logo: SITE_URL + '/paisa_reality_logo.png',
          sameAs: ['https://devpilotx.com'],
        }) }} />
        <Script id="website-jsonld" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Paisa Reality',
          url: SITE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: SEARCH_TARGET,
            'query-input': 'required name=search_term_string',
          },
        }) }} />
        <Script src="https://api.devpilotx.com/v2/widget.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
