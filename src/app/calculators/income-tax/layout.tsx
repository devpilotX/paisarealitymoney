import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Income Tax Calculator FY 2026-27 (AY 2027-28): Old vs New Regime',
  description:
    'Free income tax calculator for FY 2026-27 and FY 2025-26. Compare the old vs new tax regime and instantly see which one saves you more based on your salary, deductions, and exemptions.',
  path: '/calculators/income-tax',
  keywords: [
    'income tax calculator india', 'income tax calculator fy 2026-27', 'old vs new tax regime calculator',
    'income tax calculator 2026-27', 'new tax regime calculator', 'tax calculator india', 'ay 2027-28 tax calculator',
  ],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'Income Tax Calculator India',
    path: '/calculators/income-tax',
    description:
      'Compare income tax under the old and new regime for FY 2026-27 and FY 2025-26 in India, and find which regime saves you more.',
    featureList: ['Old vs new regime comparison', 'FY 2026-27 and FY 2025-26', 'Standard deduction and 80C', 'Instant in-browser results'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate your income tax in India',
    description: 'Estimate your income tax under the old and new regime in four steps.',
    path: '/calculators/income-tax',
    steps: [
      { name: 'Enter income', text: 'Enter your annual salary or total income for the financial year.' },
      { name: 'Add deductions', text: 'Add eligible deductions such as 80C, 80D, HRA, and the standard deduction.' },
      { name: 'Compare regimes', text: 'The calculator shows your tax under both the old and new tax regime side by side.' },
      { name: 'Pick the saver', text: 'Choose the regime with the lower tax outgo for your situation.' },
    ],
  });
  return (
    <>
      <Script id="incometax-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="incometax-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
