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

interface PageProps {
  params: Promise<{ city: string }>;
}

interface GoldHistoryRow extends RowDataPacket {
  price_date: string;
  gold_24k_per_gram: number;
  gold_22k_per_gram: number;
  gold_18k_per_gram: number;
  gold_24k_per_10gram: number;
  gold_22k_per_10gram: number;
  change_amount: number;
  change_percent: number;
}

export async function generateStaticParams(): Promise<Array<{ city: string }>> {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: 'City Not Found' };
  return {
    title: `Gold Rate in ${city.name} Today - 22K & 24K Price`,
    description: `Check the latest available gold rate in ${city.name}, ${city.state}. 22K and 24K gold price per gram, 7-day history, and 30-day chart.`,
    alternates: { canonical: `https://paisareality.com/gold-rate/${city.slug}` },
  };
}

export const revalidate = 900;

export default async function GoldRateCityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  let historyRows: GoldHistoryRow[] = [];
  try {
    historyRows = await query<GoldHistoryRow[]>(
      `SELECT gp.price_date, gp.gold_24k_per_gram, gp.gold_22k_per_gram, gp.gold_18k_per_gram,
              gp.gold_24k_per_10gram, gp.gold_22k_per_10gram, gp.change_amount, gp.change_percent
       FROM gold_prices gp
       JOIN cities c ON gp.city_id = c.id
       WHERE c.slug = ?
       ORDER BY gp.price_date DESC
       LIMIT 30`,
      [city.slug]
    );
  } catch (error) {
    console.error('Failed to fetch gold history:', error);
  }

  const today = historyRows[0];
  const weekHistory = historyRows.slice(0, 7);
  const chartData = historyRows.map((r) => ({ date: r.price_date, price: r.gold_24k_per_gram })).reverse();

  const relatedCities = getRelatedCities(city.slug, 10);
  const cityLinks = relatedCities.map((c) => ({
    href: `/gold-rate/${c.slug}`,
    label: `Gold Rate in ${c.name}`,
    description: c.state,
  }));

  const faqs = [
    {
      question: `What is the gold rate in ${city.name} today?`,
      answer: today
        ? `Today's 24K gold rate in ${city.name} is ${formatINR(today.gold_24k_per_gram)} per gram and 22K gold rate is ${formatINR(today.gold_22k_per_gram)} per gram. The price of 10 grams of 24K gold is ${formatINR(today.gold_24k_per_10gram)}.`
        : `Gold prices for ${city.name} are being updated. Please check back shortly.`,
    },
    {
      question: `Why is gold price in ${city.name} different from other cities?`,
      answer: `Gold prices in ${city.name} may differ from other cities due to local taxes, transportation costs, and demand. ${city.state} state taxes and local market conditions affect the final price. The difference is usually small, between Rs 10 to Rs 50 per gram.`,
    },
    {
      question: 'How often do gold prices change?',
      answer: 'Gold prices in India change daily based on international market movements and the rupee-dollar exchange rate. Major price updates happen when the London Bullion Market Association (LBMA) sets the daily fix price. Indian markets open at 9 AM and prices can fluctuate during trading hours.',
    },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[
        { label: 'Gold Rate', href: '/gold-rate' },
        { label: city.name },
      ]} />

      <h1 className="heading-1 mb-2">Gold Rate in {city.name} Today</h1>
      <p className="text-body mb-6">
        Latest available 22K and 24K gold prices in {city.name}, {city.state}.
        {today ? ` Last updated: ${formatDate(today.price_date)}.` : ''}
      </p>

      <AdBanner format="horizontal" />

      {/* Today's Prices */}
      {today && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <PriceCard label="24K Gold (per gram)" price={today.gold_24k_per_gram} change={today.change_amount} changePercent={today.change_percent} size="large" />
          <PriceCard label="22K Gold (per gram)" price={today.gold_22k_per_gram} change={Math.round(today.change_amount * 0.9167 * 100) / 100} changePercent={today.change_percent} />
          <PriceCard label="18K Gold (per gram)" price={today.gold_18k_per_gram} change={Math.round(today.change_amount * 0.75 * 100) / 100} changePercent={today.change_percent} />
          <PriceCard label="24K Gold (10 grams)" price={today.gold_24k_per_10gram} change={today.change_amount * 10} changePercent={today.change_percent} unit="per 10 grams" />
        </div>
      )}

      <div className="my-6">
        <CitySelector currentSlug={city.slug} basePath="/gold-rate" />
      </div>

      <InArticleAd />

      {/* 7-Day History */}
      {weekHistory.length > 0 && (
        <div className="my-8">
          <PriceTable
            title={`7-Day Gold Price History in ${city.name}`}
            rows={weekHistory.map((r) => ({
              date: r.price_date,
              price: r.gold_24k_per_gram,
              change: r.change_amount,
              changePercent: r.change_percent,
            }))}
            priceLabel="24K Gold"
          />
        </div>
      )}

      {/* 30-Day Chart */}
      {chartData.length > 1 && (
        <div className="my-8">
          <PriceChart data={chartData} title={`30-Day Gold Price Trend in ${city.name}`} />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Gold Rate in {city.name}</h2>
        <p className="text-body mb-4">
          {city.name} is one of India's major cities in {city.state} with an active gold market. The gold rate in {city.name} is influenced by international gold prices, the value of the Indian rupee, import duties, and local demand from jewellers and consumers.
        </p>
        <p className="text-body mb-4">
          When buying gold jewellery in {city.name}, remember that the final price includes making charges (which range from 5% to 25% of the gold value depending on the complexity of the design), 3% GST, and possibly hallmarking charges. Always ask for a detailed bill that shows the gold rate, weight, making charge, and tax separately.
        </p>
        <p className="text-body mb-4">
          For gold investment, you can buy gold coins or bars from banks and authorized dealers in {city.name}. You can also invest in Sovereign Gold Bonds (SGBs) issued by the Reserve Bank of India, which give you the benefit of gold price appreciation plus 2.5% annual interest.
        </p>
        <p className="text-body mb-4">
          Gold prices in {city.name} are shown from the latest available database update. You can also check the <Link href={`/silver-rate/${city.slug}`} className="link-internal">silver rate in {city.name}</Link> and <Link href={`/petrol-price/${city.slug}`} className="link-internal">petrol price in {city.name}</Link>.
        </p>
      </article>

      <ShareButton url={`/gold-rate/${city.slug}`} title={`Gold Rate in ${city.name} Today`} />

      <InternalLinks title={`Gold Rate in Other Cities`} links={cityLinks} columns={3} />

      <FAQ items={faqs} />

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
