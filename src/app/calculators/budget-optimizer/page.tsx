import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import BudgetOptimizerClient from './BudgetOptimizerClient';

export const metadata: Metadata = {
  title: 'Smart Budget Calculator. Adaptive 50/30/20 for India',
  description:
    'A free budget planner that adapts the 50/30/20 rule to your income, city and job stability. Finds your monthly surplus, flags overspending, sizes your emergency fund and checks goal feasibility. No login, 100% private.',
  keywords: [
    '50/30/20 budget calculator india', 'budget calculator india', 'how to budget salary',
    'monthly budget planner', 'emergency fund calculator', 'savings rate calculator india',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/budget-optimizer' },
  openGraph: {
    title: 'Smart Cash Flow & Budget Optimizer',
    description:
      'Beyond static 50/30/20. an adaptive budget that flexes with your income and city, finds your surplus, and checks your goals. Free and private.',
    url: 'https://paisareality.com/calculators/budget-optimizer',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'What is the 50/30/20 budget rule, and why adapt it?',
    answer:
      'The 50/30/20 rule says to spend 50% of your take-home on needs, 30% on wants and 20% on savings. It is a great starting point, but it is too rigid for real life. Someone earning ₹30,000 a month in a metro cannot keep needs to 50%, while someone earning ₹3 lakh can save far more than 20%. This tool adapts the split to your income level and city tier. lowering the needs share as you earn more and allowing a higher housing share in metros. so the target is realistic for you.',
  },
  {
    question: 'How does it find my "surplus"?',
    answer:
      'Your monthly surplus is your take-home income minus your needs and wants spending. the money available to save, invest or put toward goals. The tool also calculates a second number: the extra cash you could free up by trimming categories where you spend above the benchmark. Together they show both what you are saving now and what you could be saving.',
  },
  {
    question: 'How big should my emergency fund be?',
    answer:
      'The classic guidance is 3–6 months of expenses, but it depends on income stability. This tool recommends about 4 months for very stable jobs (government, large firms), 6 months for normal employment, and up to 9 months for variable, startup or freelance income. It then shows your gap to that target and roughly how many months of your current surplus it will take to fill. because an emergency fund should usually come before long-term investing.',
  },
  {
    question: 'How does it check whether my goals are achievable?',
    answer:
      'For each goal you enter. a car down payment, a vacation, a wedding. the tool computes the monthly contribution needed to reach it by your deadline, then compares the total against your available surplus. If a goal is not feasible, it tells you exactly how much more per month you would need, so you can either extend the deadline, increase income, or trim spending.',
  },
  {
    question: 'What if I spend more than I earn?',
    answer:
      'The tool detects a deficit and switches to a recovery plan: it shows the exact monthly gap, points to your biggest overspending categories first, and advises cutting wants before touching savings or, as a last resort, essential needs. Fixing a deficit always comes before investing. you should never borrow to invest.',
  },
  {
    question: 'I am a freelancer with irregular income. can I still use this?',
    answer:
      'Yes. Turn on the "irregular income" option and the tool budgets on a conservative 85% floor of your stated income, so a good month does not lull you into overcommitting. Freelancers are also nudged toward a larger emergency fund because their cash flow is lumpier.',
  },
  {
    question: 'Does it use my real salary data?',
    answer:
      'Only in your browser. You can enter your monthly take-home directly, or your annual CTC and let the tool estimate take-home after tax and EPF. Either way, nothing is sent to a server. the entire budget is computed locally and the page works offline once loaded.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Smart Cash Flow & Budget Optimizer',
  url: 'https://paisareality.com/calculators/budget-optimizer',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, 100% client-side adaptive budgeting tool that flexes the 50/30/20 split to income and city, finds the surplus, flags overspending, sizes the emergency fund and checks goal feasibility.',
  featureList: [
    'Adaptive needs/wants/savings split by income and city tier',
    'Monthly surplus and savings-rate analysis',
    'Overspending flags vs benchmarks',
    'Emergency-fund sizing by job stability',
    'Goal feasibility and months-to-goal',
    'Deficit recovery plan and what-if levers',
  ],
};

export default function BudgetOptimizerPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/debt-optimizer', label: 'Debt Repayment Optimizer' },
    { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Budget Optimizer' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Adaptive · Goal-aware · 100% in-browser</span>
      </div>
      <h1 className="heading-1 mb-3">Smart Cash Flow &amp; Budget Optimizer</h1>
      <p className="text-body mb-6 max-w-3xl">
        The 50/30/20 rule is a fine starting point. but your ideal budget depends on what you earn, where you live, and
        how stable your income is. This tool <strong>adapts the split to you</strong>, finds the <strong>surplus you can
        redirect</strong>, flags where you&rsquo;re overspending, sizes your <strong>emergency fund</strong>, and checks
        whether your <strong>goals are on track</strong>. with a clear plan if money is tight.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <BudgetOptimizerClient />
      </div>

      <article className="prose max-w-3xl my-10">
        <h2>How to budget your salary in India. the adaptive way</h2>
        <p>
          Most budgeting advice hands you a fixed formula and wishes you luck. The trouble is that a single split cannot
          fit a fresh graduate renting in Bengaluru and a senior manager who owns a home in a smaller town. A budget should
          flex with three things: <strong>how much you earn</strong>, <strong>where you live</strong>, and <strong>how
          secure your income is</strong>. This optimizer builds your plan around all three.
        </p>

        <h2>Why the split should change with income</h2>
        <p>
          Essentials. rent, food, transport, utilities. do not scale up proportionally with income. When you earn more,
          your needs become a smaller share of your take-home, which means you can (and should) save a larger share. So
          this tool lowers the recommended needs percentage and raises savings as income rises: a modest earner might
          target 60% needs and 15% savings, while a high earner can aim for 40% needs and 30%+ savings. It also gives metro
          residents a higher housing allowance, because rent in a metro genuinely costs more.
        </p>

        <h2>Find the surplus hiding in your spending</h2>
        <p>
          The heart of the tool is finding money you can redirect. It compares each spending category against a sensible
          benchmark. housing against a city-adjusted cap, dining, shopping, subscriptions and the rest against typical
          shares of income. and flags where you are over. Add up those overshoots and you get the <strong>surplus you
          could free</strong> without touching essentials. Combined with your existing surplus, that is the fuel for your
          emergency fund, debt payoff and goals.
        </p>

        <h2>Emergency fund first, then goals</h2>
        <p>
          Before locking money into long-term investments, you need a cushion. The tool sizes your emergency fund at 4–9
          months of expenses depending on how stable your job is, shows the gap to that target, and estimates how long it
          will take to fill at your current surplus. Once that is in place, it turns to your goals: for each one it
          computes the monthly contribution required to hit the deadline and tells you whether your surplus can cover them
         . and if not, exactly how much short you are.
        </p>

        <h2>A plan for tight months and a nudge for good ones</h2>
        <p>
          If your spending exceeds your income, the tool does not just flash a warning. it builds a recovery plan, starting
          with your largest overspends and protecting your savings and essentials. And if you are already saving more than
          your target, it nudges you to put the surplus to work: step up your SIPs, prepay high-interest debt, or invest
          toward long-term goals. The &ldquo;what if&rdquo; lever lets you see, instantly, how trimming your wants moves
          your savings rate and pulls your goals closer.
        </p>

        <h2>Private by design</h2>
        <p>
          Your money is your business. Every calculation here runs entirely in your browser. your income, rent and spends
          never leave your device, there is no login, and the page works offline once loaded. Treat the benchmarks as
          guidelines rather than gospel: the right budget is the one you can actually stick to, and a qualified advisor can
          help with the big decisions.
        </p>
      </article>

      <ShareButton url="/calculators/budget-optimizer" title="Smart Cash Flow & Budget Optimizer - Paisa Reality" />
      <InternalLinks title="Related Calculators" links={calcLinks} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
