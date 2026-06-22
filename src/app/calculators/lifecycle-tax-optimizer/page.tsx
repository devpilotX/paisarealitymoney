import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import LifecycleTaxOptimizerClient from './LifecycleTaxOptimizerClient';

export const metadata: Metadata = {
  title: 'Old vs New Tax Regime: Multi-Year Optimizer (Lifetime)',
  description:
    'Old or new tax regime. which saves more over your whole career, not just this year? This optimizer projects both regimes year-by-year as your income, rent, home loan and deductions change, finds your switch-over year, and minimises lifetime tax. Free, 100% private.',
  keywords: [
    'old vs new tax regime', 'which tax regime is better', 'new tax regime vs old calculator',
    'tax regime calculator india', 'lifetime tax planning', 'when to switch tax regime',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/lifecycle-tax-optimizer' },
  openGraph: {
    title: 'Multi-Year Tax Regime & Investment Optimizer',
    description:
      'Beyond a one-year old-vs-new comparison: project the optimal regime and tax-saving plan across your whole career, with the crossover year and lifetime tax NPV.',
    url: 'https://paisareality.com/calculators/lifecycle-tax-optimizer',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'Old regime or new regime. which is better?',
    answer:
      'It depends on your deductions, and it can change over your career. The new regime has lower rates and a big Section 87A rebate (income up to ₹12 lakh is tax-free), but disallows most deductions. The old regime has higher rates but lets you claim 80C, 80D, HRA and home-loan interest. With few deductions the new regime usually wins; once you have a home loan, pay significant rent, and max your 80C/80D, the old regime can pull ahead. This tool projects both for every future year and picks the cheaper each year.',
  },
  {
    question: 'Why look at multiple years instead of just this one?',
    answer:
      'Because your situation evolves. Your income rises, you might take a home loan in a few years, your parents may cross 60 (raising your 80D limit), and your rent changes. A regime that is best today may be the wrong choice in five years. By projecting your whole career and discounting future tax to its present value, this optimizer shows you the lifetime-optimal plan. and the specific year your best regime is likely to flip.',
  },
  {
    question: 'Can I actually switch regimes every year?',
    answer:
      'If you are salaried with no business income, yes. you can choose afresh each financial year when filing. If you have business or professional income, you can move to the old regime only once and your ability to switch back is restricted, so you are effectively locked in. This tool models that difference: salaried users get year-by-year switching, while business users are locked to the single regime that minimises their lifetime tax.',
  },
  {
    question: 'What is the "crossover year"?',
    answer:
      'It is the first year your projected deductions grow enough that the old regime becomes cheaper than the new one. typically when a home loan starts, rent is high, and your 80C/80D are full. Before the crossover the new regime usually wins; after it, the old regime does. Knowing the year helps you plan when to start claiming deductions and switch.',
  },
  {
    question: 'How does it handle tax-saving investments and lock-ins?',
    answer:
      'In years where the old regime is chosen, the tool recommends filling your 80C (₹1.5 lakh), 80CCD(1B) NPS (₹50,000) and 80D up to the available amount. bounded by your stated willingness to lock money up. In new-regime years those lock-ins give no tax benefit, so it recommends keeping that money liquid. It optimises for after-tax wealth, not just this year\'s tax bill.',
  },
  {
    question: 'What is NPV and why discount future tax?',
    answer:
      'A rupee of tax paid 20 years from now hurts less than a rupee paid today, because money has time value. Net present value (NPV) discounts each future year\'s tax back to today\'s money at a rate you choose, so the lifetime comparison is apples-to-apples. The optimal-switching strategy is, by construction, never worse than always-old or always-new on an NPV basis.',
  },
  {
    question: 'Are the tax rules up to date?',
    answer:
      'The tool uses FY 2025-26 / AY 2026-27 slabs, the ₹75,000 standard deduction and ₹12 lakh rebate under the new regime, and the standard old-regime deductions and caps. Tax law changes every Budget, so the engine lets these constants be overridden per year, and you should verify the current rules before filing.',
  },
  {
    question: 'Is my salary data sent anywhere?',
    answer:
      'No. The entire multi-year projection runs in your browser. Your income, rent and deduction details are never transmitted to any server, and the tool works offline once loaded.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Multi-Year Tax Regime & Investment Optimizer',
  url: 'https://paisareality.com/calculators/lifecycle-tax-optimizer',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, 100% client-side multi-year old-vs-new tax regime optimizer that projects lifetime tax, finds the crossover year and recommends a year-by-year tax-saving investment mix.',
  featureList: [
    'Year-by-year old vs new regime projection',
    'Lifetime tax NPV: always-new vs always-old vs optimal switching',
    'Crossover-year detection',
    'Salaried yearly switching vs business lock-in',
    'Recommended 80C / 80CCD(1B) / 80D mix',
    'Per-year overridable tax constants',
  ],
};

export default function LifecycleTaxOptimizerPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
    { href: '/calculators/salary-optimizer', label: 'Salary Structure Optimizer' },
    { href: '/calculators/hra', label: 'HRA Calculator' },
    { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Lifecycle Tax Optimizer' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Multi-year · Old vs New · 100% in-browser</span>
      </div>
      <h1 className="heading-1 mb-3">Multi-Year Tax Regime &amp; Investment Optimizer</h1>
      <p className="text-body mb-6 max-w-3xl">
        Compare old vs new tax regime for your exact income. See which one saves you more after all deductions.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <LifecycleTaxOptimizerClient />
      </div>

      <article className="prose max-w-3xl my-10">
        <h2>Old vs new tax regime: stop deciding one year at a time</h2>
        <p>
          The choice between India&rsquo;s old and new tax regimes is usually framed as a one-year decision: plug in this
          year&rsquo;s numbers, see which is cheaper, done. But your financial life is not static. Your salary climbs, you
          might buy a house in three years and start claiming ₹2 lakh of home-loan interest, your parents turn 60 and your
          80D limit jumps, and your rent. and therefore your HRA exemption. changes. The regime that wins today can be
          the wrong choice a few years from now. This optimizer takes the long view.
        </p>

        <h2>How the new and old regimes actually differ</h2>
        <p>
          The <strong>new regime</strong> (now the default) offers lower slab rates and a generous Section 87A rebate that
          makes total income up to ₹12 lakh tax-free, plus a ₹75,000 standard deduction. but it disallows almost every
          deduction: no 80C, no HRA, no home-loan interest on a self-occupied home. The <strong>old regime</strong> keeps
          higher rates but lets you subtract 80C (₹1.5 lakh), 80CCD(1B) NPS (₹50,000), 80D health premiums, HRA, and
          home-loan interest under Section 24(b). The trade-off is simple to state and surprisingly hard to optimise: do
          your deductions save you more than the new regime&rsquo;s lower rates and bigger rebate?
        </p>

        <h2>The crossover year</h2>
        <p>
          For most people early in their careers. renting modestly, no home loan, limited 80C. the new regime wins
          comfortably. But as deductions stack up, there is often a <strong>crossover year</strong> where the old regime
          pulls ahead and stays ahead. This tool pinpoints that year so you can plan around it: when to start a home loan,
          when to ramp up 80C and NPS contributions, and when to tell your employer to switch your TDS regime. If your
          income never generates enough deductions to cross over, it tells you that too. and saves you from locking money
          into products that give you no tax benefit.
        </p>

        <h2>Lifetime tax, not this year&rsquo;s tax</h2>
        <p>
          The tool sums the <strong>net present value</strong> of your tax across the whole horizon under three strategies:
          always-new, always-old, and optimal switching. Because a rupee paid decades from now is worth less than a rupee
          today, future tax is discounted at a rate you choose. The optimal-switching path. picking the cheaper regime
          each year. is, by construction, never worse than either fixed strategy, and the tool shows exactly how many
          rupees the optimisation is worth to you in present-value terms.
        </p>

        <h2>Salaried flexibility vs business lock-in</h2>
        <p>
          A crucial rule that generic calculators ignore: salaried taxpayers can choose their regime afresh every year,
          but those with business or professional income can switch out of the new regime only once, with limited ability
          to return. So the optimal strategy genuinely differs. This tool models salaried users with full year-by-year
          switching and business users as locked into the single regime that minimises their lifetime tax. a more honest
          answer for entrepreneurs and professionals.
        </p>

        <h2>From tax saving to wealth</h2>
        <p>
          Finally, the tool turns the decision into an action plan. In old-regime years it recommends how much to route
          into 80C, NPS 80CCD(1B) and 80D, bounded by how much money you are comfortable locking away. because a deduction
          that forces you into a product you hate is not a win. In new-regime years it tells you to keep that money liquid.
          As always, treat the output as a planning aid: tax law changes every Budget, the projections assume your
          assumptions hold, and a qualified Chartered Accountant should confirm the specifics before you file.
        </p>
      </article>

      <ShareButton url="/calculators/lifecycle-tax-optimizer" title="Multi-Year Tax Regime & Investment Optimizer - Paisa Reality" />
      <InternalLinks title="Related Calculators" links={calcLinks} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
