import type { Metadata } from 'next';
import { pageMetadata, brandMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import { getCityMetalContext, jewelleryBill } from '@/lib/city-metal';

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

interface PageProps {
  params: Promise<{ city: string }>;
}

interface GoldHistoryRow extends QueryResultRow {
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

async function buildMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: 'City Not Found', robots: { index: false } };
  const meta = pageMetadata({
    title: `Gold Rate in ${city.name} Today: 22K & 24K Price`,
    description: `Check the latest available gold rate in ${city.name}, ${city.state}. 22K and 24K gold price per gram, 7-day history, and 30-day chart.`,
    path: `/gold-rate/${city.slug}`,
    keywords: [`gold rate in ${city.name.toLowerCase()}`, `gold price ${city.name.toLowerCase()}`, '22k 24k gold rate', 'gold rate today'],
  });
  const url = `https://paisareality.com/gold-rate/${city.slug}`;
  meta.alternates = {
    canonical: url,
    languages: {
      'en-IN': url,
      'x-default': url,
    },
  };
  return meta;
}

export const revalidate = 900;

export default async function GoldRateCityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  let historyRows: GoldHistoryRow[] = [];
  try {
    historyRows = await query<GoldHistoryRow>(`SELECT gp.price_date, gp.gold_24k_per_gram, gp.gold_22k_per_gram, gp.gold_18k_per_gram,
              gp.gold_24k_per_10gram, gp.gold_22k_per_10gram, gp.change_amount, gp.change_percent
       FROM gold_prices gp
       JOIN cities c ON gp.city_id = c.id
       WHERE c.slug = $1
       ORDER BY gp.price_date DESC
       LIMIT 30`,
      [city.slug]
    );
  } catch (error) {
    console.error('Failed to fetch gold history:', error);
  }

  const today = historyRows[0];
  const ctx = await getCityMetalContext('gold', city.slug);
  const weekHistory = historyRows.slice(0, 7);
  const chartData = historyRows.map((r) => ({ date: r.price_date, price: r.gold_24k_per_gram })).reverse();

  const relatedCities = getRelatedCities(city.slug, 10);
  const cityLinks = relatedCities.map((c) => ({
    href: `/gold-rate/${c.slug}`,
    label: `Gold Rate in ${c.name}`,
    description: c.state,
  }));

  const r = (v: number): string => formatINR(Math.round(v));
  const faqs = [
    {
      question: `What is the gold rate in ${city.name} today?`,
      answer: today
        ? `24K gold in ${city.name} is ${formatINR(today.gold_24k_per_gram)} a gram and 22K is ${formatINR(today.gold_22k_per_gram)} a gram, as of ${formatDate(today.price_date)}. Ten grams of 22K costs ${formatINR(today.gold_22k_per_10gram)} before GST and making charges.`
        : `Today's rate for ${city.name} has not been published yet. It appears after the first update of the day, around 6:15 am.`,
    },
    {
      question: `Is gold cheaper in ${city.name} than in other cities?`,
      answer: ctx
        ? `Today 22K gold in ${city.name} is ${r(Math.abs(ctx.diffFromAvg))} a gram ${ctx.diffFromAvg >= 0 ? 'above' : 'below'} the average of the ${ctx.cityCount} cities we track, and ranks ${ctx.rank} from cheapest. The spread across India is small, ${r(ctx.dearest.price - ctx.cheapest.price)} a gram between ${ctx.cheapest.name} and ${ctx.dearest.name}, and comes from local jewellers' association rates and transport costs.`
        : 'City differences are small and come from local jewellers association rates and transport costs.',
    },
    {
      question: 'How much GST do I pay on gold jewellery?',
      answer: 'When you buy jewellery from a shop, 3% GST applies to the whole bill, the gold and the making charge together. A 5% rate applies only when you give your own gold to a jeweller to be made into something, because that is billed as job work.',
    },
    {
      question: `How do I know gold I buy in ${city.name} is pure?`,
      answer: 'Hallmarking is compulsory for gold jewellery in India. Every hallmarked piece carries the BIS mark, the purity grade (for example 22K916) and a six-character HUID code. Enter the HUID in the free BIS CARE app to see the purity, the jeweller and the testing centre.',
    },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[
        { label: 'Gold Rate', href: '/gold-rate' },
        { label: city.name },
      ]} />

      <h1 className="heading-1 mb-2">Gold Rate in {city.name} Today</h1>
      <p className="text-body mb-2">
        Latest available 22K and 24K gold prices in {city.name}, {city.state}.
        {today ? ` Last updated: ${formatDate(today.price_date)}.` : ''}
      </p>
      <p className="text-sm mb-6">
        <Link href="/dashboard/alerts" className="link-internal inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          Set a free price alert
        </Link>
        <span className="text-muted-2"> and we will email you when gold in {city.name} hits your target.</span>
      </p>

      <AdSlot placement="prices-top" format="horizontal" />

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

      {/* City analysis */}
      {ctx && today && (
        <section className="my-12 grid gap-6 lg:grid-cols-2">
          <div className="card-flat">
            <h2 className="heading-3">How {city.name} compares today</h2>
            <dl className="mt-5 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4"><dt className="text-muted">22K in {city.name}</dt><dd className="font-semibold tabular">{formatINR(ctx.cityPrice)} / g</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Average of {ctx.cityCount} cities</dt><dd className="tabular">{r(ctx.indiaAvg)} / g</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Difference</dt><dd className={`tabular font-medium ${ctx.diffFromAvg > 0 ? 'text-brand-red' : 'text-green-700'}`}>{ctx.diffFromAvg >= 0 ? '+' : '-'}{r(Math.abs(ctx.diffFromAvg))} / g</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Rank, cheapest first</dt><dd className="tabular">{ctx.rank} of {ctx.cityCount}</dd></div>
              {ctx.high30 && ctx.low30 && (
                <div className="flex justify-between gap-4"><dt className="text-muted">Range over the last {ctx.days} days</dt><dd className="tabular">{r(ctx.low30)} to {r(ctx.high30)}</dd></div>
              )}
            </dl>
            {ctx.statePeers.length > 0 && (
              <p className="mt-5 pt-4 border-t border-line text-sm text-muted leading-relaxed">
                Elsewhere in {city.state}:{' '}
                {ctx.statePeers.map((s, i) => (
                  <span key={s.slug}>{i > 0 ? ', ' : ''}<Link href={`/gold-rate/${s.slug}`} className="link-internal">{s.name}</Link> {r(s.price)}</span>
                ))}.
              </p>
            )}
          </div>

          <div className="card-flat">
            <h2 className="heading-3">What 10 grams of 22K jewellery costs in {city.name}</h2>
            <p className="mt-2 text-sm text-muted">An example at today&apos;s rate with a 12% making charge. The making charge varies a lot with the design, so ask the shop for its figure and put it in place of ours.</p>
            {(() => {
              const b = jewelleryBill(today.gold_22k_per_gram, 10, 12);
              return (
                <dl className="mt-5 space-y-3 text-[15px]">
                  <div className="flex justify-between gap-4"><dt className="text-muted">Gold, 10 g at {formatINR(today.gold_22k_per_gram)}</dt><dd className="tabular">{r(b.gold)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted">Making charge, 12%</dt><dd className="tabular">{r(b.making)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted">GST, 3% on both</dt><dd className="tabular">{r(b.gst)}</dd></div>
                  <div className="flex justify-between gap-4 pt-3 border-t border-line"><dt className="font-medium">You pay</dt><dd className="font-semibold tabular">{r(b.total)}</dd></div>
                </dl>
              );
            })()}
            <p className="mt-4 text-sm text-muted">Ask for a bill that lists weight, rate, making charge and GST on separate lines, and check the HUID on the piece.</p>
          </div>
        </section>
      )}

      <article className="max-w-3xl my-10 prose">
        <h2>Buying gold in {city.name}</h2>
        <p>
          {`The rate on this page is for pure metal, before GST and making charges. It is what a jeweller in ${city.name} starts from, and what most shops write at the top of the bill. Local jewellers' associations in ${city.state} publish their own morning rate, so the number at the counter can be a little different from ours; we update five times a day to stay close to it.`}
        </p>
        <p>
          For jewellery, 22K (91.6% pure) is the usual choice because pure gold is too soft to hold stones. For coins and bars, 24K is better value because there is almost no making charge. If you want gold only as an investment, gold ETFs and gold mutual funds follow the same price with no making charge and nothing to store.
        </p>
      </article>

      <ShareButton url={`/gold-rate/${city.slug}`} title={`Gold Rate in ${city.name} Today`} />

      <NextStep
        title="Planning a gold purchase?"
        text="See what your budget buys at today's rate with the gold planner, or set a free alert and we will email you when gold reaches the price you are waiting for."
        links={[
          { href: '/calculators/gold-planner', label: 'Open the gold planner', primary: true },
          { href: '/dashboard/alerts', label: 'Set a price alert' },
        ]}
      />
      <InternalLinks title={`Gold Rate in Other Cities`} links={cityLinks} columns={3} />

      <FAQ items={faqs} />

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}

/** Adds " | Paisa Reality" to the title when it still fits 60 chars. */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return brandMetadata(await buildMetadata(props));
}
