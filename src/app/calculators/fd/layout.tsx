import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'FD Calculator India: Fixed Deposit Maturity',
  description:
    'Calculate your fixed deposit maturity amount and interest earned. Compare simple and compound interest for any bank FD in India.',
  path: '/calculators/fd',
  keywords: ['fd calculator india', 'fixed deposit calculator', 'fd maturity calculator', 'fd interest calculator'],
});

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
