import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Gratuity Calculator India: Calculate Gratuity Amount',
  description:
    'Calculate your gratuity payout based on last drawn salary and years of service. Works for both government and private sector employees in India.',
  path: '/calculators/gratuity',
  keywords: ['gratuity calculator india', 'gratuity amount calculator', 'gratuity formula', 'gratuity eligibility calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'Gratuity Calculator India',
    path: '/calculators/gratuity',
    description: 'Calculate your gratuity payout based on last drawn salary and years of service.',
    featureList: ['Last drawn salary basis', 'Govt and private', 'Eligibility check', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate gratuity',
    description: 'Work out your gratuity amount in three steps.',
    path: '/calculators/gratuity',
    steps: [
      { name: 'Enter salary', text: 'Enter your last drawn basic salary plus DA.' },
      { name: 'Enter years of service', text: 'Enter your total years of service.' },
      { name: 'See gratuity', text: 'View your gratuity payout amount.' },
    ],
  });
  return (
    <>
      <Script id="gratuity-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="gratuity-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
