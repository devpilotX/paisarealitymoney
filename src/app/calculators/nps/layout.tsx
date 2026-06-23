import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'NPS Calculator India: National Pension Scheme Returns',
  description:
    'Calculate your NPS corpus at retirement and monthly pension. See how much to invest monthly in NPS to reach your retirement goal.',
  path: '/calculators/nps',
  keywords: ['nps calculator india', 'national pension scheme calculator', 'nps pension calculator', 'nps corpus calculator'],
});

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
