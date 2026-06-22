import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import DebtOptimizerClient from './DebtOptimizerClient';

export const metadata: Metadata = {
  title: 'Debt Payoff Optimizer. Avalanche vs Snowball (Tax-Aware)',
  description:
    'Multiple loans, one budget? Get the mathematically optimal repayment order that minimises interest and time. tax-aware for Section 24(b) and 80E. Compares Avalanche, Snowball and a tax-adjusted plan. Free, 100% private.',
  keywords: [
    'debt payoff calculator india', 'avalanche vs snowball calculator', 'debt repayment optimizer',
    'which loan to pay first', 'multiple loan payoff calculator', 'debt free calculator india',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/debt-optimizer' },
  openGraph: {
    title: 'Multi-Loan Debt Repayment Optimizer. Tax-Aware',
    description:
      'Which loan should you attack first? The optimal, tax-aware order to clear multiple loans fastest and cheapest. Avalanche vs Snowball vs tax-adjusted, free and private.',
    url: 'https://paisareality.com/calculators/debt-optimizer',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'Which loan should I pay off first?',
    answer:
      'Mathematically, you should put every spare rupee toward the loan with the highest interest rate while paying the minimums on the rest. the "avalanche" method. That minimises total interest. But in India there is a twist: home-loan interest (Section 24(b)) and education-loan interest (Section 80E) are tax-deductible, which lowers their real cost. This tool ranks your loans by their EFFECTIVE post-tax rate, so a 9% home loan with a deduction can correctly rank below a 12% personal loan that has none.',
  },
  {
    question: 'What is the difference between the Avalanche and Snowball methods?',
    answer:
      'Avalanche targets the highest interest rate first. it is the cheapest, fastest way to get out of debt mathematically. Snowball targets the smallest balance first. you clear individual loans quickly, which builds motivation, but you usually pay more interest overall. This tool runs both, plus a tax-aware plan, and shows the total interest and months for each side by side so you can choose with eyes open.',
  },
  {
    question: 'How does the tax-aware plan work?',
    answer:
      'It converts each loan\'s headline rate into an effective after-tax rate. Under the old regime, home-loan interest is deductible up to ₹2 lakh a year (Section 24(b)) and education-loan interest is fully deductible for up to 8 years (Section 80E). A 10% education loan at a 31.2% tax rate has an effective cost of only about 6.9%. The tool then attacks the loan with the highest effective rate first. which can be a different order from the headline-rate avalanche, and saves you more in real, after-tax terms.',
  },
  {
    question: 'What is the "debt rollover" or "debt stacking" method?',
    answer:
      'You pay the minimum on every loan, then throw all your remaining budget at the top-priority loan. When that loan is cleared, its minimum payment. plus your surplus. rolls over onto the next loan, like a snowball gathering mass. This tool simulates that rollover month by month so the schedule and payoff dates are exact.',
  },
  {
    question: 'Why do credit cards cost so much more?',
    answer:
      'Credit cards typically charge 36 to 48% a year and compound daily, not monthly. Daily compounding means interest is charged on interest every day, so the effective annual cost is higher than the headline rate suggests. That is why almost every optimal plan clears credit-card debt first. This tool models cards with daily compounding for accuracy.',
  },
  {
    question: 'What if my budget cannot cover all the minimum payments?',
    answer:
      'The tool warns you and tells you how much more you need. If you cannot meet the minimums, balances grow and penalties or default risk follow. so the first priority is to raise the budget (or restructure a loan) until it at least covers every minimum. Only the surplus above the minimums can be optimised.',
  },
  {
    question: 'Should I prepay or just pay minimums and invest instead?',
    answer:
      'That is a separate decision. clearing high-interest debt (especially credit cards at 40%+) almost always beats investing, but a cheap, tax-shielded home loan may not. Use this tool to find the optimal payoff order for the debt you choose to clear, and our Prepay vs Invest Optimizer to decide how much of your surplus should go to debt versus the market.',
  },
  {
    question: 'Is my data sent anywhere?',
    answer:
      'No. Every calculation runs inside your browser. Your loan balances, rates and income details are never transmitted to any server, and the tool works offline once the page has loaded.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Multi-Loan Debt Repayment Optimizer',
  url: 'https://paisareality.com/calculators/debt-optimizer',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, 100% client-side, tax-aware debt repayment optimizer that finds the loan payoff order minimising interest and time, comparing Avalanche, Snowball and an effective-rate plan.',
  featureList: [
    'Avalanche vs Snowball vs tax-aware comparison',
    'Effective post-tax rate ranking (Section 24(b) & 80E)',
    'Month-by-month debt rollover simulation',
    'Credit-card daily compounding',
    'Interest saved vs minimum payments',
    'Target debt-free-date budget solver',
  ],
};

export default function DebtOptimizerPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/prepay-vs-invest', label: 'Prepay vs Invest Optimizer' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
    { href: '/calculators/home-loan', label: 'Home Loan Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Debt Optimizer' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Tax-aware · Deterministic · 100% in-browser</span>
      </div>
      <h1 className="heading-1 mb-3">Multi-Loan Debt Repayment Optimizer</h1>
      <p className="text-body mb-6 max-w-3xl">
        Got multiple loans or cards? This finds the fastest and cheapest order to clear them, saving you interest and time.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <DebtOptimizerClient />
      </div>

      {/* SEO explainer */}
      <article className="prose max-w-3xl my-10">
        <h2>How to pay off multiple loans the smart way</h2>
        <p>
          When you owe money on several loans at once, the order in which you attack them decides how much interest you
          pay and how long you stay in debt. Pay them in the wrong order and you can lose tens of thousands of rupees and
          years of your life to interest. The good news: the optimal strategy is well understood, and this tool computes
          it exactly for your specific loans, budget and tax situation.
        </p>

        <h2>Avalanche: the cheapest route out</h2>
        <p>
          The <strong>avalanche method</strong> is mathematically optimal in a world without tax: pay the minimum on every
          loan, then throw all your spare cash at the loan with the <strong>highest interest rate</strong>. Once it is
          gone, roll that payment onto the next-highest rate, and so on. Because you always kill your most expensive debt
          first, you pay the least total interest and become debt-free fastest. The only downside is psychological. if
          your highest-rate loan also has a big balance, it can take a while to see a loan disappear.
        </p>

        <h2>Snowball: momentum over maths</h2>
        <p>
          The <strong>snowball method</strong> targets the <strong>smallest balance</strong> first, regardless of rate.
          You clear individual loans quickly, which feels great and keeps many people motivated to stick with the plan.
          The trade-off is that you usually pay more total interest than avalanche. This tool shows you exactly how much
          extra the snowball&rsquo;s motivation costs, so you can decide whether the behavioural boost is worth it.
        </p>

        <h2>The tax-aware twist that changes the answer in India</h2>
        <p>
          Here is what generic calculators miss. In India, some loan interest is <strong>tax-deductible</strong>, which
          lowers its real cost. Under the old regime, home-loan interest is deductible up to ₹2 lakh a year under
          <strong> Section 24(b)</strong>, and education-loan interest is <strong>fully deductible for up to 8 years</strong>
          under <strong>Section 80E</strong>. So a 10% education loan, for someone in the 31.2% tax bracket, really costs
          only about 6.9%. That means the headline-rate avalanche can be <em>wrong</em>: it might tell you to clear a 9%
          home loan before a 12% personal loan, when the home loan&rsquo;s after-tax cost is closer to 7% and the personal
          loan&rsquo;s is a full 12%. The <strong>tax-aware plan</strong> ranks every loan by its effective post-tax rate
          and attacks the genuinely most expensive debt first. saving you more in real money.
        </p>

        <h2>Credit cards, daily compounding and 0% offers</h2>
        <p>
          Credit cards are almost always the first thing to clear: they charge 36 to 48% a year and compound
          <strong> daily</strong>, so the true cost is even higher than the sticker rate. This tool models that daily
          compounding precisely. At the other extreme, a genuine <strong>0% EMI</strong> offer has no interest cost, so
          there is no benefit to prepaying it. the optimizer correctly pushes it to the very back of the queue and lets
          you pay it off slowly while your money tackles costlier debt.
        </p>

        <h2>Set a target date. and see what it costs</h2>
        <p>
          Want to be debt-free by a specific date, say before a child&rsquo;s admission or your own retirement? Switch on
          the target date and the tool back-solves the <strong>minimum monthly budget</strong> that clears everything in
          time, using the tax-aware order. It turns a vague goal into a concrete number you can plan around. As always,
          treat the output as a decision aid: it assumes your budget and minimum payments stay constant, and you should
          confirm prepayment-penalty terms and the 80E time limit with your lender.
        </p>
      </article>

      <ShareButton url="/calculators/debt-optimizer" title="Multi-Loan Debt Repayment Optimizer - Paisa Reality" />
      <InternalLinks title="Related Calculators" links={calcLinks} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
