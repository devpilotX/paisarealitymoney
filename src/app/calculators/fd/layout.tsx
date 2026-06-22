import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'FD Calculator India. Calculate Fixed Deposit Maturity',
  description:
    'Calculate your fixed deposit maturity amount and interest earned. Compare simple and compound interest for any bank FD in India.',
  alternates: { canonical: 'https://paisareality.com/calculators/fd' },
  openGraph: {
    title: 'FD Calculator India',
    description: 'Calculate FD maturity amount with interest breakup. Free.',
    url: 'https://paisareality.com/calculators/fd',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FD Calculator',
    url: 'https://paisareality.com/calculators/fd',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="fd-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
