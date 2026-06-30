import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'NPS Calculator India: National Pension Scheme Returns',
  description:
    'Calculate your NPS corpus at retirement and monthly pension. See how much to invest monthly in NPS to reach your retirement goal.',
  path: '/calculators/nps',
  keywords: ['nps calculator india', 'national pension scheme calculator', 'nps pension calculator', 'nps corpus calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'NPS Calculator India',
    path: '/calculators/nps',
    description: 'Calculate your NPS corpus at retirement and the monthly pension you can expect.',
    featureList: ['Retirement corpus', 'Monthly pension', 'Annuity split', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate NPS pension',
    description: 'Estimate your NPS corpus and pension in three steps.',
    path: '/calculators/nps',
    steps: [
      { name: 'Enter monthly contribution', text: 'Enter how much you invest in NPS each month.' },
      { name: 'Set age and return', text: 'Enter your current age and expected return.' },
      { name: 'See corpus', text: 'View your retirement corpus and monthly pension.' },
    ],
  });
  return (
    <>
      <Script id="nps-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="nps-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
