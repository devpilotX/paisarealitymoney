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
  title: 'Petrol Price Today in India - City-wise Rates',
  description: 'Check today\'s petrol price in your city. Live petrol rates for 50+ Indian cities. Updated daily from oil marketing companies.',
  alternates: { canonical: 'https://paisareality.com/petrol-price' },
};

interface FuelRow extends RowDataPacket {
  city_name: string; city_slug: string; state: string;
  petrol_price: number; diesel_price: number;
  petrol_change: number; diesel_change: number; price_date: string;
}

const PETROL_FAQS = [
  { question: 'What is the petrol price in India today?', answer: 'Petrol prices in India are revised daily by oil marketing companies (Indian Oil, Bharat Petroleum, Hindustan Petroleum) at 6 AM. Prices vary by city due to local taxes and VAT. Check this page for today\'s petrol rate in your city.' },
  { question: 'Why is petrol price different in each city?', answer: 'The base price of petrol is the same across India. But each state charges different VAT (Value Added Tax) rates. Some cities also have additional cess or surcharges. Mumbai typically has the highest petrol price because Maharashtra charges a higher VAT.' },
  { question: 'How is petrol price calculated in India?', answer: 'Petrol price = Base price + Excise duty (central tax) + Dealer commission + VAT (state tax). The base price depends on international crude oil rates and the rupee-dollar exchange rate. Excise duty is set by the central government, and VAT varies by state.' },
  { question: 'When do petrol prices change?', answer: 'Under the daily pricing system, oil companies can revise petrol and diesel prices every day at 6 AM based on international crude oil rates. However, in practice, prices remain stable for weeks or months, with changes happening when there are significant shifts in global oil prices.' },
];

export const revalidate = 900;

export default async function PetrolPricePage(): Promise<React.ReactElement> {
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

  const cityLinks = CITIES.slice(0, 20).map((c) => ({ href: `/petrol-price/${c.slug}`, label: `Petrol Price in ${c.name}`, description: c.state }));

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Petrol Price Today' }]} />
      <h1 className="heading-1 mb-2">Petrol Price Today in India</h1>
      <p className="text-body mb-6">City-wise petrol rates for {priceDate}. Updated daily at 6 AM.</p>
      <AdBanner format="horizontal" />
      <div className="my-6"><CitySelector basePath="/petrol-price" placeholder="Search city for petrol price..." /></div>

      {prices.length > 0 && (
        <div className="overflow-x-auto my-8">
          <h2 className="heading-2 mb-4">Petrol Price Today in Major Cities</h2>
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">City</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Petrol (per litre)</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Diesel (per litre)</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
            </tr></thead>
            <tbody>
              {prices.map((row) => {
                const cc = row.petrol_change > 0 ? 'text-green-600' : row.petrol_change < 0 ? 'text-red-600' : 'text-gray-500';
                const ar = row.petrol_change > 0 ? '\u25B2' : row.petrol_change < 0 ? '\u25BC' : '';
                return (
                  <tr key={row.city_slug} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4"><Link href={`/petrol-price/${row.city_slug}`} className="text-primary font-medium no-underline hover:underline">{row.city_name}</Link><span className="text-xs text-gray-500 ml-1">{row.state}</span></td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.petrol_price)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(row.diesel_price)}</td>
                    <td className={`py-3 px-4 text-right text-sm font-medium ${cc}`}>{ar} {row.petrol_change === 0 ? 'No change' : formatINR(Math.abs(row.petrol_change))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">Understanding Petrol Prices in India</h2>
        <p className="text-body mb-4">Petrol prices in India are set by three government oil marketing companies: Indian Oil Corporation (IOCL), Bharat Petroleum (BPCL), and Hindustan Petroleum (HPCL). Since 2017, prices are revised daily under the Dynamic Fuel Pricing system.</p>
        <p className="text-body mb-4">The price you pay at the pump includes the base price of petrol (linked to international crude oil), excise duty charged by the central government, dealer commission, and VAT charged by your state government. VAT rates vary significantly between states, which is why petrol costs more in Mumbai than in Delhi.</p>
        <p className="text-body mb-4">Tips to save on petrol: maintain proper tyre pressure, avoid aggressive driving, use cruise control on highways, remove unnecessary weight from your vehicle, and plan your routes to avoid traffic jams.</p>
      </article>

      <ShareButton url="/petrol-price" title="Petrol Price Today in India" />
      <InternalLinks title="Petrol Price in Major Cities" links={cityLinks} columns={3} />
      <FAQ items={PETROL_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}