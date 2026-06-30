import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'Salary Structure Optimizer: CTC Tax Calculator India',
  description:
    'Restructure your CTC to legally cut income tax. We compare old and new regime and show exactly which salary components to change. Free and private.',
  path: '/calculators/salary-optimizer',
  keywords: [
    'salary structure optimizer', 'ctc tax optimization', 'restructure salary',
    'salary calculator india tax', 'maximize take home pay',
  ],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'Salary Structure Optimizer India',
    path: '/calculators/salary-optimizer',
    description: 'Restructure your CTC to legally cut income tax by comparing the old and new regime.',
    featureList: ['CTC restructuring', 'Old vs new regime', 'Higher take-home', 'Free and private'],
  });
  const guideSchema = howToSchema({
    name: 'How to optimize your salary structure',
    description: 'Cut your tax by restructuring CTC in three steps.',
    path: '/calculators/salary-optimizer',
    steps: [
      { name: 'Enter your CTC', text: 'Enter your current CTC and salary components.' },
      { name: 'Compare regimes', text: 'We compare the old and new tax regime for you.' },
      { name: 'See savings', text: 'View which components to change and your tax savings.' },
    ],
  });
  return (
    <>
      <Script id="salary-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="salary-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
