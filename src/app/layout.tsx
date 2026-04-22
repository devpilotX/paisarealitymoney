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

export const metadata: Metadata = {
  metadataBase: new URL('https://paisareality.com'),
  title: {
    default: 'Paisa Reality - Gold Rate, Schemes, Calculators, Bank Rates',
    template: '%s | Paisa Reality',
  },
  description:
    'Check today\'s gold rate, silver rate, petrol price, diesel price. Find government schemes you qualify for. Use free EMI, SIP, FD, and tax calculators. Compare bank rates across 50+ banks.',
  keywords: [
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
    url: 'https://paisareality.com',
    siteName: 'Paisa Reality',
    title: 'Paisa Reality - Gold Rate, Schemes, Calculators, Bank Rates',
    description:
      "India's one-stop money hub.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Paisa Reality - India\'s Money Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paisa Reality - Gold Rate, Schemes, Calculators, Bank Rates',
    description:
      "India's one-stop money hub.",
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://paisareality.com',
    languages: {
      'en-IN': 'https://paisareality.com',
      'hi-IN': 'https://paisareality.com/hi',
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
      </body>
    </html>
  );
}
