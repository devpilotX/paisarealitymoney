import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Home Loan EMI Calculator India: Payment Breakup',
  description:
    'Calculate your home loan EMI, total interest and year-wise payment schedule. Compare different loan amounts, tenures and interest rates for Indian home loans.',
  path: '/calculators/home-loan',
  keywords: ['home loan emi calculator india', 'home loan calculator', 'housing loan emi calculator', 'home loan interest calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'Home Loan EMI Calculator India',
    path: '/calculators/home-loan',
    description: 'Calculate home loan EMI, total interest and a year-wise payment schedule for Indian home loans.',
    featureList: ['Monthly EMI', 'Total interest', 'Year-wise schedule', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate home loan EMI',
    description: 'Work out your home loan EMI in three steps.',
    path: '/calculators/home-loan',
    steps: [
      { name: 'Enter loan amount', text: 'Enter the home loan amount you need.' },
      { name: 'Set rate and tenure', text: 'Enter the interest rate and loan tenure.' },
      { name: 'See EMI', text: 'View your EMI, total interest and full schedule.' },
    ],
  });
  return (
    <>
      <Script id="homeloan-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="homeloan-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
