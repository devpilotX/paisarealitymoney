import { pageMetadata } from '@/lib/seo';
import { datasetSchema } from '@/lib/schema';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';
import LastReviewed from '@/components/LastReviewed';
import { formatDate } from '@/lib/constants';
import {
  EPF_NOTIFIED,
  EPF_RATE_PCT,
  EPF_RATE_YEAR,
  RBI_NEXT_MPC,
  RBI_RATES,
  RBI_RATES_AS_OF,
  RBI_STANCE,
  SMALL_SAVINGS,
  SMALL_SAVINGS_ANNOUNCED,
  SMALL_SAVINGS_NEXT_REVISION,
  SMALL_SAVINGS_QUARTER,
} from '@/lib/policy-rates';

export const metadata = pageMetadata({
  title: 'PPF, SSY, NSC, SCSS Interest Rates Jul-Sep 2026 + Repo Rate',
  description:
    'Official small savings interest rates for July to September 2026: PPF 7.1%, SSY 8.2%, SCSS 8.2%, NSC 7.7%, KVP, post office deposits. Plus the current RBI repo rate and EPF rate, with tax notes.',
  path: '/interest-rates',
  keywords: [
    'ppf interest rate 2026', 'sukanya samriddhi interest rate', 'scss interest rate', 'nsc interest rate',
    'post office interest rates 2026', 'small savings scheme rates', 'repo rate today', 'epf interest rate',
  ],
});

const FAQS = [
  {
    question: 'What is the PPF interest rate right now?',
    answer:
      'PPF pays 7.1% per annum for the July to September 2026 quarter, compounded yearly. The government reviews small savings rates every quarter; PPF has been at 7.1% since April 2020. PPF is EEE: the deposit gets a Section 80C deduction, and both interest and maturity are completely tax-free.',
  },
  {
    question: 'Which small savings scheme pays the highest interest?',
    answer:
      'Sukanya Samriddhi Yojana and the Senior Citizens Savings Scheme both pay 8.2%, the highest among small savings schemes this quarter. SSY is only for a girl child under 10, and SCSS is only for those 60 and above (55+ for certain retirees). For everyone else, NSC at 7.7% and the 5-year Post Office Time Deposit at 7.5% are the highest widely available options.',
  },
  {
    question: 'When do these rates change next?',
    answer:
      'Small savings rates are notified quarterly by the Finance Ministry. The current rates apply from 1 July to 30 September 2026 and were left unchanged for the ninth straight quarter. The next revision, if any, takes effect on 1 October 2026. We update this page each quarter on announcement day.',
  },
  {
    question: 'What is the RBI repo rate and why does it matter to me?',
    answer:
      'The repo rate, currently 5.25%, is the rate at which banks borrow from the RBI. Most floating-rate home loans are directly linked to it, so when the repo rate falls your EMI falls at the next reset, and when it rises your EMI rises. FD rates also loosely track it. The next MPC meeting is on 3 to 5 August 2026.',
  },
  {
    question: 'Is the EPF rate better than PPF?',
    answer:
      'EPF pays 8.25% for FY 2025-26 versus PPF at 7.1%, and both are tax-free within limits, so EPF is the better rate. But EPF is available only to salaried employees through their employer, while PPF is open to everyone. Many people use both: EPF fills automatically from salary, and PPF adds a personal, flexible tax-free bucket.',
  },
  {
    question: 'Are small savings schemes safe?',
    answer:
      'Yes, they carry an explicit sovereign guarantee: the Government of India backs every rupee of principal and promised interest. That is stronger than bank deposit insurance, which covers up to Rs 5 lakh per bank. The trade-off is lock-ins and deposit limits on most schemes.',
  },
];

