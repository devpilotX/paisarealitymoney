import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'EMI Calculator India. Calculate Loan EMI Instantly',
  description:
    'Calculate your monthly EMI for home loan, personal loan or car loan. Enter amount, interest rate and tenure to see total interest and payment breakup.',
  alternates: { canonical: 'https://paisareality.com/calculators/emi' },
  openGraph: {
    title: 'EMI Calculator India',
    description: 'Calculate monthly EMI for any loan. Free, instant results.',
    url: 'https://paisareality.com/calculators/emi',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EMI Calculator India',
    description: 'Calculate monthly EMI for any loan. Free, instant results.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'EMI Calculator',
    url: 'https://paisareality.com/calculators/emi',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="emi-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
