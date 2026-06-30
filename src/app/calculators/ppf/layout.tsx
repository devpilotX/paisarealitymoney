import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'PPF Calculator India: Public Provident Fund Returns',
  description:
    'Calculate your PPF maturity amount, yearly interest and total returns over 15 years. See how yearly deposits grow at the current PPF interest rate.',
  path: '/calculators/ppf',
  keywords: ['ppf calculator india', 'public provident fund calculator', 'ppf maturity calculator', 'ppf interest calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'PPF Calculator India',
    path: '/calculators/ppf',
    description: 'Calculate PPF maturity amount, yearly interest and total returns over 15 years.',
    featureList: ['15 year maturity', 'Yearly interest', 'Current PPF rate', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate PPF returns',
    description: 'Estimate your PPF maturity in three steps.',
    path: '/calculators/ppf',
    steps: [
      { name: 'Enter yearly deposit', text: 'Enter how much you deposit each year.' },
      { name: 'Set the rate', text: 'The current PPF interest rate is applied.' },
      { name: 'See returns', text: 'View your maturity amount and total interest.' },
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
