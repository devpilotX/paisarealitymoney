import { pageMetadata } from '@/lib/seo';
import { calculatorSchema, howToSchema } from '@/lib/schema';
import Script from 'next/script';

export const metadata = pageMetadata({
  title: 'HRA Calculator India: House Rent Allowance Exemption',
  description:
    'Calculate your HRA exemption under Section 10(13A). Find out how much of your HRA is tax-free based on salary, rent paid and city of residence.',
  path: '/calculators/hra',
  keywords: ['hra calculator india', 'house rent allowance calculator', 'hra exemption calculator', 'section 10 13a calculator'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const appSchema = calculatorSchema({
    name: 'HRA Calculator India',
    path: '/calculators/hra',
    description: 'Calculate your HRA exemption under Section 10(13A) based on salary, rent paid and city.',
    featureList: ['Section 10(13A) exemption', 'Metro and non-metro', 'Tax-free HRA', 'Free, no login'],
  });
  const guideSchema = howToSchema({
    name: 'How to calculate HRA exemption',
    description: 'Find your tax-free HRA in three steps.',
    path: '/calculators/hra',
    steps: [
      { name: 'Enter salary and HRA', text: 'Enter your basic salary and the HRA you receive.' },
      { name: 'Enter rent and city', text: 'Enter the rent you pay and your city type.' },
      { name: 'See exemption', text: 'View how much of your HRA is tax-free.' },
    ],
  });
  return (
    <>
      <Script id="hra-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Script id="hra-howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }} />
      {children}
    </>
  );
}
