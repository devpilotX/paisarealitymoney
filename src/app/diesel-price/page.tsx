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
  title: 'Diesel Price Today in India - City-wise Rates',
  description: 'Check the latest available diesel price in your city for 50+ Indian cities. Verify with oil company apps or fuel pumps before purchase.',
  alternates: { canonical: 'https://paisareality.com/diesel-price' },
};

interface FuelRow extends RowDataPacket {
  city_name: string; city_slug: string; state: string;
  petrol_price: number; diesel_price: number;
  petrol_change: number; diesel_change: number; price_date: string;
}

const DIESEL_FAQS = [
  { question: 'What is the diesel price in India today?', answer: 'Diesel prices vary by city due to different state taxes. Check the table above for today\'s diesel rate in your city. Prices are revised daily at 6 AM by oil marketing companies.' },
  { question: 'Why is diesel cheaper than petrol?', answer: 'Diesel is taxed at a lower rate than petrol in most states because it is considered essential for commercial transport, agriculture, and industry. The excise duty on diesel is also lower than petrol.' },
  { question: 'Is diesel price the same at all petrol pumps in a city?', answer: 'Diesel price should be almost the same at all authorized pumps in a city on a given day. Minor differences (Rs 0.01 to Rs 0.05) can occur due to transportation costs to the specific pump location.' },
];

export const revalidate = 900;

export default async function DieselPricePage(): Promise<React.ReactElement> {
  let prices: FuelRow[] = [];
  let priceDate = '';
  try {
    prices = await query<FuelRow[]>(
      `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
              fp.petrol_price, fp.diesel_price, fp.petrol_change, fp.diesel_change, fp.price_date
       FROM fuel_prices fp JOIN cities c ON fp.city_id = c.id
       WHERE fp.price_date = (SELECT MAX(price_date) FROM fuel_prices)
       ORDER BY c.is_metro DESC, c.name LIMIT 50`
    );
    priceDate = prices[0]?.price_date ? formatDate(prices[0].price_date) : 'Today';
  } catch (error) { console.error('Failed to fetch fuel prices:', error); }

  const cityLinks = CITIES.slice(0, 20).map((c) => ({ href: `/diesel-price/${c.slug}`, label: `Diesel Price in ${c.name}`, description: c.state }));

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Diesel Price Today' }]} />
      <h1 className="heading-1 mb-2">Diesel Price Today in India</h1>
      <p className="text-body mb-6">City-wise diesel rates for {priceDate}. Verify with oil company apps or fuel pumps before purchase.</p>
      <AdBanner format="horizontal" />
      <div className="my-6"><CitySelector basePath="/diesel-price" placeholder="Search city for diesel price..." /></div>

      {prices.length > 0 && (
        <div className="overflow-x-auto my-8">
          <h2 className="heading-2 mb-4">Diesel Price Today in Major Cities</h2>
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">City</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Diesel (per litre)</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Petrol (per litre)</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
            </tr></thead>
            <tbody>
              {prices.map((row) => {
                const cc = row.diesel_change > 0 ? 'text-green-600' : row.diesel_change < 0 ? 'text-red-600' : 'text-gray-500';
                const ar = row.diesel_change > 0 ? '\u25B2' : row.diesel_change < 0 ? '\u25BC' : '';
                return (
                  <tr key={row.city_slug} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4"><Link href={`/diesel-price/${row.city_slug}`} className="text-primary font-medium no-underline hover:underline">{row.city_name}</Link><span className="text-xs text-gray-500 ml-1">{row.state}</span></td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.diesel_price)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-500">{formatINR(row.petrol_price)}</td>
                    <td className={`py-3 px-4 text-right text-sm font-medium ${cc}`}>{ar} {row.diesel_change === 0 ? 'No change' : formatINR(Math.abs(row.diesel_change))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">Understanding Diesel Prices in India</h2>
        <p className="text-body mb-4">Diesel is the most consumed fuel in India, used by trucks, buses, trains, agricultural equipment, and diesel generators. The diesel price structure is similar to petrol: base price + excise duty + dealer commission + state VAT.</p>
        <p className="text-body mb-4">Diesel prices directly affect the cost of goods because almost all commercial transportation in India runs on diesel. When diesel prices rise, transportation costs increase, which can push up prices of vegetables, fruits, and other goods.</p>
        <p className="text-body mb-4">Bulk diesel consumers (transporters, factories) can sometimes get a small discount by purchasing directly from oil company depots. Ask your local Indian Oil, BPCL, or HPCL depot about bulk pricing.</p>
      </article>

      <ShareButton url="/diesel-price" title="Diesel Price Today in India" />
      <InternalLinks title="Diesel Price in Major Cities" links={cityLinks} columns={3} />
      <FAQ items={DIESEL_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
