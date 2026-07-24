import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'PPF Calculator India: Public Provident Fund Returns',
  description:
    'Calculate your PPF maturity for monthly or yearly deposits. Set the interest rate, extend the term in 5-year blocks to 30 years, and see year-by-year growth at the current PPF rate.',
  path: '/calculators/ppf',
  keywords: ['ppf calculator india', 'public provident fund calculator', 'ppf maturity calculator', 'ppf interest calculator', 'ppf calculator monthly'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'PPF Calculator India',
    path: '/calculators/ppf',
    description: 'Calculate PPF maturity for monthly or yearly deposits, with an adjustable interest rate and a term of 15 to 30 years.',
    featureList: ['Monthly or yearly deposits', 'Adjustable interest rate', 'Extend up to 30 years', 'Year-by-year breakdown', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate PPF returns',
    description: 'Estimate your PPF maturity in a few steps.',
    path: '/calculators/ppf',
    steps: [
      { name: 'Choose frequency', text: 'Pick monthly or yearly deposits.' },
      { name: 'Enter your deposit', text: 'Set how much you invest each month or year.' },
      { name: 'Set rate and tenure', text: 'Adjust the interest rate and choose a term of 15 to 30 years.' },
      { name: 'See returns', text: 'View your maturity amount, total interest and year-by-year growth.' },
    ],
  });
  return (
    <>
      <Script id="ppf-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="ppf-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
