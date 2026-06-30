import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'EMI Calculator India: Home, Personal & Car Loan EMI',
  description:
    'Free EMI calculator for India. Calculate your monthly EMI for a home loan, personal loan or car loan. Enter amount, interest rate and tenure to see total interest and full payment breakup.',
  path: '/calculators/emi',
  keywords: ['emi calculator india', 'loan emi calculator', 'home loan emi calculator', 'car loan emi calculator', 'personal loan emi'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'EMI Calculator India',
    path: '/calculators/emi',
    description: 'Calculate the monthly EMI, total interest and payment breakup for any loan in India.',
    featureList: ['Home, car and personal loan EMI', 'Total interest breakup', 'Amortisation view', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate your loan EMI',
    description: 'Work out your monthly loan EMI in three steps.',
    path: '/calculators/emi',
    steps: [
      { name: 'Enter loan amount', text: 'Enter the total loan amount (principal) you want to borrow.' },
      { name: 'Set rate and tenure', text: 'Enter the annual interest rate and the loan tenure in months or years.' },
      { name: 'See your EMI', text: 'The calculator shows your monthly EMI, total interest, and total amount payable.' },
    ],
  });
  return (
    <>
      <Script id="emi-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="emi-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
