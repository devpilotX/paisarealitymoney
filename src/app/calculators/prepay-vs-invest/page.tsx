import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import PrepayVsInvestClient from './PrepayVsInvestClient';

export const metadata: Metadata = {
  title: 'Home Loan Prepay vs Invest Calculator (Risk-Adjusted)',
  description:
    'Should you prepay your home loan or invest the surplus? Get a risk-adjusted, after-tax answer from a 10,000-path Monte Carlo simulation. probability of winning, breakeven return and the optimal hybrid split. Free, 100% private.',
  keywords: [
    'prepay home loan or invest', 'home loan prepayment vs investment calculator', 'should i prepay my home loan',
    'prepay vs sip calculator india', 'home loan prepayment calculator', 'invest or prepay loan',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/prepay-vs-invest' },
  openGraph: {
    title: 'Home Loan Prepay vs Invest Optimizer. Risk-Adjusted',
    description:
      'Prepay your loan or invest the surplus? A 10,000-path, after-tax, risk-adjusted answer with probability of winning, breakeven return and the best hybrid split.',
    url: 'https://paisareality.com/calculators/prepay-vs-invest',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'Should I prepay my home loan or invest the money?',
    answer:
      'It depends on three things: your effective after-tax loan rate, the return and risk of your investment, and how much risk you can stomach. Prepaying gives a guaranteed return equal to your loan rate; investing offers a higher expected return but with uncertainty. This tool runs 10,000 simulations to tell you the probability that investing beats prepaying, the return you would need to break even, and the split between the two that maximises your risk-adjusted wealth. rather than a naive "loan rate vs FD rate" comparison.',
  },
  {
    question: 'Why is prepaying called a "risk-free return"?',
    answer:
      'Every rupee of principal you prepay avoids the interest you would have paid on it. guaranteed, regardless of what markets do. So prepaying earns you a certain return equal to your loan\'s interest rate. That is why the loan rate is the benchmark the risky investment has to beat. The only adjustment is tax: if you claim the Section 24(b) interest deduction, prepaying gives up part of that deduction, which lowers the effective guaranteed rate.',
  },
  {
    question: 'How does the tax shield (Section 24(b)) change the maths?',
    answer:
      'Under the OLD regime, interest on a self-occupied home loan is deductible up to ₹2 lakh a year. That makes holding the loan cheaper, so the effective after-tax loan rate is lower than the headline rate. which makes investing relatively more attractive. The shield only applies to interest within the ₹2 lakh cap, and not at all under the NEW regime, where the deduction is disallowed. The tool computes your effective rate accordingly and shows the working.',
  },
  {
    question: 'What is the "breakeven return"?',
    answer:
      'It is the constant annual investment return at which investing the surplus ends up exactly equal to prepaying, after tax. If you believe your investment will comfortably beat the breakeven return over your horizon, investing is likely the better bet; if not, prepaying wins. It turns a complicated decision into a single number you can sanity-check against your expectations.',
  },
  {
    question: 'What does the recommended hybrid split mean?',
    answer:
      'You do not have to choose all-or-nothing. The tool evaluates every split. from 100% prepay to 100% invest. and finds the one that maximises your certainty-equivalent wealth, a risk-adjusted measure based on CRRA utility. A risk-neutral person is pushed to the higher-expected option; a risk-averse person is pushed toward a blend that protects the downside. The result is a concrete plan like "invest 60%, prepay 40%".',
  },
  {
    question: 'Is capital-gains tax included on the investment side?',
    answer:
      'Yes. For equity and equity-oriented hybrid funds, long-term gains are taxed at 12.5% above the ₹1.25 lakh yearly exemption (20% short-term if held under a year). Debt funds are taxed at your slab rate under the post-April-2023 rules. The comparison is therefore after-tax on both sides, which is essential for a fair answer.',
  },
  {
    question: 'Does this account for the risk of investing, not just the average?',
    answer:
      'Yes. that is the whole point. Instead of assuming one average return, it simulates 10,000 possible market paths and shows the full distribution of outcomes. You see the probability that investing actually beats prepaying, the pessimistic 10th-percentile outcome, and a risk-adjusted recommendation. A higher average return with high volatility may still lose to a guaranteed loan rate once risk is priced in.',
  },
  {
    question: 'Is my data sent anywhere?',
    answer:
      'No. Every calculation, including all 10,000 simulations, runs inside your browser. Your loan balance, income and tax details are never transmitted to any server, and the tool works offline once the page has loaded.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Home Loan Prepay vs Invest Optimizer',
  url: 'https://paisareality.com/calculators/prepay-vs-invest',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, 100% client-side, risk-adjusted and after-tax Monte Carlo comparison of prepaying a home loan versus investing the surplus, with breakeven return and optimal hybrid split.',
  featureList: [
    '10,000-path Monte Carlo of the investment outcome',
    'Guaranteed after-tax effective loan rate (Section 24(b) aware)',
    'Probability that investing beats prepaying',
    'Breakeven required return',
    'CRRA risk-adjusted certainty-equivalent and optimal hybrid split',
    'Full amortization with and without prepayment',
  ],
};

export default function PrepayVsInvestPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/home-loan', label: 'Home Loan Calculator' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Prepay vs Invest' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Monte Carlo · Risk-adjusted · 100% in-browser</span>
      </div>
      <h1 className="heading-1 mb-3">Home Loan Prepay vs Invest Optimizer</h1>
      <p className="text-body mb-6 max-w-3xl">
        Should you prepay your loan or invest that money? This tool simulates both paths and shows which one likely puts you ahead.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <PrepayVsInvestClient />
      </div>

      {/* SEO explainer */}
      <article className="prose max-w-3xl my-10">
        <h2>Prepay home loan or invest? The right way to decide</h2>
        <p>
          It is one of the most common money questions in India: you have a home loan and some spare cash each month, so
          should you throw it at the loan or invest it? Most calculators answer with a naive comparison. &ldquo;if your
          investment returns more than your loan rate, invest.&rdquo; That is dangerously incomplete, because it ignores
          two things that change the answer entirely: <strong>tax</strong> and <strong>risk</strong>.
        </p>

        <h2>Prepaying is a guaranteed, risk-free return</h2>
        <p>
          When you prepay ₹1 of principal, you avoid all the future interest on that rupee. That is a
          <strong> guaranteed return equal to your loan&rsquo;s interest rate</strong>. no market risk, no uncertainty.
          If your home loan is at 9%, prepaying is like earning a risk-free 9%. The only wrinkle is tax: under the old
          regime, home-loan interest on a self-occupied property is deductible up to ₹2 lakh a year under Section 24(b).
          If you claim it, holding the loan is cheaper than it looks, so the <strong>effective after-tax loan rate</strong>
          is lower. and prepaying saves you a little less. Under the new regime there is no such deduction, so the
          effective rate equals the headline rate. This tool computes that effective rate precisely and shows the working.
        </p>

        <h2>Investing is a risky return. so we simulate it</h2>
        <p>
          Equity might average 12% over the long run, but it does not deliver 12% every year. it swings. A single
          &ldquo;average return&rdquo; hides the very real chance that your investment underperforms over your specific
          horizon. So instead of one number, this tool runs a <strong>Monte Carlo simulation of 10,000 possible market
          paths</strong> using your chosen asset&rsquo;s return and volatility, applies the correct
          <strong> capital-gains tax</strong> (12.5% equity LTCG above ₹1.25 lakh, or slab rate for debt), and produces a
          full <strong>distribution of after-tax outcomes</strong>. You see not just the average, but the spread. and the
          probability that investing actually ends up ahead of the guaranteed prepay outcome.
        </p>

        <h2>Three answers, one decision</h2>
        <p>
          The optimizer reports the <strong>probability that investing beats prepaying</strong> (for example, &ldquo;73%
          chance of higher net worth&rdquo;), the <strong>breakeven return</strong> your investment must clear to tie, and
          a <strong>risk-adjusted recommendation</strong>. The risk adjustment uses CRRA utility and your risk-aversion
          setting to compute the <strong>certainty-equivalent</strong> of each strategy. the guaranteed amount you would
          accept instead of the risky one. It then finds the <strong>hybrid split</strong> (part prepay, part invest) that
          maximises that certainty-equivalent, so the advice fits how much risk you can actually live with.
        </p>

        <h2>When prepaying usually wins. and when investing does</h2>
        <p>
          Prepaying tends to win when your loan rate is high, you are in the new regime (no interest deduction), your
          investment is conservative (debt), your horizon is short, or you are highly risk-averse. Investing tends to win
          when your loan rate is low, you are claiming a large interest deduction, you are investing in equity for a long
          horizon, and you can tolerate volatility. There is also a powerful behavioural angle: prepaying is a
          &ldquo;sure thing&rdquo; that reduces stress and frees cash flow, while investing requires discipline to not
          touch the money. This tool quantifies the financial trade-off; only you can weigh the peace-of-mind side.
        </p>

        <h2>How to use the result</h2>
        <p>
          Start with the verdict and the probability. If investing wins comfortably (say, &gt;70%) and you are
          comfortable with risk, lean invest. If it is a coin-flip, or you value certainty, the recommended hybrid split
          is a sensible middle path. and prepaying part of the loan still cuts your tenure and total interest, which the
          amortization table makes concrete. Treat the output as a decision aid, not a guarantee: markets are uncertain,
          and this tool is built to quantify that uncertainty honestly rather than wish it away.
        </p>
      </article>

      <ShareButton url="/calculators/prepay-vs-invest" title="Home Loan Prepay vs Invest Optimizer - Paisa Reality" />
      <InternalLinks title="Related Calculators" links={calcLinks} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
