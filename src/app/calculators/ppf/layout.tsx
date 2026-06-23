import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'PPF Calculator India: Public Provident Fund Returns',
  description:
    'Calculate your PPF maturity amount, yearly interest and total returns over 15 years. See how yearly deposits grow at the current PPF interest rate.',
  path: '/calculators/ppf',
  keywords: ['ppf calculator india', 'public provident fund calculator', 'ppf maturity calculator', 'ppf interest calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PPF Calculator',
    url: 'https://paisareality.com/calculators/ppf',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="ppf-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
