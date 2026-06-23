import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'EMI Calculator India: Calculate Loan EMI Instantly',
  description:
    'Calculate your monthly EMI for home loan, personal loan or car loan. Enter amount, interest rate and tenure to see total interest and payment breakup.',
  path: '/calculators/emi',
  keywords: ['emi calculator india', 'loan emi calculator', 'home loan emi calculator', 'car loan emi calculator', 'personal loan emi'],
});

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
