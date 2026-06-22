import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Income Tax Calculator India 2024-25. Old vs New Regime',
  description:
    'Calculate your income tax under old and new regime for FY 2024-25. See which regime saves you more tax based on your salary, deductions and exemptions.',
  alternates: { canonical: 'https://paisareality.com/calculators/income-tax' },
  openGraph: {
    title: 'Income Tax Calculator India 2024-25',
    description: 'Compare old vs new tax regime. Calculate exact tax liability.',
    url: 'https://paisareality.com/calculators/income-tax',
    type: 'website',
  },
};

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
