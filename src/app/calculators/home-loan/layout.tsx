import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Home Loan EMI Calculator India. Monthly Payment Breakup',
  description:
    'Calculate your home loan EMI, total interest and year-wise payment schedule. Compare different loan amounts, tenures and interest rates for Indian home loans.',
  alternates: { canonical: 'https://paisareality.com/calculators/home-loan' },
  openGraph: {
    title: 'Home Loan EMI Calculator India',
    description: 'Calculate home loan EMI with full amortization schedule. Free.',
    url: 'https://paisareality.com/calculators/home-loan',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Home Loan EMI Calculator India',
    description: 'Calculate home loan EMI with full amortization schedule. Free.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Home Loan EMI Calculator',
    url: 'https://paisareality.com/calculators/home-loan',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="homeloan-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
