import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'FD Calculator India: Fixed Deposit Maturity',
  description:
    'Calculate your fixed deposit maturity amount and interest earned. Compare simple and compound interest for any bank FD in India.',
  path: '/calculators/fd',
  keywords: ['fd calculator india', 'fixed deposit calculator', 'fd maturity calculator', 'fd interest calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'FD Calculator India',
    path: '/calculators/fd',
    description: 'Calculate fixed deposit maturity amount and interest earned for any bank FD in India.',
    featureList: ['FD maturity value', 'Simple and compound interest', 'Any tenure', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate FD maturity',
    description: 'Work out your fixed deposit maturity in three steps.',
    path: '/calculators/fd',
    steps: [
      { name: 'How to use the FD calculator', text: 'Enter your deposit amount.' },
      { name: 'Set rate and tenure', text: 'Enter the interest rate and deposit tenure.' },
      { name: 'See maturity', text: 'View your maturity amount and total interest earned.' },
    ],
  });
  return (
    <>
      <Script id="fd-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="fd-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
