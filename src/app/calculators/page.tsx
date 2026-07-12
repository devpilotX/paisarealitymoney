import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Free Financial Calculators: EMI, SIP, FD, PPF, Tax',
  description: 'Free financial calculators for EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA and inflation. Instant results in your browser. No signup needed.',
  path: '/calculators',
  keywords: ['financial calculators india', 'emi calculator', 'sip calculator', 'fd calculator', 'income tax calculator'],
});

type IconKey =
  | 'house' | 'chart' | 'bank' | 'coins' | 'receipt'
  | 'key' | 'person' | 'award' | 'building' | 'trend';

const ICONS: Record<IconKey, React.ReactElement> = {
  house: <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />,
  chart: <><path d="M3 3v18h18" /><path d="m7 14 3-3 3 3 5-6" /></>,
  bank: <path d="M3 21h18M4 21V10h16v11M9 21v-6h6v6M4 10l8-6 8 6" />,
  coins: <><circle cx="8" cy="8" r="5" /><path d="M15.5 5.5a5 5 0 1 1 0 13M6 8h4M8 6.5v3" /></>,
  receipt: <path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4" />,
  key: <><path d="M3 21h18M5 21V10l7-5 7 5v11" /><circle cx="12" cy="13" r="2" /><path d="M12 15v3" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8.5 13.5-1.5 7 5-3 5 3-1.5-7" /></>,
  building: <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 9h4a1 1 0 0 1 1 1v11M8 7h3M8 11h3M8 15h3" />,
  trend: <><path d="M3 6l6 6 4-4 8 8" /><path d="M21 16v-6h-6" /></>,
};

interface CalcCard { title: string; description: string; href: string; icon: IconKey; }

const CALCULATORS: CalcCard[] = [
  { title: 'EMI Calculator', description: 'Calculate your monthly EMI for home loan, car loan, or personal loan. See total interest and amortization schedule.', href: '/calculators/emi', icon: 'house' },
  { title: 'SIP Calculator', description: 'Calculate returns on your monthly SIP investment in mutual funds. See how your money grows over time.', href: '/calculators/sip', icon: 'chart' },
  { title: 'FD Calculator', description: 'Calculate maturity amount for your Fixed Deposit. Compare simple and compound interest.', href: '/calculators/fd', icon: 'bank' },
  { title: 'PPF Calculator', description: 'Calculate returns on Public Provident Fund with 15-year lock-in at current 7.1% interest rate.', href: '/calculators/ppf', icon: 'coins' },
  { title: 'Income Tax Calculator', description: 'Calculate income tax under old and new regime. Compare which regime saves you more tax.', href: '/calculators/income-tax', icon: 'receipt' },
  { title: 'Home Loan Calculator', description: 'Calculate home loan EMI, total cost, and check your affordability based on income.', href: '/calculators/home-loan', icon: 'key' },
  { title: 'NPS Calculator', description: 'Calculate your National Pension System corpus and monthly pension at retirement.', href: '/calculators/nps', icon: 'person' },
  { title: 'Gratuity Calculator', description: 'Calculate gratuity amount based on your years of service and last drawn salary.', href: '/calculators/gratuity', icon: 'award' },
  { title: 'HRA Calculator', description: 'Calculate HRA exemption to reduce your taxable income. For salaried employees paying rent.', href: '/calculators/hra', icon: 'building' },
  { title: 'Inflation Calculator', description: 'Calculate how inflation eats into the value of your money over 5, 10, or 20 years.', href: '/calculators/inflation', icon: 'trend' },
];

const CALC_FAQS = [
  { question: 'Are these calculators accurate?', answer: 'They use standard financial formulas and give accurate results based on what you enter. Actual amounts may vary due to processing fees, taxes, and bank-specific terms. Use these as estimates for planning.' },
  { question: 'Do I need to sign up?', answer: 'No. All calculators are completely free and need no signup or login. Your data stays in your browser and is never sent anywhere.' },
  { question: 'Can I use these on my phone?', answer: 'Yes. All calculators work on mobile phones, tablets, and desktops. The inputs are designed for easy use on touch screens.' },
  { question: 'What if I need something more advanced?', answer: 'Check out our Smart Tools section. Those handle complex questions like retirement planning with Monte Carlo simulation, multi-loan debt optimization, and multi-year tax regime comparison.' },
  { question: 'How is EMI calculated?', answer: 'EMI is calculated using the standard reducing balance formula: EMI = P x R x (1+R)^N / ((1+R)^N - 1), where P is principal, R is monthly interest rate, and N is number of months.' },
];

export default function CalculatorsPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Financial Calculators' }]} />
      <h1 className="heading-1 mb-3">Financial Calculators</h1>
      <p className="text-body mb-8 max-w-2xl">
        Our calculators give you real answers for the money questions you face every day. EMI, SIP, tax, loans, and more. Free, instant, no signup needed.
      </p>

      <AdBanner format="horizontal" />

      <section className="my-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CALCULATORS.map((calc) => (
            <Link key={calc.href} href={calc.href} className="card no-underline group flex flex-col">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-[5px] border border-line bg-paper-2 text-navy mb-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {ICONS[calc.icon]}
                </svg>
              </span>
              <h3 className="font-serif text-lg font-bold text-navy mb-2 group-hover:text-brand-red transition-colors duration-200">
                {calc.title}
              </h3>
              <p className="text-sm text-muted">{calc.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Link to Smart Tools */}
      <section className="my-8 p-6 bg-paper-2 border border-line rounded-[5px] text-center">
        <p className="text-ink mb-3">Looking for something more advanced?</p>
        <Link href="/smart-tools" className="btn-primary no-underline">
          See all Smart Tools
        </Link>
      </section>

      <FAQ items={CALC_FAQS} />

      {/* Internal links */}
      <section className="mt-8 pt-6 border-t border-line">
        <h2 className="font-serif text-base font-bold text-navy mb-3">Related pages</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/smart-tools" className="text-sm text-navy no-underline hover:text-brand-red">Smart Tools</Link>
          <Link href="/score" className="text-sm text-navy no-underline hover:text-brand-red">Money Health Score</Link>
          <Link href="/schemes" className="text-sm text-navy no-underline hover:text-brand-red">Government Schemes</Link>
          <Link href="/bank-rates" className="text-sm text-navy no-underline hover:text-brand-red">Bank Rates</Link>
          <Link href="/gold-rate" className="text-sm text-navy no-underline hover:text-brand-red">Gold Rate Today</Link>
        </div>
      </section>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
