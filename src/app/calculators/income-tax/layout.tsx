import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Income Tax Calculator FY 2025-26: Old vs New Regime',
  description:
    'Calculate your income tax under the old and new regime for FY 2025-26. See which regime saves you more based on your salary, deductions, and exemptions.',
  path: '/calculators/income-tax',
  keywords: ['income tax calculator india', 'old vs new tax regime calculator', 'income tax calculator 2025-26', 'tax calculator india'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Income Tax Calculator India',
    url: 'https://paisareality.com/calculators/income-tax',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="incometax-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
