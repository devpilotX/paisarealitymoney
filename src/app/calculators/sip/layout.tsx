import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'SIP Calculator India: Mutual Fund Returns & Growth',
  description:
    'Free SIP calculator for India. See how much your monthly SIP investment grows over time with the power of compounding across different amounts, durations and expected returns.',
  path: '/calculators/sip',
  keywords: ['sip calculator india', 'mutual fund sip calculator', 'sip returns calculator', 'monthly sip calculator', 'sip calculator with inflation'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'SIP Calculator India',
    path: '/calculators/sip',
    description: 'Estimate the maturity value and returns of a monthly mutual fund SIP in India.',
    featureList: ['Monthly SIP growth', 'Compounding visualisation', 'Goal planning', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to use the SIP calculator',
    description: 'Estimate your mutual fund SIP maturity value in three steps.',
    path: '/calculators/sip',
    steps: [
      { name: 'Enter monthly amount', text: 'Enter the amount you plan to invest each month through SIP.' },
      { name: 'Set duration and return', text: 'Choose the investment duration in years and your expected annual return.' },
      { name: 'See maturity value', text: 'The calculator shows your invested amount, estimated returns, and total maturity value.' },
    ],
  });
  return (
    <>
      <Script id="sip-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="sip-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
