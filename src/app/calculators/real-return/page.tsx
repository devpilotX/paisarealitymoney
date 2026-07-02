import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';
import LastReviewed from '@/components/LastReviewed';
import { pageMetadata } from '@/lib/seo';
import RealReturnClient from './RealReturnClient';

export const metadata = pageMetadata({
  title: 'Real Return Checker: What Is That Policy Actually Paying?',
  description:
    'Paste any investment pitch — LIC endowment, money-back plan, ULIP, "double your money" scheme — and see its REAL annual return (XIRR), compared with FD, PPF, and inflation. Free, private, educational.',
  path: '/calculators/real-return',
  keywords: [
    'real return calculator', 'endowment policy return calculator', 'lic policy irr calculator',
    'money back policy real return', 'is my lic policy worth it', 'double your money scheme check',
    'xirr calculator india', 'investment scam checker india',
  ],
});

const FAQS = [
  {
    question: 'What is the "real return" of an investment offer?',
    answer:
      'It is the single annual growth rate (the internal rate of return, or XIRR) that connects everything you pay with everything you receive, respecting the timing of each payment. Agents quote totals like "pay 6 lakh, get 14 lakh" because totals sound impressive. The real return converts that into a comparable annual percentage — and a plan that returns 1.9x your money over 20 years is earning less than 5% a year, which is below inflation.',
  },
  {
    question: 'Why do money-back and endowment policies look better than they are?',
    answer:
      'Three reasons. First, the pitch quotes the total payout, not the annual rate. Second, the payouts arrive far in the future, when rupees are worth less — 14 lakh in 2046 does not buy what 14 lakh buys today. Third, part of your premium pays for insurance cover and commissions rather than earning returns. None of this is illegal, but you deserve to see the actual annual rate before signing.',
  },
  {
    question: 'Is this tool saying insurance is bad?',
    answer:
      'No. Life insurance cover is essential if anyone depends on your income. The question this tool helps you ask is whether a bundled savings-plus-insurance product is paying you fairly for the savings part. Many people find that a pure term insurance plan (large cover, low premium) plus a separate investment (PPF, index funds) gives both more protection and more return. That comparison is exactly what the benchmark table shows.',
  },
  {
    question: 'The agent showed me an illustration with 8% returns. Is that guaranteed?',
    answer:
      'Usually not. IRDAI allows insurers to show illustrations at assumed rates (commonly 4% and 8%), and the actual guaranteed portion is listed separately in the benefit illustration. Ask specifically: "Which numbers in this document are contractually guaranteed?" Type only those guaranteed numbers into this tool to see the guaranteed real return.',
  },
  {
    question: 'Someone promised to double my money in 3 to 5 years. Is that possible?',
    answer:
      'Doubling in 3 years means a 26% annual return; in 5 years, about 15%. No regulated entity in India guarantees returns anywhere near that. Offers like this are the classic shape of Ponzi schemes and chit fraud, where early investors are paid from later investors\' money until the scheme collapses. Before paying anyone, check whether they are registered with RBI, SEBI, or IRDAI, and remember: a guarantee is only as good as the entity giving it.',
  },
  {
    question: 'Does this tool store my policy details?',
    answer:
      'No. All calculations run inside your browser. Nothing you type is sent to our servers, stored, or shared. You can even use the tool offline once the page has loaded.',
  },
  {
    question: 'What is XIRR and why should I trust it over the agent\'s numbers?',
    answer:
      'XIRR is the standard method used by mutual funds, banks, and auditors worldwide to measure the return of irregular cash flows. It is pure arithmetic — the same formula Excel uses. We simply apply it to the offer as pitched to you. If the agent\'s numbers are right, the XIRR is right; the difference is that XIRR cannot be dressed up.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Real Return Checker',
  url: 'https://paisareality.com/calculators/real-return',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any (web browser)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  description:
    'A free educational tool that computes the true annual return (XIRR) of any investment offer — endowment policies, money-back plans, or lump-sum "double your money" pitches — and compares it with savings, FD, PPF, inflation, and index funds.',
  featureList: [
    'True annual return (XIRR) of any offer',
    'Endowment, money-back, and lump-sum pitch shapes',
    'Comparison with savings, FD, PPF, inflation, and Nifty benchmarks',
    'Inflation-adjusted buying power of the payout',
    'Mis-selling and fraud red-flag education',
    'Runs fully in your browser — details never leave your device',
  ],
};

export default function RealReturnPage(): React.ReactElement {
  const calcLinks = [
    { href: '/calculators/prepay-vs-invest', label: 'Prepay vs Invest Optimizer' },
    { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/score', label: 'Money Health Score' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Real Return Checker' }]} />

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">★ Smart Tool</span>
        <span className="text-xs text-gray-500">Educational · Private · Not advice</span>
      </div>
      <h1 className="heading-1 mb-2">Real Return Checker</h1>
      <LastReviewed date="2026-07-02" className="mb-3" />
      <p className="text-body mb-6 max-w-3xl">
        &quot;Pay ₹50,000 a year, get ₹14 lakh!&quot; sounds amazing — until you learn it is a 4.8% annual return,
        less than inflation. Type in any offer exactly as it was pitched to you and see the one number the pitch
        never mentions.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <RealReturnClient />
      </div>

      <article className="prose max-w-3xl my-10">
        <h2>The trick behind every mis-sold policy</h2>
        <p>
          India&apos;s most widely sold savings products — traditional endowment and money-back insurance plans —
          are pitched with totals: <em>&quot;invest 6 lakh in total, receive 14 lakh!&quot;</em>. Totals feel large
          because the money comes back decades later. The honest measure is the <strong>annual rate</strong> that
          links your payments to your payouts, respecting when each one happens. That rate is called the internal
          rate of return (IRR or XIRR), it is the same arithmetic Excel and mutual funds use, and for typical
          traditional plans it lands between 4% and 6% — below inflation, and well below PPF&apos;s guaranteed,
          tax-free 7.1%.
        </p>

        <h2>Why nobody shows you this number</h2>
        <p>
          Commissions on traditional insurance plans can exceed a quarter of your first-year premium, which funds
          an enormous sales force with a strong incentive to keep the conversation on totals, &quot;guaranteed
          additions&quot;, and emotional security — anything but the annual rate. Regulators require a benefit
          illustration, but it arrives as a dense table at signing time. This tool exists so you can check the
          math <em>before</em> that moment, in ten seconds, from a WhatsApp forward if needed.
        </p>

        <h2>The three questions that protect you</h2>
        <p>
          <strong>1. What is the real annual return?</strong> Type the offer in above. If it is below 6%, your
          money is shrinking in buying-power terms. <strong>2. Which numbers are guaranteed?</strong> Insist on
          seeing the guaranteed column of the benefit illustration, not the &quot;projected at 8%&quot; column.
          <strong> 3. Who regulates the entity making the promise?</strong> Banks (RBI), mutual funds and brokers
          (SEBI), insurers (IRDAI). A &quot;guaranteed 20% scheme&quot; from an unregulated outfit is not an
          investment — it is a queue to be repaid with the next victim&apos;s money, until the queue stops.
        </p>

        <h2>If you already own a low-return policy</h2>
        <p>
          Do not panic-surrender: traditional plans have brutal surrender penalties in early years, and if the
          policy is old, its remaining years may effectively earn a better rate than its lifetime average. Options
          people discuss with their advisers include making the policy paid-up (stop paying, keep reduced
          benefits), surrendering after the penalty window shrinks, or simply continuing while directing new money
          elsewhere. The right move depends on your policy&apos;s exact numbers — take the guaranteed surrender and
          paid-up values from the insurer and run them through this tool to compare. For personal decisions,
          consult a fee-only, SEBI-registered adviser.
        </p>
      </article>

      <ShareButton url="/calculators/real-return" title="Real Return Checker - see what that policy ACTUALLY pays" />
      <InternalLinks title="Related Smart Tools" links={calcLinks} columns={2} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
