import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import RetirementOptimizerClient from './RetirementOptimizerClient';

export const metadata: Metadata = {
  title: 'Retirement Corpus & Withdrawal Optimizer (Monte Carlo)',
  description:
    'Find the corpus you need to retire in India, the monthly SIP to get there, and a safe withdrawal plan. using a 10,000-path Monte Carlo simulation, not a single average return. 100% free and private.',
  keywords: [
    'retirement calculator india', 'retirement corpus calculator', 'how much to retire in india',
    'monte carlo retirement', 'safe withdrawal rate india', 'FIRE calculator india', 'SIP for retirement',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/retirement-optimizer' },
  openGraph: {
    title: 'Retirement Corpus & Withdrawal Optimizer. Monte Carlo',
    description:
      'How much do you need to retire? Solve your corpus, SIP and safe withdrawal with a 10,000-path simulation. Free, private, runs in your browser.',
    url: 'https://paisareality.com/calculators/retirement-optimizer',
    type: 'website',
  },
};

const RETIREMENT_FAQS = [
  {
    question: 'How much corpus do I need to retire in India?',
    answer:
      'It depends on your retirement-age expenses, how long you expect to live, and inflation. A common rule of thumb is 25 to 30 times your annual expense, but that hides risk. This tool runs 10,000 simulations of market returns to find the corpus that funds your inflation-adjusted spending with your chosen confidence level. for example, a corpus that lasts to age 90 in at least 90% of simulated futures. Because medical costs in India inflate faster than general prices, the figure is usually higher than simple rules suggest.',
  },
  {
    question: 'Why use Monte Carlo instead of a single average return?',
    answer:
      'A single average return assumes your portfolio grows by the same percentage every year. Real markets do not. they swing. Two retirees with the same average return can have completely different outcomes depending on the ORDER of returns. A crash in the first few years of retirement, while you are also withdrawing money, can permanently cripple a portfolio. This is called sequence-of-returns risk. Monte Carlo simulation models thousands of possible return sequences, so it reveals the probability of success rather than a single, falsely precise number.',
  },
  {
    question: 'What is sequence-of-returns risk?',
    answer:
      'It is the danger that poor returns arrive early in retirement. If your portfolio falls 30% in year one and you also withdraw your living expenses, you are selling assets at depressed prices and have less capital left to recover when markets rebound. The same set of returns in a different order. good years first. can leave you far wealthier. Averages completely hide this. This optimizer captures it by simulating each year in sequence across thousands of paths.',
  },
  {
    question: 'What does "success probability" mean here?',
    answer:
      'It is the percentage of simulated futures in which your money lasts all the way to your planning age (for example 90, 95 or 100) without ever hitting zero. A 90% success probability means that in 9 out of 10 simulated market histories, you never run out. There is no universally "safe" number, but most planners aim for 85 to 95%. Higher confidence requires a larger corpus or lower spending.',
  },
  {
    question: 'What is a glide path and why does it matter?',
    answer:
      'A glide path gradually shifts your portfolio from growth assets (equity) toward stability (debt) as you age, so a market crash near or during retirement does less damage. This tool lets you pick a rule such as "equity % = 100 − age", a custom linear de-risking to a floor, or a fixed allocation. De-risking too aggressively can leave you exposed to inflation over a 30-year retirement, so the optimizer lets you set a minimum equity floor.',
  },
  {
    question: 'Does this tool model EPF and NPS?',
    answer:
      'Yes, optionally. EPF is accumulated at its administered rate and added to your tax-free corpus at retirement. For NPS, the tool applies the PFRDA rule that at least 40% of the corpus must buy an annuity while up to 60% can be withdrawn tax-free. the 40% annuity is converted into a fixed annual pension that reduces how much you must withdraw from your own corpus.',
  },
  {
    question: 'Is my financial data sent anywhere?',
    answer:
      'No. Every calculation runs entirely inside your browser using JavaScript. including all 10,000 Monte Carlo paths. Your age, savings, income and expenses are never transmitted to any server or third party. You can even use the tool offline once the page has loaded.',
  },
  {
    question: 'Are the historical return figures official?',
    answer:
      'No. The optional "bootstrap" mode uses an approximate, rounded dataset of past Indian equity, debt and gold returns compiled for educational modelling. It is clearly labelled with an "as of" date and should be verified against official sources (NSE, CCIL, IBJA) before you rely on it. The default engine uses an editable normal-distribution model so you can plug in your own return and volatility assumptions.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Retirement Corpus & Withdrawal Optimizer',
  url: 'https://paisareality.com/calculators/retirement-optimizer',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, 100% client-side Monte Carlo retirement planner for India that computes required corpus, required SIP and a safe withdrawal strategy.',
  featureList: [
    '10,000-path Monte Carlo simulation',
    'Required corpus and required SIP solver',
    'Success probability and percentile fan chart',
    'Sequence-of-returns risk modelling',
    'Glide path and asset allocation',
    'Separate general and medical inflation',
    'Optional EPF and NPS modelling',
  ],
};

export default function RetirementOptimizerPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/nps', label: 'NPS Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/salary-optimizer', label: 'Salary Structure Optimizer' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Retirement Optimizer' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Monte Carlo · 100% in-browser</span>
      </div>
      <h1 className="heading-1 mb-3">Retirement Corpus &amp; Withdrawal Optimizer</h1>
      <p className="text-body mb-6 max-w-3xl">
        Find out how much you need to retire and whether you are on track. Runs thousands of simulations to show you real probabilities, not just one guess.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <RetirementOptimizerClient />
      </div>

      {/* ---------------- SEO explainer (600+ words) ---------------- */}
      <article className="prose max-w-3xl my-10">
        <h2>How much money do you really need to retire in India?</h2>
        <p>
          The honest answer is: it depends on your spending, your lifespan, inflation, and. crucially. the luck of the
          markets during your retirement. The <strong>Retirement Corpus &amp; Withdrawal Optimizer</strong> replaces guesswork
          and oversimplified rules of thumb with a rigorous simulation that mirrors how real portfolios behave. Instead of
          assuming a flat 12% every year, it draws a different return for every year of your life, thousands of times over,
          and reports how often your plan survives.
        </p>

        <h2>Why averages lie: sequence-of-returns risk</h2>
        <p>
          Imagine two people who both earn an <em>average</em> of 10% a year over their retirement. The first enjoys strong
          early years and a crash later; the second suffers a crash in year one and recovers afterwards. With identical
          average returns, the second person can run out of money a decade earlier. because they were forced to sell
          investments at low prices to fund expenses, leaving less capital to recover. This is
          <strong> sequence-of-returns risk</strong>, and it is the single biggest reason average-return calculators are
          dangerous for retirees. Because this optimizer simulates each year in order across 10,000 paths, the damage of an
          early crash shows up naturally in the results. you can literally see the 10th-percentile path run out years before
          the median.
        </p>

        <h2>Accumulation: turning a SIP into a corpus</h2>
        <p>
          During your working years, the tool compounds your existing savings plus a monthly SIP that can step up every year
          (most people&apos;s incomes. and therefore investments. grow over time). Each year&apos;s return is drawn from
          your chosen asset mix of equity, debt and gold, blended by a <strong>glide path</strong> that gradually de-risks as
          you approach retirement. In the deterministic, zero-volatility case, the engine reproduces the standard
          monthly-SIP future-value formula to the rupee; with volatility switched on, you see the full range of outcomes,
          not just the average.
        </p>

        <h2>Decumulation: making the corpus last</h2>
        <p>
          After you retire, the tool withdraws your living expenses every year, growing them with inflation. India has a
          peculiar challenge here: <strong>medical inflation</strong> (often 10 to 14%) runs well ahead of general inflation
          (around 6%), so the tool lets you split your expenses and inflate the medical share faster. Any part-time or rental
          income you expect is netted off, and. if you switch them on. EPF and NPS are added, with the NPS 60% tax-free
          lump sum and compulsory 40% annuity handled per PFRDA rules. A plan &ldquo;succeeds&rdquo; if the corpus never hits
          zero before your planning age.
        </p>

        <h2>Three answers, one simulation</h2>
        <p>
          The optimizer solves the problem from every angle. It reports the <strong>required corpus</strong> at retirement
          (and its value in today&apos;s money), back-solves the <strong>monthly SIP</strong> needed to hit your target
          success probability using a binary search, and computes a <strong>safe monthly withdrawal</strong> your projected
          corpus can sustain. A sensitivity table then stress-tests your plan against returns that are 1% lower, inflation
          that is 1% higher, and a life that is five years longer. because a plan that only works under perfect assumptions
          is not a plan.
        </p>

        <h2>How to use the results</h2>
        <p>
          Aim for a success probability you are comfortable with. most planners target 85 to 95%. If your number is lower, you
          have four levers: invest more each month, spend less in retirement, retire later, or take a little more equity risk
          (within reason). If your number is very high, you may be over-saving and could afford to retire earlier or enjoy
          more today. Treat the output as a decision-making aid and a conversation starter with a qualified adviser. not as
          a guarantee. Markets are uncertain, and this tool is designed to quantify that uncertainty, not pretend it away.
        </p>
      </article>

      <ShareButton url="/calculators/retirement-optimizer" title="Retirement Corpus & Withdrawal Optimizer - Paisa Reality" />
      <InternalLinks title="Related Calculators" links={calcLinks} columns={2} />
      <FAQ items={RETIREMENT_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
