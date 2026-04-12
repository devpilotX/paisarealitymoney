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
  title: 'Gold Rate Today in India - Latest 22K & 24K Prices',
  description:
    'Check the latest available gold rate in India. 22 Karat and 24 Karat gold prices per gram and per 10 grams for 50+ Indian cities.',
  alternates: { canonical: 'https://paisareality.com/gold-rate' },
};

interface GoldRow extends RowDataPacket {
  city_name: string;
  city_slug: string;
  state: string;
  gold_24k_per_gram: number;
  gold_22k_per_gram: number;
  gold_24k_per_10gram: number;
  change_amount: number;
  change_percent: number;
  price_date: string;
}

const GOLD_FAQS = [
  {
    question: 'What is the gold rate in India today?',
    answer: 'Gold prices in India change daily based on international market rates, import duties, and local demand. Check this page for the latest 22K and 24K gold rates for your city. Prices are updated every morning.',
  },
  {
    question: 'Why are gold prices different in different cities?',
    answer: 'Gold prices vary across Indian cities because of differences in local taxes, transportation costs, and demand. Cities like Chennai and Kerala often have slightly higher gold rates due to higher demand, while cities closer to gold trading hubs may have lower rates.',
  },
  {
    question: 'What is the difference between 22K and 24K gold?',
    answer: '24 Karat gold is 99.9% pure gold. It is softer and mainly used for gold coins and bars. 22 Karat gold is 91.67% pure gold mixed with other metals like copper and silver for strength. Most gold jewellery in India is made from 22K gold because it is more durable.',
  },
  {
    question: 'Is the gold price shown here the same as what jewellers charge?',
    answer: 'The prices shown here are indicative market rates. Jewellers add making charges (5% to 25% depending on design), GST (3%), and sometimes hallmarking charges. The actual price you pay at a jewellery shop will be higher than the base rate shown here.',
  },
];

export const revalidate = 900;

export default async function GoldRatePage(): Promise<React.ReactElement> {
  let prices: GoldRow[] = [];
  let priceDate = '';

  try {
    prices = await query<GoldRow[]>(
      `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
              gp.gold_24k_per_gram, gp.gold_22k_per_gram, gp.gold_24k_per_10gram,
              gp.change_amount, gp.change_percent, gp.price_date
       FROM gold_prices gp
       JOIN cities c ON gp.city_id = c.id
       WHERE gp.price_date = (SELECT MAX(price_date) FROM gold_prices)
       ORDER BY c.is_metro DESC, c.name
       LIMIT 50`
    );
    priceDate = prices[0]?.price_date ? formatDate(prices[0].price_date) : 'Today';
  } catch (error) {
    console.error('Failed to fetch gold prices:', error);
  }

  const cityLinks = CITIES.slice(0, 20).map((c) => ({
    href: `/gold-rate/${c.slug}`,
    label: `Gold Rate in ${c.name}`,
    description: c.state,
  }));

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Gold Rate Today' }]} />

      <h1 className="heading-1 mb-2">Gold Rate Today in India</h1>
      <p className="text-body mb-6">Latest available 22K and 24K gold prices for {priceDate}. Verify with your jeweller before buying.</p>

      <AdBanner format="horizontal" />

      <div className="my-6">
        <CitySelector basePath="/gold-rate" placeholder="Search for your city..." />
      </div>

      {/* Price Table */}
      {prices.length > 0 && (
        <div className="overflow-x-auto my-8">
          <h2 className="heading-2 mb-4">Gold Price Today Across Indian Cities</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">City</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">24K (per gram)</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">22K (per gram)</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">24K (per 10g)</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((row) => {
                const changeColor = row.change_amount > 0 ? 'text-green-600' : row.change_amount < 0 ? 'text-red-600' : 'text-gray-500';
                const arrow = row.change_amount > 0 ? '\u25B2' : row.change_amount < 0 ? '\u25BC' : '';
                return (
                  <tr key={row.city_slug} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-3 px-4">
                      <Link href={`/gold-rate/${row.city_slug}`} className="text-primary font-medium no-underline hover:underline">
                        {row.city_name}
                      </Link>
                      <span className="text-xs text-gray-500 ml-1">{row.state}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.gold_24k_per_gram)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.gold_22k_per_gram)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.gold_24k_per_10gram)}</td>
                    <td className={`py-3 px-4 text-right text-sm font-medium ${changeColor}`}>
                      {arrow} {row.change_amount === 0 ? '-' : `${formatINR(Math.abs(row.change_amount))}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />

      {/* Content section */}
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">Understanding Gold Prices in India</h2>
        <p className="text-body mb-4">
          Gold has been a preferred investment and gift in India for centuries. Whether you are buying gold for a wedding, as an investment, or for making jewellery, knowing the current rate helps you make a better decision.
        </p>
        <p className="text-body mb-4">
          The gold rate in India is influenced by several factors. The international gold price (set in US dollars per troy ounce) is the starting point. This price is then adjusted for the Indian rupee exchange rate, import duty (currently 15%), and GST (3%). Local demand and supply in each city also cause small differences in price.
        </p>
        <p className="text-body mb-4">
          On this page, you can see today's gold rate for 50 major Indian cities. Click on any city to see detailed price history, a 30-day price chart, and a breakdown of 22K, 24K, and 18K gold prices.
        </p>

        <h2 className="heading-2 mt-8 mb-4">Gold Purity: What Do Karats Mean?</h2>
        <p className="text-body mb-4">
          <strong>24 Karat (24K)</strong> gold is the purest form at 99.9% gold content. It is soft and bright yellow. Used for gold coins, bars, and medical devices. Not ideal for jewellery because it bends easily.
        </p>
        <p className="text-body mb-4">
          <strong>22 Karat (22K)</strong> gold is 91.67% pure gold. The remaining 8.33% is made of metals like copper, zinc, or silver that make it harder. This is the standard for most Indian gold jewellery.
        </p>
        <p className="text-body mb-4">
          <strong>18 Karat (18K)</strong> gold is 75% pure gold. It is more affordable and durable. Popular for diamond-studded jewellery and modern designs.
        </p>
      </article>

      <ShareButton url="/gold-rate" title="Gold Rate Today in India" />

      <InternalLinks title="Gold Rate in Major Cities" links={cityLinks} columns={3} />

      <FAQ items={GOLD_FAQS} />

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
