import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Free Financial Calculators - EMI, SIP, FD, PPF, Income Tax, Home Loan | Paisa Reality',
  description: 'Free financial calculators for EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA and inflation. Instant results in your browser. No signup needed.',
  alternates: { canonical: 'https://paisareality.com/calculators' },
  openGraph: {
    title: 'Free Financial Calculators - EMI, SIP, FD, PPF, Tax',
    description: 'Calculate EMI, SIP returns, FD maturity, PPF, income tax, home loan, NPS, gratuity, HRA and inflation. All free, no login.',
    url: 'https://paisareality.com/calculators',
    siteName: 'Paisa Reality',
    type: 'website',
  },
};

interface CalcCard { title: string; description: string; href: string; icon: string; }

const CALCULATORS: CalcCard[] = [
  { title: 'EMI Calculator', description: 'Calculate your monthly EMI for home loan, car loan, or personal loan. See total interest and amortization schedule.', href: '/calculators/emi', icon: '🏠' },
  { title: 'SIP Calculator', description: 'Calculate returns on your monthly SIP investment in mutual funds. See how your money grows over time.', href: '/calculators/sip', icon: '📈' },
  { title: 'FD Calculator', description: 'Calculate maturity amount for your Fixed Deposit. Compare simple and compound interest.', href: '/calculators/fd', icon: '🏦' },
  { title: 'PPF Calculator', description: 'Calculate returns on Public Provident Fund with 15-year lock-in at current 7.1% interest rate.', href: '/calculators/ppf', icon: '💰' },
  { title: 'Income Tax Calculator', description: 'Calculate income tax under old and new regime. Compare which regime saves you more tax.', href: '/calculators/income-tax', icon: '📊' },
  { title: 'Home Loan Calculator', description: 'Calculate home loan EMI, total cost, and check your affordability based on income.', href: '/calculators/home-loan', icon: '🏡' },
  { title: 'NPS Calculator', description: 'Calculate your National Pension System corpus and monthly pension at retirement.', href: '/calculators/nps', icon: '👴' },
  { title: 'Gratuity Calculator', description: 'Calculate gratuity amount based on your years of service and last drawn salary.', href: '/calculators/gratuity', icon: '🏆' },
  { title: 'HRA Calculator', description: 'Calculate HRA exemption to reduce your taxable income. For salaried employees paying rent.', href: '/calculators/hra', icon: '🏘️' },
  { title: 'Inflation Calculator', description: 'Calculate how inflation eats into the value of your money over 5, 10, or 20 years.', href: '/calculators/inflation', icon: '💸' },
];

const CALC_FAQS = [
  { question: 'Are these calculators accurate?', answer: 'They use standard financial formulas and give accurate results based on what you enter. Actual amounts may vary due to processing fees, taxes, and bank-specific terms. Use these as estimates for planning.' },
  { question: 'Do I need to sign up?', answer: 'No. All calculators are completely free and need no signup or login. Your data stays in your browser and is never sent anywhere.' },
  { question: 'Can I use these on my phone?', answer: 'Yes. All calculators work on mobile phones, tablets, and desktops. The inputs are designed for easy use on touch screens.' },
  { question: 'What if I need something more advanced?', answer: 'Check out our Smart Tools section. Those handle complex questions like retirement planning with Monte Carlo simulation, multi-loan debt optimization, and multi-year tax regime comparison.' },
  { question: 'How is EMI calculated?', answer: 'EMI is calculated using the standard reducing balance formula: EMI = P x R x (1+R)^N / ((1+R)^N - 1), where P is principal, R is monthly interest rate, and N is number of months.' },
];

export default function CalculatorsPage(): React.ReactElement {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://paisareality.com' },
      { '@type': 'ListItem', position: 2, name: 'Calculators', item: 'https://paisareality.com/calculators' },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CALC_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <div className="container-main py-6">
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Breadcrumb items={[{ label: 'Financial Calculators' }]} />
      <h1 className="heading-1 mb-3">Financial Calculators</h1>
      <p className="text-body mb-8 max-w-2xl">
        Our calculators give you real answers for the money questions you face every day. EMI, SIP, tax, loans, and more. Free, instant, no signup needed.
      </p>

      <AdBanner format="horizontal" />

      <section className="my-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CALCULATORS.map((calc) => (
            <Link key={calc.href} href={calc.href} className="card no-underline group">
              <div className="text-3xl mb-3" aria-hidden="true">{calc.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
                {calc.title}
              </h3>
              <p className="text-sm text-gray-600">{calc.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Link to Smart Tools */}
      <section className="my-8 p-6 bg-primary-50 rounded-xl text-center">
        <p className="text-gray-700 mb-3">Looking for something more advanced?</p>
        <Link
          href="/smart-tools"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold
                     rounded-lg no-underline min-h-[44px] border-2 border-primary
                     bg-white text-primary
                     transition-all duration-200
                     hover:bg-primary hover:text-white hover:border-primary
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          See all Smart Tools
        </Link>
      </section>

      <FAQ items={CALC_FAQS} />

      {/* Internal links */}
      <section className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Related pages</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/smart-tools" className="text-sm text-primary no-underline hover:underline">Smart Tools</Link>
          <Link href="/score" className="text-sm text-primary no-underline hover:underline">Money Health Score</Link>
          <Link href="/schemes" className="text-sm text-primary no-underline hover:underline">Government Schemes</Link>
          <Link href="/bank-rates" className="text-sm text-primary no-underline hover:underline">Bank Rates</Link>
          <Link href="/gold-rate" className="text-sm text-primary no-underline hover:underline">Gold Rate Today</Link>
        </div>
      </section>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
