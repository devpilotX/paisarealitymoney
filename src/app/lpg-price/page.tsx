import type { Metadata } from 'next';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { formatINR, formatDate } from '@/lib/constants';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';

export const metadata: Metadata = {
  title: 'LPG Price Today in India - State-wise Cylinder Rates',
  description: 'Check today\'s LPG gas cylinder price. State-wise 14.2 kg domestic and 19 kg commercial cylinder rates. Updated monthly.',
  alternates: { canonical: 'https://paisareality.com/lpg-price' },
};

interface LpgRow extends RowDataPacket {
  state: string; domestic_14kg: number; commercial_19kg: number;
  subsidy_amount: number; change_amount: number; price_date: string;
}

const LPG_FAQS = [
  { question: 'What is the LPG cylinder price today?', answer: 'LPG prices vary by state. A 14.2 kg domestic cylinder costs between Rs 803 and Rs 903 depending on your state. Commercial 19 kg cylinders cost between Rs 1,770 and Rs 1,950. Prices are revised on the 1st of every month.' },
  { question: 'How often do LPG prices change?', answer: 'Oil marketing companies revise LPG prices on the 1st of every month based on international LPG rates and the rupee-dollar exchange rate. Sometimes the government absorbs price increases through subsidies.' },
  { question: 'How can I get LPG subsidy?', answer: 'LPG subsidy is provided under the PM Ujjwala Yojana for eligible households. The subsidy amount is directly transferred to your linked bank account (DBTL - Direct Benefit Transfer for LPG). You need to link your Aadhaar to your bank account and LPG connection to receive the subsidy.' },
  { question: 'What is the difference between domestic and commercial LPG?', answer: 'Domestic LPG cylinders (14.2 kg, blue color) are subsidized and meant for household cooking. Commercial cylinders (19 kg, red/orange color) are sold at market price and used by restaurants, hotels, and businesses. Using a domestic cylinder for commercial purposes is illegal.' },
];

export const revalidate = 3600;

export default async function LpgPricePage(): Promise<React.ReactElement> {
  let prices: LpgRow[] = [];
  let priceDate = '';
  try {
    prices = await query<LpgRow[]>(
      `SELECT state, domestic_14kg, commercial_19kg, subsidy_amount, change_amount, price_date
       FROM lpg_prices
       WHERE price_date = (SELECT MAX(price_date) FROM lpg_prices)
       ORDER BY state`
    );
    priceDate = prices[0]?.price_date ? formatDate(prices[0].price_date) : 'This month';
  } catch (error) { console.error('Failed to fetch LPG prices:', error); }

  const priceLinks = [
    { href: '/gold-rate', label: 'Gold Rate Today' },
    { href: '/silver-rate', label: 'Silver Rate Today' },
    { href: '/petrol-price', label: 'Petrol Price Today' },
    { href: '/diesel-price', label: 'Diesel Price Today' },
    { href: '/calculators', label: 'Financial Calculators' },
    { href: '/schemes', label: 'Government Schemes' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'LPG Price Today' }]} />
      <h1 className="heading-1 mb-2">LPG Gas Cylinder Price Today in India</h1>
      <p className="text-body mb-6">State-wise LPG cylinder rates as of {priceDate}. Prices revised monthly.</p>
      <AdBanner format="horizontal" />

      {prices.length > 0 && (
        <div className="overflow-x-auto my-8">
          <h2 className="heading-2 mb-4">LPG Cylinder Price by State</h2>
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">State</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Domestic 14.2 kg</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Commercial 19 kg</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
            </tr></thead>
            <tbody>
              {prices.map((row) => {
                const cc = row.change_amount > 0 ? 'text-green-600' : row.change_amount < 0 ? 'text-red-600' : 'text-gray-500';
                return (
                  <tr key={row.state} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{row.state}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.domestic_14kg)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.commercial_19kg)}</td>
                    <td className={`py-3 px-4 text-right text-sm font-medium ${cc}`}>
                      {row.change_amount === 0 ? 'No change' : `${row.change_amount > 0 ? '+' : ''}${formatINR(row.change_amount)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">Understanding LPG Prices in India</h2>
        <p className="text-body mb-4">LPG (Liquefied Petroleum Gas) is the primary cooking fuel for over 31 crore Indian households. The price of an LPG cylinder in India depends on the international price of butane and propane (the two main components of LPG), the exchange rate of the Indian rupee, and state-level taxes.</p>
        <p className="text-body mb-4">Oil marketing companies (Indian Oil, Bharat Petroleum, Hindustan Petroleum) revise LPG prices on the 1st of every month. The central government can choose to absorb part of any price increase through the excise duty mechanism.</p>
        <p className="text-body mb-4">Under the PM Ujjwala Yojana, the government provides free LPG connections to women from Below Poverty Line (BPL) families. As of 2026, over 10 crore connections have been provided under this scheme. Eligible beneficiaries also receive a subsidy on each refill, which is directly transferred to their bank account.</p>
        <h2 className="heading-2 mt-8 mb-4">How to Book an LPG Refill</h2>
        <p className="text-body mb-4">You can book an LPG cylinder refill through multiple channels: call your distributor directly, use the IVRS number (17 digits on your cylinder), send an SMS, or use the MyHP Gas, IndianOil One, or Bharat Gas apps. Online booking through UMANG app is also available. Delivery usually takes 1 to 3 days depending on your area.</p>
      </article>

      <ShareButton url="/lpg-price" title="LPG Price Today in India" />
      <InternalLinks title="Related Price Pages" links={priceLinks} columns={3} />
      <FAQ items={LPG_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}