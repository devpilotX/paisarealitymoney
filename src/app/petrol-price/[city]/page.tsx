import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import FuelCityInsight from '@/components/FuelCityInsight';

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
import AdSlot from '@/components/AdSlot';
import InArticleAd from '@/components/InArticleAd';
import DataProvenance from '@/components/DataProvenance';

interface PageProps { params: Promise<{ city: string }>; }

interface FuelHistoryRow extends QueryResultRow {
  price_date: string; petrol_price: number; diesel_price: number;
  petrol_change: number; diesel_change: number;
  data_as_of: string | null; source: string | null;
}

export async function generateStaticParams(): Promise<Array<{ city: string }>> {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: 'City Not Found', robots: { index: false } };
  return pageMetadata({
    title: `Petrol Price in ${city.name} Today: Per Litre Rate`,
    description: `Check the latest available petrol price in ${city.name}, ${city.state}. Current rate per litre, 7-day history, and price trend.`,
    path: `/petrol-price/${city.slug}`,
    keywords: [`petrol price in ${city.name.toLowerCase()}`, `petrol rate ${city.name.toLowerCase()}`, 'petrol price today', 'petrol rate per litre'],
  });
}

export const revalidate = 900;

export default async function PetrolPriceCityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  let historyRows: FuelHistoryRow[] = [];
  try {
    historyRows = await query<FuelHistoryRow>(`SELECT fp.price_date, fp.petrol_price, fp.diesel_price, fp.petrol_change, fp.diesel_change, fp.data_as_of::text AS data_as_of, fp.source
       FROM fuel_prices fp JOIN cities c ON fp.city_id = c.id
       WHERE c.slug = $1 ORDER BY fp.price_date DESC LIMIT 30`, [city.slug]
    );
  } catch (error) { console.error('Failed to fetch fuel history:', error); }

  const today = historyRows[0];
  const weekHistory = historyRows.slice(0, 7);
  const chartData = historyRows.map((r) => ({ date: r.price_date, price: r.petrol_price })).reverse();
  const relatedCities = getRelatedCities(city.slug, 10);
  const cityLinks = relatedCities.map((c) => ({ href: `/petrol-price/${c.slug}`, label: `Petrol Price in ${c.name}`, description: c.state }));

  const faqs = [
    { question: `What is the petrol price in ${city.name} today?`, answer: today ? `Today's petrol price in ${city.name} is ${formatINR(today.petrol_price)} per litre. Diesel price is ${formatINR(today.diesel_price)} per litre.` : `Fuel prices for ${city.name} are being updated.` },
    { question: `Why is petrol costlier in some cities than in ${city.name}?`, answer: `Excise duty and the oil company's base price are the same across India. The difference comes from state VAT, which ${city.state} sets, and from freight to the depot that supplies the city. That is why cities in the same state are usually within a rupee of each other.` },
    { question: 'When does petrol price change?', answer: 'Oil companies can revise fuel prices daily at 6 AM. In practice, prices stay stable for extended periods unless there are significant changes in international crude oil prices or government tax policy changes.' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Petrol Price', href: '/petrol-price' }, { label: city.name }]} />
      <h1 className="heading-1 mb-2">Petrol Price in {city.name} Today</h1>
      <p className="text-body mb-2">Current petrol and diesel rates in {city.name}, {city.state}.{today ? ` Updated: ${formatDate(today.price_date)}.` : ''}</p>
      {today && <DataProvenance asOf={today.data_as_of ?? today.price_date} source={today.source ?? 'OMC published rates'} className="mb-6" />}
      <AdSlot placement="prices-top" format="horizontal" />

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

      <FuelCityInsight fuel="petrol" citySlug={city.slug} />

      <article className="max-w-3xl my-10 prose">
        <h2>How the price in {city.name} is made up</h2>
        <p>
          {`The pump price has four parts: the oil company's base price, central excise duty, the dealer's commission, and ${city.state}'s VAT. Excise and the base price are the same everywhere, which is why prices move together across India and differ mainly by state. Indian Oil, BPCL and HPCL can revise rates at 6 am every day, and this page picks up the change on its first update of the day.`}
        </p>
        <p>
          {`To check the rate at a particular Indian Oil pump, SMS RSP followed by the dealer code painted at the station to 9224992249. The Indian Oil ONE, HP Pay and BPCL HelloBPCL apps show the rate at any of their pumps.`}
        </p>
        <p>
          Also on this site: the <Link href={`/diesel-price/${city.slug}`}>diesel price in {city.name}</Link>, the <Link href={`/gold-rate/${city.slug}`}>gold rate in {city.name}</Link> and <Link href="/lpg-price">LPG cylinder prices by state</Link>.
        </p>
      </article>

      <ShareButton url={`/petrol-price/${city.slug}`} title={`Petrol Price in ${city.name} Today`} />
      <InternalLinks title="Petrol Price in Other Cities" links={cityLinks} columns={3} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
