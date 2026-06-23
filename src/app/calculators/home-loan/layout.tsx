import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Home Loan EMI Calculator India: Payment Breakup',
  description:
    'Calculate your home loan EMI, total interest and year-wise payment schedule. Compare different loan amounts, tenures and interest rates for Indian home loans.',
  path: '/calculators/home-loan',
  keywords: ['home loan emi calculator india', 'home loan calculator', 'housing loan emi calculator', 'home loan interest calculator'],
});

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
