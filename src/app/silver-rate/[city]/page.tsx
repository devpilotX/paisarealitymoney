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

interface PageProps { params: Promise<{ city: string }>; }

interface SilverHistoryRow extends RowDataPacket {
  price_date: string; silver_per_gram: number; silver_per_kg: number;
  change_amount: number; change_percent: number;
}

export async function generateStaticParams(): Promise<Array<{ city: string }>> {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: 'City Not Found' };
  return {
    title: `Silver Rate in ${city.name} Today - Price per Gram & Kg`,
    description: `Check today's silver rate in ${city.name}, ${city.state}. Live price per gram and per kg. 7-day history, 30-day chart. Updated daily.`,
    alternates: { canonical: `https://paisareality.com/silver-rate/${city.slug}` },
  };
}

export const revalidate = 900;

export default async function SilverRateCityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  let historyRows: SilverHistoryRow[] = [];
  try {
    historyRows = await query<SilverHistoryRow[]>(
      `SELECT sp.price_date, sp.silver_per_gram, sp.silver_per_kg, sp.change_amount, sp.change_percent
       FROM silver_prices sp JOIN cities c ON sp.city_id = c.id
       WHERE c.slug = ? ORDER BY sp.price_date DESC LIMIT 30`, [city.slug]
    );
  } catch (error) { console.error('Failed to fetch silver history:', error); }

  const today = historyRows[0];
  const weekHistory = historyRows.slice(0, 7);
  const chartData = historyRows.map((r) => ({ date: r.price_date, price: r.silver_per_gram })).reverse();
  const relatedCities = getRelatedCities(city.slug, 10);
  const cityLinks = relatedCities.map((c) => ({ href: `/silver-rate/${c.slug}`, label: `Silver Rate in ${c.name}`, description: c.state }));

  const faqs = [
    { question: `What is the silver rate in ${city.name} today?`, answer: today ? `Today's silver rate in ${city.name} is ${formatINR(today.silver_per_gram)} per gram and ${formatINR(today.silver_per_kg)} per kg.` : `Silver prices for ${city.name} are being updated.` },
    { question: `Where can I buy silver in ${city.name}?`, answer: `You can buy silver from authorized jewellers, bullion dealers, and some banks in ${city.name}. Always check for BIS hallmark (925 for Sterling Silver). You can also buy digital silver through apps and invest in Silver ETFs through your demat account.` },
    { question: 'What affects silver prices?', answer: 'Silver prices are affected by international market rates, rupee-dollar exchange rate, import duty, industrial demand (especially from electronics and solar panel manufacturing), and seasonal demand during festivals and weddings.' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Silver Rate', href: '/silver-rate' }, { label: city.name }]} />
      <h1 className="heading-1 mb-2">Silver Rate in {city.name} Today</h1>
      <p className="text-body mb-6">Live silver prices in {city.name}, {city.state}.{today ? ` Updated: ${formatDate(today.price_date)}.` : ''}</p>
      <AdBanner format="horizontal" />

      {today && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
          <PriceCard label="Silver (per gram)" price={today.silver_per_gram} change={today.change_amount} changePercent={today.change_percent} size="large" />
          <PriceCard label="Silver (per kg)" price={today.silver_per_kg} change={today.change_amount * 1000} changePercent={today.change_percent} unit="per kg" />
        </div>
      )}

      <div className="my-6"><CitySelector currentSlug={city.slug} basePath="/silver-rate" /></div>
      <InArticleAd />

      {weekHistory.length > 0 && (
        <div className="my-8">
          <PriceTable title={`7-Day Silver Price History in ${city.name}`} rows={weekHistory.map((r) => ({ date: r.price_date, price: r.silver_per_gram, change: r.change_amount, changePercent: r.change_percent }))} priceLabel="Silver" />
        </div>
      )}

      {chartData.length > 1 && (
        <div className="my-8"><PriceChart data={chartData} title={`30-Day Silver Price Trend in ${city.name}`} color="#6B7280" /></div>
      )}

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Silver Rate in {city.name}</h2>
        <p className="text-body mb-4">{city.name} has an active silver market with numerous jewellers and bullion dealers. The silver rate in {city.name} follows international prices closely, with small adjustments for local taxes and transportation.</p>
        <p className="text-body mb-4">Silver is popular in {city.state} for jewellery, utensils, and religious offerings. During festivals like Dhanteras, demand for silver items rises significantly, which can cause a temporary increase in local silver prices.</p>
        <p className="text-body mb-4">Also check the <Link href={`/gold-rate/${city.slug}`} className="link-internal">gold rate in {city.name}</Link> and <Link href={`/petrol-price/${city.slug}`} className="link-internal">petrol price in {city.name}</Link>.</p>
      </article>

      <ShareButton url={`/silver-rate/${city.slug}`} title={`Silver Rate in ${city.name} Today`} />
      <InternalLinks title="Silver Rate in Other Cities" links={cityLinks} columns={3} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
