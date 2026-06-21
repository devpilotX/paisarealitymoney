import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SIP Calculator India. Calculate Mutual Fund Returns',
  description:
    'Calculate how much your monthly SIP investment will grow to over time. See the power of compounding with different amounts, durations and expected returns.',
  alternates: { canonical: 'https://paisareality.com/calculators/sip' },
  openGraph: {
    title: 'SIP Calculator India',
    description: 'See how much your monthly SIP can grow. Free, instant results.',
    url: 'https://paisareality.com/calculators/sip',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SIP Calculator',
    url: 'https://paisareality.com/calculators/sip',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="sip-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
