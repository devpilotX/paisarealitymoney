import type { Metadata } from 'next';
import { pageMetadata, brandMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import { getCityMetalContext } from '@/lib/city-metal';

import { getCityBySlug, getRelatedCities, CITIES } from '@/lib/cities';
import { formatINR, formatDate } from '@/lib/constants';
import PriceCard from '@/components/PriceCard';
import PriceTable from '@/components/PriceTable';
import PriceChart from '@/components/PriceChart';
import CitySelector from '@/components/CitySelector';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import NextStep from '@/components/NextStep';
import ShareButton from '@/components/ShareButton';
import AdBanner from '@/components/AdBanner';
import AdSlot from '@/components/AdSlot';
import InArticleAd from '@/components/InArticleAd';

interface PageProps { params: Promise<{ city: string }>; }

interface SilverHistoryRow extends QueryResultRow {
  price_date: string; silver_per_gram: number; silver_per_kg: number;
  change_amount: number; change_percent: number;
}

export async function generateStaticParams(): Promise<Array<{ city: string }>> {
  return CITIES.map((c) => ({ city: c.slug }));
}

async function buildMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: 'City Not Found', robots: { index: false } };
  return pageMetadata({
    title: `Silver Rate in ${city.name} Today: Price per Gram & Kg`,
    description: `Check the latest available silver rate in ${city.name}, ${city.state}. Price per gram and per kg, 7-day history, and 30-day chart.`,
    path: `/silver-rate/${city.slug}`,
    keywords: [`silver rate in ${city.name.toLowerCase()}`, `silver price ${city.name.toLowerCase()}`, 'silver rate per gram', 'silver rate today'],
  });
}

export const revalidate = 900;

export default async function SilverRateCityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  let historyRows: SilverHistoryRow[] = [];
  try {
    historyRows = await query<SilverHistoryRow>(`SELECT sp.price_date, sp.silver_per_gram, sp.silver_per_kg, sp.change_amount, sp.change_percent
       FROM silver_prices sp JOIN cities c ON sp.city_id = c.id
       WHERE c.slug = $1 ORDER BY sp.price_date DESC LIMIT 30`, [city.slug]
    );
  } catch (error) { console.error('Failed to fetch silver history:', error); }

  const today = historyRows[0];
  const weekHistory = historyRows.slice(0, 7);
  const ctx = await getCityMetalContext('silver', city.slug);
  const r2 = (v: number): string => formatINR(Math.round(v * 100) / 100);
  const r0 = (v: number): string => formatINR(Math.round(v));
  const chartData = historyRows.map((r) => ({ date: r.price_date, price: r.silver_per_gram })).reverse();
  const relatedCities = getRelatedCities(city.slug, 10);
  const cityLinks = relatedCities.map((c) => ({ href: `/silver-rate/${c.slug}`, label: `Silver Rate in ${c.name}`, description: c.state }));

  const faqs = [
    { question: `What is the silver rate in ${city.name} today?`, answer: today ? `Silver in ${city.name} is ${formatINR(today.silver_per_gram)} a gram, or ${formatINR(today.silver_per_kg)} a kilo, as of ${formatDate(today.price_date)}. That is before 3% GST and any making charge.` : `Today's rate for ${city.name} appears after the first update of the day, around 6:15 am.` },
    { question: `Is silver cheaper in ${city.name} than elsewhere?`, answer: ctx ? `Today silver in ${city.name} is ${r2(Math.abs(ctx.diffFromAvg))} a gram ${ctx.diffFromAvg >= 0 ? 'above' : 'below'} the average of the ${ctx.cityCount} cities we track, and ranks ${ctx.rank} from cheapest. On a kilo that is ${r0(Math.abs(ctx.diffFromAvg) * 1000)}.` : 'Differences between cities are small and come from local dealer rates and transport.' },
    { question: 'Is silver jewellery hallmarked?', answer: 'Hallmarking is voluntary for silver, unlike gold. Since 1 September 2025 every piece that is hallmarked carries the BIS mark with the word SILVER, a purity grade (800, 835, 925, 958, 970, 990 or 999) and a six-character HUID code you can check in the BIS CARE app. Ask for a hallmarked piece when you can.' },
    { question: 'Why is silver in India priced above the international rate?', answer: 'The international price is converted to rupees and then import duty and GST are added. Since the silver squeeze of 2025, physical silver in India has also traded at a noticeable premium to that landed cost, which our rate includes. The methodology page explains the steps.' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Silver Rate', href: '/silver-rate' }, { label: city.name }]} />
      <h1 className="heading-1 mb-2">Silver Rate in {city.name} Today</h1>
      <p className="text-body mb-6">Latest available silver prices in {city.name}, {city.state}.{today ? ` Updated: ${formatDate(today.price_date)}.` : ''}</p>
      <AdSlot placement="prices-top" format="horizontal" />

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

      {ctx && today && (
        <section className="my-12 grid gap-6 lg:grid-cols-2">
          <div className="card-flat">
            <h2 className="heading-3">How {city.name} compares today</h2>
            <dl className="mt-5 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4"><dt className="text-muted">Silver in {city.name}</dt><dd className="font-semibold tabular">{r2(ctx.cityPrice)} / g</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Average of {ctx.cityCount} cities</dt><dd className="tabular">{r2(ctx.indiaAvg)} / g</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Rank, cheapest first</dt><dd className="tabular">{ctx.rank} of {ctx.cityCount}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Cheapest today</dt><dd className="tabular"><Link href={`/silver-rate/${ctx.cheapest.slug}`} className="link-internal">{ctx.cheapest.name}</Link> {r2(ctx.cheapest.price)}</dd></div>
              {ctx.high30 && ctx.low30 && (
                <div className="flex justify-between gap-4"><dt className="text-muted">Range over the last {ctx.days} days</dt><dd className="tabular">{r2(ctx.low30)} to {r2(ctx.high30)}</dd></div>
              )}
            </dl>
          </div>
          <div className="card-flat">
            <h2 className="heading-3">What silver costs in {city.name}, with GST</h2>
            <p className="mt-2 text-sm text-muted">At today&apos;s rate plus 3% GST. Coins and bars carry little or no making charge; jewellery and utensils add one.</p>
            <dl className="mt-5 space-y-3 text-[15px]">
              {[['10 g coin', 10], ['100 g bar', 100], ['1 kg bar', 1000]].map(([k, g]) => (
                <div key={k as string} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="font-medium tabular">{r0(Number(today.silver_per_gram) * (g as number) * 1.03)}</dd></div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <article className="max-w-3xl my-10 prose">
        <h2>Buying silver in {city.name}</h2>
        <p>
          {`The rate here is for fine silver (999), before GST and making charges. Jewellers in ${city.name} quote from their association's morning rate, so the counter price can differ a little from ours; we update five times a day.`}
        </p>
        <p>
          Anklets, utensils and gift items are often 925 or lower, so check the grade before comparing prices. For silver as an investment,
          silver ETFs follow the same price with no making charge and no storage.
        </p>
      </article>

      <ShareButton url={`/silver-rate/${city.slug}`} title={`Silver Rate in ${city.name} Today`} />
      <NextStep
        title="Waiting for a better price?"
        text="Set a free alert and we will email you when silver reaches the rate you want in your city. It needs a free account and takes a minute."
        links={[{ href: '/dashboard/alerts', label: 'Set a price alert', primary: true }]}
      />
      <InternalLinks title="Silver Rate in Other Cities" links={cityLinks} columns={3} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}

/** Adds " | Paisa Reality" to the title when it still fits 60 chars. */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return brandMetadata(await buildMetadata(props));
}
