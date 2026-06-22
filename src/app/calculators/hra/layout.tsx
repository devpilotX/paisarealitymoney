import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'HRA Calculator India. House Rent Allowance Exemption',
  description:
    'Calculate your HRA exemption under Section 10(13A). Find out how much of your HRA is tax-free based on salary, rent paid and city of residence.',
  alternates: { canonical: 'https://paisareality.com/calculators/hra' },
  openGraph: {
    title: 'HRA Calculator India',
    description: 'Calculate HRA tax exemption under Section 10(13A). Free.',
    url: 'https://paisareality.com/calculators/hra',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'HRA Calculator',
    url: 'https://paisareality.com/calculators/hra',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="hra-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
