import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Inflation Calculator India: Future Cost of Living',
  description:
    'Calculate how inflation will increase the cost of things over time. See what today money will be worth in the future, or what a future expense costs in today terms.',
  path: '/calculators/inflation',
  keywords: ['inflation calculator india', 'future value calculator', 'cost of living calculator', 'inflation impact calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'Inflation Calculator India',
    path: '/calculators/inflation',
    description: 'See how inflation changes the cost of things over time and what your money will be worth in future.',
    featureList: ['Future value', 'Cost of living', 'Any time period', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate inflation impact',
    description: 'See the effect of inflation in three steps.',
    path: '/calculators/inflation',
    steps: [
      { name: 'Enter amount', text: 'Enter a present amount or a future expense.' },
      { name: 'Set rate and years', text: 'Enter the inflation rate and number of years.' },
      { name: 'See result', text: 'View the future value or the present-day equivalent.' },
    ],
  });
  return (
    <>
      <Script id="inflation-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="inflation-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
