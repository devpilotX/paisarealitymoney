import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import TaxHarvestingClient from './TaxHarvestingClient';

export const metadata: Metadata = {
  title: 'Tax-Loss & Gain Harvesting Optimizer (₹1.25L LTCG)',
  description:
    'Before year-end, find exactly which holdings to sell to legally cut your capital-gains tax. using the ₹1.25L LTCG exemption and loss set-off rules. Free, 100% private, no login.',
  keywords: [
    'tax loss harvesting india', 'tax gain harvesting', 'ltcg 1.25 lakh exemption', 'capital gains tax saving',
    'tax harvesting calculator', 'how to save ltcg tax', 'set off capital losses',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/tax-harvesting' },
  openGraph: {
    title: 'Equity Tax-Loss & Gain Harvesting Optimizer',
    description:
      'Tells you exactly which lots to sell (and how much) to minimise capital-gains tax using the ₹1.25L LTCG exemption and loss set-off rules. Free and private.',
    url: 'https://paisareality.com/calculators/tax-harvesting',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'What is tax-loss harvesting?',
    answer:
      'Tax-loss harvesting means selling investments that are currently at a loss to "book" that loss, which you can then set off against your taxable capital gains. reducing your tax bill. In India a short-term capital loss can offset both short- and long-term gains, while a long-term capital loss can offset only long-term gains. Unused losses carry forward for up to 8 years. Because you usually want to stay invested, you simply re-buy the same holding afterwards (India has no formal wash-sale rule).',
  },
  {
    question: 'What is tax-gain harvesting, and how does the ₹1.25 lakh exemption help?',
    answer:
      'Long-term capital gains on equity are tax-free up to ₹1.25 lakh per financial year (Section 112A). Tax-gain harvesting means deliberately selling long-term winners to realise gains up to that ₹1.25 lakh limit. paying zero tax. and then re-buying. This "resets" your cost basis to the higher current price, so when you eventually sell for real, your taxable gain is smaller. Used every year, it can permanently shelter a large amount of gains from tax.',
  },
  {
    question: 'How are the set-off rules applied to minimise tax?',
    answer:
      'The tool applies the ₹1.25 lakh exemption to your long-term gains first (those rupees are already tax-free). It then uses long-term losses against any remaining taxable long-term gains, and applies short-term losses to your highest-taxed gains first. debt (slab rate), then equity short-term gains (20%), then taxable long-term gains (12.5%). because a rupee of loss saves the most tax against the highest-taxed rupee of gain. This ordering provably minimises your tax and is verified against a brute-force search.',
  },
  {
    question: 'What are the current capital-gains tax rates?',
    answer:
      'For listed equity and equity mutual funds: short-term gains (held under 12 months) are taxed at 20% under Section 111A; long-term gains (held over 12 months) are taxed at 12.5% above the ₹1.25 lakh annual exemption under Section 112A. Debt mutual funds bought on or after 1 April 2023 are taxed at your income-tax slab rate regardless of holding period. A 4% health and education cess applies on top.',
  },
  {
    question: 'My holding is just short of 12 months. should I wait?',
    answer:
      'Often, yes. If you sell an equity holding at a gain before completing 12 months, it is a short-term gain taxed at 20% with no exemption. Wait until it crosses the 12-month line and the same gain becomes long-term. taxed at just 12.5% and sheltered by the ₹1.25 lakh exemption. The tool flags holdings near the boundary and tells you how many days to wait.',
  },
  {
    question: 'Is re-buying immediately allowed in India?',
    answer:
      'Yes. Unlike the United States, India has no formal "wash-sale" rule that disallows a loss if you re-buy the same security within 30 days. So you can sell to harvest a loss or gain and re-buy immediately to maintain your position. That said, treat very high-frequency harvesting with prudence. the tax department can look at transactions that appear designed solely to avoid tax, so keep it reasonable and keep records.',
  },
  {
    question: 'Does this work for debt funds?',
    answer:
      'Partly. Debt mutual funds bought after 1 April 2023 are taxed at your slab rate with no special long-term benefit and no ₹1.25 lakh exemption, so there is no gain-harvesting advantage. However, a loss on a debt fund is still a capital loss you can set off against other gains, and the tool accounts for that.',
  },
  {
    question: 'Is my portfolio data safe?',
    answer:
      'Completely. Every calculation runs in your browser. your holdings, prices and gains are never sent to any server, and the tool works offline once loaded. There is no login and nothing is stored.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Equity Tax-Loss & Gain Harvesting Optimizer',
  url: 'https://paisareality.com/calculators/tax-harvesting',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, 100% client-side tool that classifies your equity lots as STCG/LTCG, applies India\'s loss set-off rules and the ₹1.25L LTCG exemption, and recommends exactly which lots to sell to minimise capital-gains tax and reset cost basis.',
  featureList: [
    'STCG vs LTCG lot classification (12-month boundary)',
    'Optimal STCL/LTCL set-off (verified vs brute force)',
    '₹1.25L LTCG exemption gain-harvesting',
    'Cost-basis step-up benefit',
    'Loss carry-forward (8 years)',
    'Near-boundary "wait" tips',
  ],
};

export default function TaxHarvestingPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
    { href: '/calculators/lifecycle-tax-optimizer', label: 'Multi-Year Tax Optimizer' },
    { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Tax-Loss Harvesting' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Capital gains · Optimal set-off · 100% in-browser</span>
      </div>
      <h1 className="heading-1 mb-3">Equity Tax-Loss &amp; Gain Harvesting Optimizer</h1>
      <p className="text-body mb-6 max-w-3xl">
        Find out if selling and rebuying investments can reduce your capital gains tax legally this year.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <TaxHarvestingClient />
      </div>

      <article className="prose max-w-3xl my-10">
        <h2>Tax-loss and tax-gain harvesting in India, explained</h2>
        <p>
          Two of the most underused legal tax-saving moves available to Indian investors happen at the portfolio level,
          near the end of the financial year. The first, <strong>tax-loss harvesting</strong>, turns a paper loss into a
          tax deduction. The second, <strong>tax-gain harvesting</strong>, uses the ₹1.25 lakh long-term exemption to book
          gains for free and reset your cost basis. This tool does both. and tells you the exact lots and quantities to
          sell.
        </p>

        <h2>Booking losses: the set-off rules that decide your tax</h2>
        <p>
          When you sell a holding at a loss, that capital loss can be set off against your capital gains, lowering the
          amount you are taxed on. India&rsquo;s rules are specific: a <strong>short-term capital loss</strong> can offset
          both short-term and long-term gains, but a <strong>long-term capital loss</strong> can offset only long-term
          gains. Anything you cannot use this year carries forward for up to <strong>eight years</strong>. The order in
          which you apply losses matters: to save the most tax, your flexible short-term losses should hit your
          highest-taxed gains first. debt taxed at slab, then equity short-term gains at 20%, then long-term gains at
          12.5%. This optimizer computes that order for you and has been checked against a brute-force search to confirm
          it produces the minimum possible tax.
        </p>

        <h2>The ₹1.25 lakh gift: tax-gain harvesting</h2>
        <p>
          Long-term equity gains are exempt up to ₹1.25 lakh every financial year. If you do not use that exemption, it is
          gone. <strong>Tax-gain harvesting</strong> means selling enough of your long-term winners to realise gains up to
          that limit. paying zero tax. and immediately re-buying. The re-purchase resets your cost basis to today&rsquo;s
          higher price, so your future taxable gain shrinks. Repeated every year, this quietly shelters lakhs of rupees of
          gains over an investing lifetime. The tool calculates your remaining exemption headroom and the precise quantity
          to sell from each long-term lot to fill it without crossing into taxable territory.
        </p>

        <h2>Mind the 12-month boundary</h2>
        <p>
          The single biggest avoidable mistake is selling an equity holding a few days before it completes 12 months. Do
          that at a profit and the gain is short-term, taxed at 20% with no exemption. Hold it a little longer and the same
          gain becomes long-term. taxed at just 12.5% and covered by the ₹1.25 lakh exemption. The optimizer flags every
          holding near the boundary and tells you how many days to wait, so a little patience can roughly halve your tax.
        </p>

        <h2>No wash-sale rule. but stay sensible</h2>
        <p>
          Unlike the United States, India has no formal wash-sale rule, so you can sell to harvest a loss or gain and
          re-buy the very same day to keep your position. That makes harvesting genuinely &ldquo;free&rdquo; in terms of
          staying invested. your only real costs are brokerage, STT and the bid-ask spread. Keep harvesting reasonable and
          well-documented, run the numbers here first, and confirm the specifics with a qualified Chartered Accountant
          before you place the trades.
        </p>
      </article>

      <ShareButton url="/calculators/tax-harvesting" title="Equity Tax-Loss & Gain Harvesting Optimizer - Paisa Reality" />
      <InternalLinks title="Related Calculators" links={calcLinks} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
