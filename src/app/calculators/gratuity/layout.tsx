import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Gratuity Calculator India. Calculate Gratuity Amount',
  description:
    'Calculate your gratuity payout based on last drawn salary and years of service. Works for both government and private sector employees in India.',
  alternates: { canonical: 'https://paisareality.com/calculators/gratuity' },
  openGraph: {
    title: 'Gratuity Calculator India',
    description: 'Calculate your gratuity amount instantly. Free tool.',
    url: 'https://paisareality.com/calculators/gratuity',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Gratuity Calculator',
    url: 'https://paisareality.com/calculators/gratuity',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="gratuity-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
