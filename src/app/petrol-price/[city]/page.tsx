import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { getCityBySlug, getRelatedCities, CITIES } from '@/lib/cities';
import { formatINR, formatDate } from '@/lib/constants';
import PriceCard from '@/components/PriceCard';
import PriceTable from '@/components/PriceTable';
import PriceChart from '@/components/PriceChart';
import CitySelector from '@/components/CitySelector';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import ShareButton from '@/components/ShareButton';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

interface PageProps { params: { city: string }; }

interface FuelHistoryRow extends RowDataPacket {
  price_date: string; petrol_price: number; diesel_price: number;
  petrol_change: number; diesel_change: number;
}

export async function generateStaticParams(): Promise<Array<{ city: string }>> {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.city);
  if (!city) return { title: 'City Not Found' };
  return {
    title: `Petrol Price in ${city.name} Today - Per Litre Rate`,
    description: `Check today's petrol price in ${city.name}, ${city.state}. Current rate per litre, 7-day history, and price trend. Updated daily.`,
    alternates: { canonical: `{{https://paisareality.com/petrol-price/${city.slug}}}` },
  };
}

export const revalidate = 900;

export default async function PetrolPriceCityPage({ params }: PageProps): Promise<React.ReactElement> {
  const city = getCityBySlug(params.city);
  if (!city) notFound();

  let historyRows: FuelHistoryRow[] = [];
  try {
    historyRows = await query<FuelHistoryRow[]>(
      `SELECT fp.price_date, fp.petrol_price, fp.diesel_price, fp.petrol_change, fp.diesel_change
       FROM fuel_prices fp JOIN cities c ON fp.city_id = c.id
       WHERE c.slug = ? ORDER BY fp.price_date DESC LIMIT 30`, [city.slug]
    );
  } catch (error) { console.error('Failed to fetch fuel history:', error); }

  const today = historyRows[0];
  const weekHistory = historyRows.slice(0, 7);
  const chartData = historyRows.map((r) => ({ date: r.price_date, price: r.petrol_price })).reverse();
  const relatedCities = getRelatedCities(city.slug, 10);
  const cityLinks = relatedCities.map((c) => ({ href: `/petrol-price/${c.slug}`, label: `Petrol Price in ${c.name}`, description: c.state }));

  const faqs = [
    { question: `What is the petrol price in ${city.name} today?`, answer: today ? `Today's petrol price in ${city.name} is ${formatINR(today.petrol_price)} per litre. Diesel price is ${formatINR(today.diesel_price)} per litre.` : `Fuel prices for ${city.name} are being updated.` },
    { question: `Why is petrol expensive in ${city.name}?`, answer: `Petrol price in ${city.name} depends on VAT rate set by ${city.state} state government, local cess, and transportation costs. Different states charge different tax rates, which causes price variation across cities.` },
    { question: 'When does petrol price change?', answer: 'Oil companies can revise fuel prices daily at 6 AM. In practice, prices stay stable for extended periods unless there are significant changes in international crude oil prices or government tax policy changes.' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Petrol Price', href: '/petrol-price' }, { label: city.name }]} />
      <h1 className="heading-1 mb-2">Petrol Price in {city.name} Today</h1>
      <p className="text-body mb-6">Current petrol and diesel rates in {city.name}, {city.state}.{today ? ` Updated: ${formatDate(today.price_date)}.` : ''}</p>
      <AdBanner format="horizontal" />

      {today && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
          <PriceCard label="Petrol (per litre)" price={today.petrol_price} change={today.petrol_change} changePercent={today.petrol_change ? (today.petrol_change / (today.petrol_price - today.petrol_change)) * 100 : 0} unit="per litre" size="large" />
          <PriceCard label="Diesel (per litre)" price={today.diesel_price} change={today.diesel_change} changePercent={today.diesel_change ? (today.diesel_change / (today.diesel_price - today.diesel_change)) * 100 : 0} unit="per litre" />
        </div>
      )}

      <div className="my-6"><CitySelector currentSlug={city.slug} basePath="/petrol-price" /></div>
      <InArticleAd />

      {weekHistory.length > 0 && (
        <div className="my-8">
          <PriceTable title={`7-Day Petrol Price History in ${city.name}`} rows={weekHistory.map((r) => ({ date: r.price_date, price: r.petrol_price, change: r.petrol_change, changePercent: r.petrol_change ? (r.petrol_change / (r.petrol_price - r.petrol_change)) * 100 : 0 }))} priceLabel="Petrol" unit="per litre" />
        </div>
      )}

      {chartData.length > 1 && (
        <div className="my-8"><PriceChart data={chartData} title={`30-Day Petrol Price Trend in ${city.name}`} color="#DC2626" /></div>
      )}

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Petrol Price in {city.name}</h2>
        <p className="text-body mb-4">Petrol and diesel prices in {city.name} are set daily by oil marketing companies. The rate includes base price, excise duty, dealer commission, and {city.state} state VAT. Prices at individual petrol pumps may vary slightly due to transportation costs.</p>
        <p className="text-body mb-4">You can verify the current fuel price at any petrol pump in {city.name} by sending an SMS: IOCL RSP (space) dealer code to 9224992249, or checking the Indian Oil, BPCL, or HPCL mobile apps.</p>
        <p className="text-body mb-4">Also check the <Link href={`/diesel-price/${city.slug}`} className="link-internal">diesel price in {city.name}</Link>, <Link href={`/gold-rate/${city.slug}`} className="link-internal">gold rate in {city.name}</Link>, and <Link href="/lpg-price" className="link-internal">LPG price in {city.state}</Link>.</p>
      </article>

      <ShareButton url={`/petrol-price/${city.slug}`} title={`Petrol Price in ${city.name} Today`} />
      <InternalLinks title="Petrol Price in Other Cities" links={cityLinks} columns={3} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}