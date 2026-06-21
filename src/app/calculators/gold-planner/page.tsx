import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import GoldPlannerClient from './GoldPlannerClient';

export const metadata: Metadata = {
  title: 'Gold Allocation & SIP Planner. Historical Explainer (India)',
  description:
    'Understand gold\'s historical role in a portfolio and plan a disciplined SIP/cost-averaging allocation. Rolling returns, volatility, Nifty correlation, SGB vs Gold ETF vs digital gold with tax. Educational, neutral. not advice, not a price prediction.',
  keywords: [
    'how much gold in portfolio', 'gold sip calculator', 'sgb vs gold etf', 'gold allocation india',
    'gold historical returns india', 'digital gold tax', 'sovereign gold bond vs etf',
  ],
  alternates: { canonical: 'https://paisareality.com/calculators/gold-planner' },
  openGraph: {
    title: 'Gold Allocation & Cost-Averaging Explainer',
    description:
      'A neutral, educational look at gold\'s historical behaviour and how to plan a disciplined allocation via SIP. with SGB/ETF/digital-gold tax comparison. Not advice.',
    url: 'https://paisareality.com/calculators/gold-planner',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'How much of my portfolio should be in gold?',
    answer:
      'There is no single right answer, and this tool does not give personalised advice. As general education, commentators often cite a gold allocation band of roughly 5–15% of a diversified portfolio, with conservative investors sometimes discussed at the higher end and growth-tilted investors at the lower end. Gold is usually described as a diversifier. something that behaves differently from equities. rather than a primary growth engine. The right number for you depends on your goals and risk tolerance; a SEBI-registered adviser can help you decide.',
  },
  {
    question: 'Why is gold called a diversifier?',
    answer:
      'Historically, gold\'s year-to-year returns have had a low correlation with equities like the Nifty. in some years gold rose while equities fell and vice versa. A low correlation means that adding a modest gold sleeve can reduce the overall ups and downs of a portfolio. This is a historical observation about behaviour, not a promise about the future or a suggestion to buy.',
  },
  {
    question: 'Is SIP better than lump-sum for gold?',
    answer:
      'Neither is universally "better". it depends on the path prices take, which no one can predict. A SIP (investing a fixed amount regularly) spreads your purchases across many prices, so you avoid putting everything in at a single, possibly unlucky, moment. A lump-sum puts all your money to work immediately, which helps if prices rise but hurts if they fall soon after. This tool replays history so you can see how each would have behaved over past windows. as education, not a forecast.',
  },
  {
    question: 'SGB vs Gold ETF vs physical vs digital gold. what is the difference?',
    answer:
      'Sovereign Gold Bonds (SGBs) are issued by the RBI, pay 2.5% annual interest, and their capital gain is tax-free if held to maturity (8 years). but they have a long lock-in. Gold ETFs and gold funds are SEBI-regulated, low-cost and easy to trade. Physical gold carries making charges and storage/purity risk. Digital gold is convenient for small amounts but is NOT regulated by SEBI or the RBI, so platform/counterparty risk is a known concern. The tool compares their tax treatment side by side.',
  },
  {
    question: 'How is gold taxed in India?',
    answer:
      'As of FY 2025-26: long-term capital gains are taxed at 12.5% (plus 4% cess). The holding period to qualify as long-term is over 12 months for SGBs and gold ETFs/funds, and over 24 months for physical and digital gold; shorter holdings are taxed at your income-tax slab. SGB interest is taxed at slab, but the gain on redemption at maturity is exempt. Tax rules change. verify the current position before transacting.',
  },
  {
    question: 'Does this tool predict gold prices or tell me when to buy?',
    answer:
      'No. and it deliberately never will. Predicting prices or issuing buy/sell calls is regulated investment advice that requires a SEBI licence. This is a neutral, educational tool: it analyses historical data and lets you plan a disciplined allocation. Every output is framed as a historical pattern or a scenario. For personalised advice, consult a SEBI-registered investment adviser.',
  },
  {
    question: 'What does the historical data show about timing?',
    answer:
      'The tool shows that the annualised return from holding gold over a fixed number of years varied widely depending purely on the year you started. a large spread between the best and worst entry points. The lesson is that timing the market is genuinely hard, which is why disciplined, regular investing (cost-averaging) is a commonly discussed approach. This is an observation about the past, not a prediction.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Gold Allocation & Cost-Averaging Explainer',
  url: 'https://paisareality.com/calculators/gold-planner',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free, neutral, educational tool that explains gold\'s historical behaviour (returns, volatility, drawdown, Nifty correlation), backtests SIP vs lump-sum, compares instruments with tax, and shows educational allocation bands. Not investment advice or a price prediction.',
  featureList: [
    'Historical gold returns, volatility and max drawdown',
    'Correlation with the Nifty (diversification)',
    'Rolling returns and entry-timing spread',
    'SIP vs lump-sum historical backtest',
    'SGB / ETF / physical / digital gold tax comparison',
    'Educational allocation bands by risk profile',
  ],
};

export default function GoldPlannerPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
    { href: '/calculators/tax-harvesting', label: 'Tax-Loss Harvesting' },
    { href: '/gold-rate', label: 'Today\'s Gold Rate' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Gold Planner' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Educational · Historical · Not advice</span>
      </div>
      <h1 className="heading-1 mb-3">Gold Allocation &amp; Cost-Averaging Explainer</h1>
      <p className="text-body mb-6 max-w-3xl">
        A <strong>neutral, educational</strong> look at the role gold has played in a portfolio. and how to plan a
        disciplined allocation through SIP/cost-averaging. It analyses <strong>historical</strong> returns, volatility,
        drawdowns and correlation with the Nifty, replays SIP vs lump-sum, and compares SGB, Gold ETF, physical and digital
        gold with their tax. It does <strong>not</strong> predict prices or tell you when to buy or sell.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <GoldPlannerClient />
      </div>

      <article className="prose max-w-3xl my-10">
        <h2>Understanding gold's role in an Indian portfolio</h2>
        <p>
          Gold occupies a unique place in Indian households. part tradition, part savings, part insurance against
          uncertainty. But emotion is a poor guide to portfolio construction. This explainer takes a deliberately
          <strong> neutral, historical</strong> view: what has gold actually done, how has it behaved alongside equities,
          and how might a disciplined, rules-based approach to buying it look? Nothing here is a recommendation to buy or
          sell, and nothing here predicts where prices go next. that would be regulated advice.
        </p>

        <h2>What the history shows</h2>
        <p>
          Over the years in our bundled dataset, INR gold delivered solid long-run average returns but with meaningful
          volatility and some multi-year stretches of flat or negative returns. Its correlation with the Nifty has been
          historically low. meaning gold and equities have often moved out of step. That low correlation is precisely why
          gold is so often described as a <strong>diversifier</strong>: a modest allocation can smooth a portfolio's ride
          even if gold itself is not the biggest long-term grower. These are observations about the past, presented to help
          you understand behaviour. not forecasts.
        </p>

        <h2>Why timing is hard. and what to do about it</h2>
        <p>
          One of the clearest lessons in the data is how much your outcome depended on <em>when</em> you happened to start.
          The annualised return over a fixed holding period varied dramatically between the luckiest and unluckiest entry
          years. Since no one can reliably pick the bottom, many investors use <strong>cost-averaging</strong>. investing a
          fixed amount at regular intervals. to spread purchases across many prices and remove the pressure of timing.
          This tool replays how a yearly SIP would have compared with a single lump-sum across past windows, so you can see
          the trade-off for yourself.
        </p>

        <h2>Four ways to hold gold, and how they are taxed</h2>
        <p>
          <strong>Sovereign Gold Bonds (SGBs)</strong> are RBI-issued, pay 2.5% annual interest, and their redemption gain
          at maturity is tax-free. attractive for long horizons, though they lock your money up. <strong>Gold ETFs and
          gold funds</strong> are SEBI-regulated, cheap and liquid, and track the gold price closely. <strong>Physical
          gold</strong> carries making charges and storage and purity risks. <strong>Digital gold</strong> is convenient
          for small, frequent purchases but is <strong>not regulated by SEBI or the RBI</strong>, so platform and
          counterparty risk are real considerations that regulators have flagged. On tax: long-term gains are 12.5% (plus
          cess), with the long-term threshold being 12 months for SGBs and ETFs and 24 months for physical and digital
          gold; shorter holdings are taxed at your slab. The comparison table lays this out side by side.
        </p>

        <h2>Building a disciplined plan</h2>
        <p>
          A sensible, education-first approach looks like this: decide a target gold allocation band that suits your overall
          risk profile (commonly-cited ranges are shown above), choose an instrument that matches your horizon and
          convenience, invest steadily through a SIP rather than trying to time entries, and rebalance occasionally so gold
          neither balloons nor disappears from your mix. This tool helps you frame each of those choices with historical
          context. It remains your decision. and for personalised guidance, a SEBI-registered investment adviser is the
          right port of call. Gold prices can fall as well as rise, and the past is not a guarantee of the future.
        </p>
      </article>

      <ShareButton url="/calculators/gold-planner" title="Gold Allocation & Cost-Averaging Explainer - Paisa Reality" />
      <InternalLinks title="Related" links={calcLinks} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
