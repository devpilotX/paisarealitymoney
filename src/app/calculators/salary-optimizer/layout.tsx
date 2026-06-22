import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Salary Structure Optimizer India. Maximize Take Home Pay',
  description:
    'Optimize your salary structure to legally maximize take-home pay. Restructure basic, HRA, allowances and deductions to pay less tax.',
  alternates: { canonical: 'https://paisareality.com/calculators/salary-optimizer' },
  openGraph: {
    title: 'Salary Structure Optimizer India',
    description: 'Restructure salary to maximize take-home. Free tool.',
    url: 'https://paisareality.com/calculators/salary-optimizer',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salary Structure Optimizer India',
    description: 'Restructure salary to maximize take-home. Free tool.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Salary Structure Optimizer',
    url: 'https://paisareality.com/calculators/salary-optimizer',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="salary-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
