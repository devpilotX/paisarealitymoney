import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Salary Structure Optimizer: CTC Tax Calculator India',
  description:
    'Restructure your CTC to legally cut income tax. We compare old and new regime and show exactly which salary components to change. Free and private.',
  path: '/calculators/salary-optimizer',
  keywords: [
    'salary structure optimizer', 'ctc tax optimization', 'restructure salary',
    'salary calculator india tax', 'maximize take home pay',
  ],
});

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
