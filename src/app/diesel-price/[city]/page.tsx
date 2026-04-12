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
    title: `Diesel Price in ${city.name} Today - Per Litre Rate`,
    description: `Check today's diesel price in ${city.name}, ${city.state}. Current rate per litre with 7-day history and price trend chart.`,
    alternates: { canonical: `{{https://paisareality.com/diesel-price/${city.slug}}}` },
  };
}

export const revalidate = 900;

export default async function DieselPriceCityPage({ params }: PageProps): Promise<React.ReactElement> {
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
  const chartData = historyRows.map((r) => ({ date: r.price_date, price: r.diesel_price })).reverse();
  const relatedCities = getRelatedCities(city.slug, 10);
  const cityLinks = relatedCities.map((c) => ({ href: `/diesel-price/${c.slug}`, label: `Diesel Price in ${c.name}`, description: c.state }));

  const faqs = [
    { question: `What is the diesel price in ${city.name} today?`, answer: today ? `Today's diesel price in ${city.name} is ${formatINR(today.diesel_price)} per litre.` : `Diesel prices for ${city.name} are being updated.` },
    { question: `How does diesel price in ${city.name} compare to other cities?`, answer: `Diesel prices vary based on ${city.state} state VAT rates and local surcharges. Metro cities may have different rates compared to smaller cities in the same state.` },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Diesel Price', href: '/diesel-price' }, { label: city.name }]} />
      <h1 className="heading-1 mb-2">Diesel Price in {city.name} Today</h1>
      <p className="text-body mb-6">Current diesel rate in {city.name}, {city.state}.{today ? ` Updated: ${formatDate(today.price_date)}.` : ''}</p>
      <AdBanner format="horizontal" />

      {today && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
          <PriceCard label="Diesel (per litre)" price={today.diesel_price} change={today.diesel_change} changePercent={today.diesel_change ? (today.diesel_change / (today.diesel_price - today.diesel_change)) * 100 : 0} unit="per litre" size="large" />
          <PriceCard label="Petrol (per litre)" price={today.petrol_price} change={today.petrol_change} changePercent={today.petrol_change ? (today.petrol_change / (today.petrol_price - today.petrol_change)) * 100 : 0} unit="per litre" />
        </div>
      )}

      <div className="my-6"><CitySelector currentSlug={city.slug} basePath="/diesel-price" /></div>
      <InArticleAd />

      {weekHistory.length > 0 && (
        <div className="my-8">
          <PriceTable title={`7-Day Diesel Price History in ${city.name}`} rows={weekHistory.map((r) => ({ date: r.price_date, price: r.diesel_price, change: r.diesel_change, changePercent: r.diesel_change ? (r.diesel_change / (r.diesel_price - r.diesel_change)) * 100 : 0 }))} priceLabel="Diesel" unit="per litre" />
        </div>
      )}

      {chartData.length > 1 && (
        <div className="my-8"><PriceChart data={chartData} title={`30-Day Diesel Price Trend in ${city.name}`} color="#2563EB" /></div>
      )}

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Diesel Price in {city.name}</h2>
        <p className="text-body mb-4">Diesel prices in {city.name} are revised daily by oil marketing companies. The rate depends on the base price, central excise duty, dealer commission, and {city.state} VAT. Diesel is typically Rs 5 to Rs 10 cheaper than petrol in most cities.</p>
        <p className="text-body mb-4">Check also: <Link href={`/petrol-price/${city.slug}`} className="link-internal">Petrol price in {city.name}</Link> and <Link href={`/gold-rate/${city.slug}`} className="link-internal">Gold rate in {city.name}</Link>.</p>
      </article>

      <ShareButton url={`/diesel-price/${city.slug}`} title={`Diesel Price in ${city.name} Today`} />
      <InternalLinks title="Diesel Price in Other Cities" links={cityLinks} columns={3} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}