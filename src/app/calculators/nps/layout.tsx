import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'NPS Calculator India. National Pension Scheme Returns',
  description:
    'Calculate your NPS corpus at retirement and monthly pension. See how much to invest monthly in NPS to reach your retirement goal.',
  alternates: { canonical: 'https://paisareality.com/calculators/nps' },
  openGraph: {
    title: 'NPS Calculator India',
    description: 'Calculate NPS returns and retirement pension. Free tool.',
    url: 'https://paisareality.com/calculators/nps',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NPS Calculator India',
    description: 'Calculate NPS returns and retirement pension. Free tool.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'NPS Calculator',
    url: 'https://paisareality.com/calculators/nps',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="nps-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