export default function InterestRatesPage(): React.ReactElement {
  const relatedLinks = [
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/fd', label: 'FD Calculator' },
    { href: '/bank-rates/fd-rates', label: 'Bank FD Rates Comparison' },
    { href: '/calculators/real-return', label: 'Real Return Checker' },
    { href: '/guides/ppf-vs-nps', label: 'PPF vs NPS Guide' },
    { href: '/guides/fd-vs-rd', label: 'FD vs RD Guide' },
  ];

  const ldSchema = datasetSchema({
    name: 'Government Small Savings and RBI Policy Interest Rates',
    description: 'Quarterly small savings scheme interest rates (PPF, SSY, SCSS, NSC, KVP, post office deposits), RBI policy rates, and the EPF rate for India.',
    path: '/interest-rates',
  });

  return (
    <div className="container-main py-6">
      <script id="rates-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSchema) }} />
      <Breadcrumb items={[{ label: 'Interest Rates' }]} />
      <h1 className="heading-1 mb-2">Government Interest Rates: Small Savings, Repo Rate, EPF</h1>
      <LastReviewed date="2026-07-03" className="mb-2" />
      <p className="text-body mb-2 max-w-3xl">
        Every government-set rate that matters to your money, on one page: the quarterly small savings rates
        (PPF, SSY, SCSS, NSC, KVP, post office deposits), the RBI policy rates your home loan tracks, and the
        EPF rate. Updated on announcement day, every quarter.
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Small savings rates for {SMALL_SAVINGS_QUARTER}, announced {formatDate(SMALL_SAVINGS_ANNOUNCED)} · next
        revision {formatDate(SMALL_SAVINGS_NEXT_REVISION)} ·{' '}
        <Link href="/methodology" className="underline hover:text-gray-700">How we verify data</Link>
      </p>

      <AdBanner format="horizontal" />

      <div className="overflow-x-auto my-8">
        <h2 className="heading-2 mb-4">Small savings scheme rates: {SMALL_SAVINGS_QUARTER}</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Scheme</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Rate (p.a.)</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden sm:table-cell">Compounding</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tax treatment</th>
            </tr>
          </thead>
          <tbody>
            {SMALL_SAVINGS.map((s) => (
              <tr key={s.name} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">{s.name}</span>
                  {s.note && <span className="block text-xs text-gray-500 mt-0.5">{s.note}</span>}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-primary">{s.ratePct.toFixed(1)}%</td>
                <td className="py-3 px-4 text-sm text-gray-600 hidden sm:table-cell">{s.compounding}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{s.taxNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InArticleAd />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        <div className="overflow-x-auto">
          <h2 className="heading-2 mb-4">RBI policy rates</h2>
          <p className="text-xs text-gray-500 mb-3">
            As of the {formatDate(RBI_RATES_AS_OF)} MPC outcome · stance: {RBI_STANCE} · next meeting {RBI_NEXT_MPC}
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rate</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody>
              {RBI_RATES.map((r) => (
                <tr key={r.name} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{r.name}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{r.note}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{r.ratePct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="heading-2 mb-4">EPF rate</h2>
          <div className="card">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Employees&apos; Provident Fund, {EPF_RATE_YEAR}</p>
            <p className="text-3xl font-bold text-primary mb-2">{EPF_RATE_PCT}%</p>
            <p className="text-sm text-gray-600">
              Notified by the EPFO on {formatDate(EPF_NOTIFIED)}, unchanged for the third straight year. Interest
              is calculated on your monthly running balance and credited once a year. Tax-free within the Rs 2.5
              lakh per year contribution limit (Rs 5 lakh where the employer does not contribute).
            </p>
          </div>
        </div>
      </div>

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How to read this page</h2>
        <p className="text-body mb-4">
          These are the only interest rates in India set directly by the government, which makes them the honest
          benchmark for every other offer you see. If a savings plan, endowment policy, or &quot;guaranteed
          scheme&quot; cannot beat PPF&apos;s 7.1% tax-free, it needs a very good reason to get your money. Run
          any such pitch through our <Link href="/calculators/real-return" className="link-internal">Real Return
          Checker</Link> before signing.
        </p>
        <p className="text-body mb-4">
          The repo rate matters most to borrowers: floating-rate home loans reset with it. The small savings
          rates matter most to savers, and unlike bank FD rates they cannot be cut mid-tenure once you have
          invested: your rate is locked at entry for the full term on NSC, SCSS, KVP, and time deposits. PPF and
          SSY are the exceptions; their rate floats with the quarterly announcement.
        </p>
      </article>

      <ShareButton url="/interest-rates" title="Government Interest Rates: Small Savings, Repo, EPF" />
      <InternalLinks title="Use these rates" links={relatedLinks} columns={3} />
      <FAQ items={FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
