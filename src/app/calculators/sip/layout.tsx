import { pageMetadata } from '@/lib/seo';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'SIP Calculator India: Mutual Fund Returns',
  description:
    'Calculate how much your monthly SIP investment will grow to over time. See the power of compounding with different amounts, durations and expected returns.',
  path: '/calculators/sip',
  keywords: ['sip calculator india', 'mutual fund sip calculator', 'sip returns calculator', 'monthly sip calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SIP Calculator',
    url: 'https://paisareality.com/calculators/sip',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  };
  return (
    <>
      <Script id="sip-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
