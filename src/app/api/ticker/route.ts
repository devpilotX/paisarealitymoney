import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RBI_RATES, SMALL_SAVINGS } from '@/lib/policy-rates';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

export interface TickerItem {
  label: string;
  value: number;
  unit: string;
  change: number | null;
  href: string;
  decimals: number;
}

interface Row extends QueryResultRow {
  g24: string | null; g24_prev: string | null;
  silver: string | null; silver_prev: string | null;
  petrol: string | null; petrol_chg: string | null;
  diesel: string | null; diesel_chg: string | null;
  lpg: string | null;
  as_of: string | null;
}

/**
 * The few numbers shown in the site-wide ticker strip: India averages for gold and
 * silver (per gram, across tracked cities), Delhi fuel and LPG, and policy rates.
 * Cached for five minutes at the edge; the price cron runs five times a day.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const rows = await query<Row>(`
      WITH gd AS (SELECT DISTINCT price_date FROM gold_prices ORDER BY price_date DESC LIMIT 2),
           sd AS (SELECT DISTINCT price_date FROM silver_prices ORDER BY price_date DESC LIMIT 2),
           delhi AS (SELECT id FROM cities WHERE slug = 'delhi')
      SELECT
        (SELECT AVG(gold_24k_per_gram) FROM gold_prices WHERE price_date = (SELECT MAX(price_date) FROM gd))::numeric(12,2) AS g24,
        (SELECT AVG(gold_24k_per_gram) FROM gold_prices WHERE price_date = (SELECT MIN(price_date) FROM gd) AND (SELECT count(*) FROM gd) = 2)::numeric(12,2) AS g24_prev,
        (SELECT AVG(silver_per_gram) FROM silver_prices WHERE price_date = (SELECT MAX(price_date) FROM sd))::numeric(12,2) AS silver,
        (SELECT AVG(silver_per_gram) FROM silver_prices WHERE price_date = (SELECT MIN(price_date) FROM sd) AND (SELECT count(*) FROM sd) = 2)::numeric(12,2) AS silver_prev,
        (SELECT petrol_price FROM fuel_prices WHERE city_id = (SELECT id FROM delhi) ORDER BY price_date DESC LIMIT 1) AS petrol,
        (SELECT petrol_change FROM fuel_prices WHERE city_id = (SELECT id FROM delhi) ORDER BY price_date DESC LIMIT 1) AS petrol_chg,
        (SELECT diesel_price FROM fuel_prices WHERE city_id = (SELECT id FROM delhi) ORDER BY price_date DESC LIMIT 1) AS diesel,
        (SELECT diesel_change FROM fuel_prices WHERE city_id = (SELECT id FROM delhi) ORDER BY price_date DESC LIMIT 1) AS diesel_chg,
        (SELECT domestic_14kg FROM lpg_prices WHERE state = 'Delhi' ORDER BY price_date DESC LIMIT 1) AS lpg,
        (SELECT MAX(price_date)::text FROM gold_prices) AS as_of
    `);
    const r = rows[0];
    const num = (v: string | null | undefined): number | null => (v == null ? null : Number(v));
    // No change is shown when there is no earlier day, and a daily move over 15% is treated
    // as a data error rather than printed next to the price.
    const pct = (now: number | null, prev: number | null): number | null => {
      if (now == null || prev == null || prev <= 0) return null;
      const v = ((now - prev) / prev) * 100;
      return Math.abs(v) > 15 ? null : v;
    };

    const items: TickerItem[] = [];
    const g24 = num(r?.g24);
    if (g24) items.push({ label: 'Gold 24K', value: g24, unit: '/g', change: pct(g24, num(r?.g24_prev)), href: '/gold-rate', decimals: 0 });
    const silver = num(r?.silver);
    if (silver) items.push({ label: 'Silver', value: silver * 1000, unit: '/kg', change: pct(silver, num(r?.silver_prev)), href: '/silver-rate', decimals: 0 });
    const petrol = num(r?.petrol);
    if (petrol) items.push({ label: 'Petrol, Delhi', value: petrol, unit: '/L', change: pct(petrol, petrol - (num(r?.petrol_chg) ?? 0)), href: '/petrol-price/delhi', decimals: 2 });
    const diesel = num(r?.diesel);
    if (diesel) items.push({ label: 'Diesel, Delhi', value: diesel, unit: '/L', change: pct(diesel, diesel - (num(r?.diesel_chg) ?? 0)), href: '/diesel-price/delhi', decimals: 2 });
    const lpg = num(r?.lpg);
    if (lpg) items.push({ label: 'LPG, Delhi', value: lpg, unit: '', change: null, href: '/lpg-price', decimals: 0 });

    const repo = RBI_RATES.find((x) => x.name === 'Repo rate');
    if (repo) items.push({ label: 'RBI repo', value: repo.ratePct, unit: '%', change: null, href: '/interest-rates', decimals: 2 });
    const ppf = SMALL_SAVINGS.find((x) => x.name.startsWith('Public Provident Fund'));
    if (ppf) items.push({ label: 'PPF', value: ppf.ratePct, unit: '%', change: null, href: '/interest-rates', decimals: 1 });

    return NextResponse.json(
      { success: true, asOf: r?.as_of ?? null, items },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } },
    );
  } catch {
    return NextResponse.json({ success: false, items: [] }, { status: 503 });
  }
}
