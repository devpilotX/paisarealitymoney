import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Free Financial Calculators - EMI, SIP, FD, Tax',
  description: 'Use free financial calculators for EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA, and inflation. Instant results, no signup required.',
  alternates: { canonical: 'https://paisareality.com/calculators' },
};

interface CalcCard { title: string; description: string; href: string; icon: string; }

const CALCULATORS: CalcCard[] = [
  { title: 'EMI Calculator', description: 'Calculate your monthly EMI for home loan, car loan, or personal loan. See total interest and amortization schedule.', href: '/calculators/emi', icon: '\ud83c\udfe0' },
  { title: 'SIP Calculator', description: 'Calculate returns on your monthly SIP investment in mutual funds. See how your money grows over time.', href: '/calculators/sip', icon: '\ud83d\udcc8' },
  { title: 'FD Calculator', description: 'Calculate maturity amount for your Fixed Deposit. Compare simple and compound interest.', href: '/calculators/fd', icon: '\ud83c\udfe6' },
  { title: 'PPF Calculator', description: 'Calculate returns on Public Provident Fund with 15-year lock-in at current 7.1% interest rate.', href: '/calculators/ppf', icon: '\ud83d\udcb0' },
  { title: 'Income Tax Calculator', description: 'Calculate income tax under old and new regime. Compare which regime saves you more tax.', href: '/calculators/income-tax', icon: '\ud83d\udcca' },
  { title: 'Home Loan Calculator', description: 'Calculate home loan EMI, total cost, and check your affordability based on income.', href: '/calculators/home-loan', icon: '\ud83c\udfe1' },
  { title: 'NPS Calculator', description: 'Calculate your National Pension System corpus and monthly pension at retirement.', href: '/calculators/nps', icon: '\ud83d\udc74' },
  { title: 'Gratuity Calculator', description: 'Calculate gratuity amount based on your years of service and last drawn salary.', href: '/calculators/gratuity', icon: '\ud83c\udfc6' },
  { title: 'HRA Calculator', description: 'Calculate HRA exemption to reduce your taxable income. For salaried employees.', href: '/calculators/hra', icon: '\ud83c\udfd8\ufe0f' },
  { title: 'Inflation Calculator', description: 'Calculate how inflation affects the value of your money over time.', href: '/calculators/inflation', icon: '\ud83d\udcb8' },
];

const CALC_FAQS = [
  { question: 'Are these calculators accurate?', answer: 'Our calculators use standard financial formulas and provide accurate results based on the inputs you provide. However, actual amounts may vary due to processing fees, taxes, and institution-specific terms. Use these as estimates for planning purposes.' },
  { question: 'Do I need to sign up to use the calculators?', answer: 'No. All calculators on Paisa Reality are completely free and require no signup, login, or registration. Your data stays in your browser and is not sent to any server.' },
  { question: 'Can I use these calculators on mobile?', answer: 'Yes. All calculators are fully responsive and work on mobile phones, tablets, and desktop computers. The sliders and inputs are designed for easy use on touch screens.' },
];

export default function CalculatorsPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Financial Calculators' }]} />
      <h1 className="heading-1 mb-3">Free Financial Calculators</h1>
      <p className="text-body mb-8 max-w-2xl">
        Plan your finances with our free calculators. Calculate EMI, SIP returns, FD maturity, income tax, and more. Instant results. No signup needed. All calculations happen in your browser.
      </p>

      <AdBanner format="horizontal" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
        {CALCULATORS.map((calc) => (
          <Link key={calc.href} href={calc.href} className="card no-underline group">
            <div className="text-3xl mb-3">{calc.icon}</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
              {calc.title}
            </h2>
            <p className="text-sm text-gray-600">{calc.description}</p>
          </Link>
        ))}
      </div>

      <FAQ items={CALC_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}