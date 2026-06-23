import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Gratuity Calculator India: Calculate Gratuity Amount',
  description:
    'Calculate your gratuity payout based on last drawn salary and years of service. Works for both government and private sector employees in India.',
  path: '/calculators/gratuity',
  keywords: ['gratuity calculator india', 'gratuity amount calculator', 'gratuity formula', 'gratuity eligibility calculator'],
});

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
