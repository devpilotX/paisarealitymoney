import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Smart Tools: Free Advanced Financial Calculators',
  description:
    'Free advanced money tools: retirement planner, loan prepay vs invest, debt optimizer, tax regime optimizer, budget planner, tax harvesting, gold planner, scheme maximizer, salary optimizer.',
  path: '/smart-tools',
  keywords: ['smart financial tools', 'advanced financial calculators', 'monte carlo retirement calculator', 'debt payoff calculator', 'tax regime optimizer'],
});

interface SmartTool {
  title: string;
  description: string;
  href: string;
  tag: string;
}

const SMART_TOOLS: SmartTool[] = [
  {
    title: 'Real Return Checker',
    description: '"Pay 50,000 a year, get 14 lakh!" — but what does it ACTUALLY pay? Type in any policy or scheme pitch and see its true annual return vs FD, PPF, and inflation.',
    href: '/calculators/real-return',
    tag: 'Mis-selling shield',
  },
  {
    title: 'Retirement Corpus and Withdrawal Optimizer',
    description: 'How much corpus do you need to retire? What SIP gets you there? What is a safe withdrawal rate? Uses Monte Carlo simulation with 10,000 paths.',
    href: '/calculators/retirement-optimizer',
    tag: 'Monte Carlo',
  },
  {
    title: 'Home Loan Prepay vs Invest',
    description: 'Should you prepay your home loan or invest the extra money? Gets you a risk-adjusted, after-tax answer with the probability of each path winning.',
    href: '/calculators/prepay-vs-invest',
    tag: 'Risk-adjusted',
  },
  {
    title: 'Multi-Loan Debt Repayment Optimizer',
    description: 'Got multiple loans? This finds the cheapest and fastest order to pay them off. Compares Avalanche vs Snowball, with tax awareness.',
    href: '/calculators/debt-optimizer',
    tag: 'Tax-aware',
  },
  {
    title: 'Multi-Year Tax Regime Optimizer',
    description: 'Old regime or new regime? This checks both across your entire career. Shows your crossover year and the best deduction mix each year.',
    href: '/calculators/lifecycle-tax-optimizer',
    tag: 'Multi-year',
  },
  {
    title: 'Smart Budget and Cash Flow Optimizer',
    description: 'Goes beyond 50/30/20. Finds your real surplus, flags overspending, and checks if your savings goals are on track.',
    href: '/calculators/budget-optimizer',
    tag: 'Adaptive',
  },
  {
    title: 'Tax-Loss and Gain Harvesting Optimizer',
    description: 'Which holdings should you sell before year-end to cut capital gains tax? Uses the 1.25 lakh LTCG exemption to save you money legally.',
    href: '/calculators/tax-harvesting',
    tag: 'Capital gains',
  },
  {
    title: 'Gold Allocation and Cost-Averaging Planner',
    description: 'Gold historical returns, risk, and diversification benefit. SIP vs lump-sum comparison and tax on different gold instruments. Educational, not advice.',
    href: '/calculators/gold-planner',
    tag: 'Educational',
  },
  {
    title: 'Government Scheme Benefit Maximizer',
    description: 'Total rupee benefit of every central scheme you qualify for. Conflict-resolved, with step-by-step instructions on how to claim each one.',
    href: '/calculators/scheme-maximizer',
    tag: 'Quantified',
  },
  {
    title: 'Salary Structure Optimizer',
    description: 'The optimal CTC breakup to legally minimize your income tax. Compares old and new regime and shows exactly which components to change.',
    href: '/calculators/salary-optimizer',
    tag: 'Tax saver',
  },
];

const SMART_TOOLS_FAQS = [
  {
    question: 'Are Smart Tools free to use?',
    answer: 'Yes, all Smart Tools are completely free. No login, no payment, no hidden charges. They run directly in your browser.',
  },
  {
    question: 'Is my data safe when I use these tools?',
    answer: 'Yes. All calculations happen in your browser. Your numbers never leave your device. We do not store or send your financial data anywhere.',
  },
  {
    question: 'What is Monte Carlo simulation?',
    answer: 'It is a method that runs thousands of random scenarios to give you a probability-based answer instead of a single fixed number. Our retirement tool uses 10,000 paths to show you the range of possible outcomes.',
  },
  {
    question: 'How are Smart Tools different from basic calculators?',
    answer: 'Basic calculators give you a simple formula-based answer. Smart Tools handle complex, multi-variable problems like tax optimization across years, debt payoff ordering, and retirement planning with market uncertainty.',
  },
  {
    question: 'Should I trust these results for real financial decisions?',
    answer: 'These tools give you good estimates based on the numbers you enter. They are educational, not financial advice. For big decisions, always talk to a qualified financial advisor.',
  },
];

export default function SmartToolsPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Smart Tools' }]} />

      <h1 className="heading-1 mb-2">Smart Tools</h1>
      <p className="text-body mb-8 max-w-2xl">
        These go beyond basic calculators. Paisa Reality Smart Tools simulate thousands of scenarios so you can plan your retirement, debt, tax, and investments with real confidence. Free and private.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {SMART_TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="relative block rounded-xl border-2 border-primary/30 bg-primary-50/30 p-6 no-underline group
                       transition-all duration-200 hover:border-primary hover:shadow-md"
          >
            <div className="flex items-start justify-end mb-3">
              <span className="text-xs font-semibold bg-primary text-white px-2.5 py-1 rounded-full">{tool.tag}</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
              {tool.title}
            </h2>
            <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
            <span className="text-sm font-medium text-primary">Open tool</span>
          </Link>
        ))}
      </div>

      <AdBanner format="horizontal" />

      <section className="mt-10 max-w-3xl">
        <FAQ items={SMART_TOOLS_FAQS} />
      </section>

      <section className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Related pages</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/calculators" className="text-sm text-primary no-underline hover:underline">Basic Calculators</Link>
          <Link href="/score" className="text-sm text-primary no-underline hover:underline">Money Health Score</Link>
          <Link href="/schemes" className="text-sm text-primary no-underline hover:underline">Government Schemes</Link>
          <Link href="/bank-rates" className="text-sm text-primary no-underline hover:underline">Bank Rates</Link>
          <Link href="/gold-rate" className="text-sm text-primary no-underline hover:underline">Gold Rate Today</Link>
        </div>
      </section>
    </div>
  );
}
