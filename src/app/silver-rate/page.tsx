import type { Metadata } from 'next';
import Link from 'next/link';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { CITIES } from '@/lib/cities';
import { formatINR, formatDate } from '@/lib/constants';
import Breadcrumb from '@/components/Breadcrumb';
import CitySelector from '@/components/CitySelector';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';

export const metadata: Metadata = {
  title: 'Silver Rate Today in India - Live Price per Gram & Kg',
  description: 'Check today\'s silver rate in India. Live silver prices per gram and per kg for 50+ cities. Updated daily from market sources.',
  alternates: { canonical: 'https://paisareality.com/silver-rate' },
};

interface SilverRow extends RowDataPacket {
  city_name: string; city_slug: string; state: string;
  silver_per_gram: number; silver_per_kg: number;
  change_amount: number; change_percent: number; price_date: string;
}

const SILVER_FAQS = [
  { question: 'What is the silver rate in India today?', answer: 'Silver prices in India change daily. Check this page for the latest per gram and per kg silver rates for 50+ cities. Prices are updated every morning based on commodity market data.' },
  { question: 'Why do silver prices vary by city?', answer: 'Silver prices differ across cities due to local taxes, transportation costs, and demand. The differences are usually Rs 0.50 to Rs 2 per gram between cities.' },
  { question: 'Is silver a good investment?', answer: 'Silver is considered a hedge against inflation and economic uncertainty. It is more volatile than gold but also more affordable. Silver has industrial uses (electronics, solar panels) which can drive demand. Consult a financial advisor before investing.' },
];

export const revalidate = 900;

export default async function SilverRatePage(): Promise<React.ReactElement> {
  let prices: SilverRow[] = [];
  let priceDate = '';
  try {
    prices = await query<SilverRow[]>(
      `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
              sp.silver_per_gram, sp.silver_per_kg, sp.change_amount, sp.change_percent, sp.price_date
       FROM silver_prices sp JOIN cities c ON sp.city_id = c.id
       WHERE sp.price_date = (SELECT MAX(price_date) FROM silver_prices)
       ORDER BY c.is_metro DESC, c.name LIMIT 50`
    );
    priceDate = prices[0]?.price_date ? formatDate(prices[0].price_date) : 'Today';
  } catch (error) { console.error('Failed to fetch silver prices:', error); }

  const cityLinks = CITIES.slice(0, 20).map((c) => ({ href: `/silver-rate/${c.slug}`, label: `Silver Rate in ${c.name}`, description: c.state }));

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Silver Rate Today' }]} />
      <h1 className="heading-1 mb-2">Silver Rate Today in India</h1>
      <p className="text-body mb-6">Live silver prices per gram and per kg for {priceDate}. Updated daily.</p>
      <AdBanner format="horizontal" />
      <div className="my-6"><CitySelector basePath="/silver-rate" placeholder="Search city for silver rate..." /></div>

      {prices.length > 0 && (
        <div className="overflow-x-auto my-8">
          <h2 className="heading-2 mb-4">Silver Price Today Across Indian Cities</h2>
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">City</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Per Gram</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Per Kg</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
            </tr></thead>
            <tbody>
              {prices.map((row) => {
                const cc = row.change_amount > 0 ? 'text-green-600' : row.change_amount < 0 ? 'text-red-600' : 'text-gray-500';
                const ar = row.change_amount > 0 ? '\u25B2' : row.change_amount < 0 ? '\u25BC' : '';
                return (
                  <tr key={row.city_slug} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-3 px-4"><Link href={`/silver-rate/${row.city_slug}`} className="text-primary font-medium no-underline hover:underline">{row.city_name}</Link><span className="text-xs text-gray-500 ml-1">{row.state}</span></td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.silver_per_gram)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.silver_per_kg)}</td>
                    <td className={`py-3 px-4 text-right text-sm font-medium ${cc}`}>{ar} {row.change_amount === 0 ? '-' : formatINR(Math.abs(row.change_amount))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">Understanding Silver Prices in India</h2>
        <p className="text-body mb-4">Silver is one of the most popular precious metals in India, used for jewellery, coins, utensils, and religious items. The silver rate in India is determined by the international silver price (set in US dollars per troy ounce), converted to Indian rupees, plus import duty and GST.</p>
        <p className="text-body mb-4">India is one of the world's largest consumers of silver. Demand peaks during the wedding season (October to February) and during festivals like Dhanteras and Diwali. Industrial demand for silver is also growing as India expands its solar energy and electronics manufacturing.</p>
        <p className="text-body mb-4">When buying silver jewellery or items, remember that the purity matters. Standard silver jewellery in India is 92.5% pure (called Sterling Silver or 925 silver). Some items may be 99.9% pure silver. Always check for BIS hallmark to verify purity.</p>
      </article>

      <ShareButton url="/silver-rate" title="Silver Rate Today in India" />
      <InternalLinks title="Silver Rate in Major Cities" links={cityLinks} columns={3} />
      <FAQ items={SILVER_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}