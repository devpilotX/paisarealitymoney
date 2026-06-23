import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Inflation Calculator India: Future Cost of Living',
  description:
    'Calculate how inflation will increase the cost of things over time. See what today money will be worth in the future, or what a future expense costs in today terms.',
  path: '/calculators/inflation',
  keywords: ['inflation calculator india', 'future value calculator', 'cost of living calculator', 'inflation impact calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Inflation Calculator',
    url: 'https://paisareality.com/calculators/inflation',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="inflation-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
