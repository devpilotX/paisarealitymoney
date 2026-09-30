/**
 * Data for the homepage, read from the same tables the detail pages use so the
 * homepage can never quote a figure the rest of the site disagrees with.
 * Every query fails soft: the homepage renders without a section rather than erroring.
 */
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export interface HomeRate {
  kind: 'gold24' | 'gold22' | 'silver' | 'petrol' | 'diesel' | 'lpg';
  label: string;
  value: number;
  unit: string;
  changePct: number | null;
  href: string;
  note: string;
}

export interface HomeCounts {
  schemes: number;
  scholarships: number;
  grants: number;
  banks: number;
  cities: number;
}

export interface HomeScheme {
  slug: string;
  name: string;
  category: string;
  benefit: string;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getHomeCounts(): Promise<HomeCounts> {
  const base = `(SELECT count(*) FROM schemes WHERE is_active)::int AS schemes,
                (SELECT count(*) FROM scholarships WHERE active)::int AS scholarships,
                (SELECT count(*) FROM banks)::int AS banks,
                (SELECT count(*) FROM cities)::int AS cities`;
  const empty = { schemes: 0, scholarships: 0, grants: 0, banks: 0, cities: 0 };
  // The grants table is newer than the rest; on a database without it, count the others.
  return safe(
    async () => (await query<QueryResultRow & HomeCounts>(
      `SELECT ${base}, (SELECT count(*) FROM grants WHERE active AND (deadline IS NULL OR deadline >= CURRENT_DATE))::int AS grants`,
    ))[0] ?? empty,
    null as HomeCounts | null,
  ).then((c) => c ?? safe(async () => (await query<QueryResultRow & HomeCounts>(`SELECT ${base}, 0 AS grants`))[0] ?? empty, empty));
}

interface RateRow extends QueryResultRow {
  price_date: string;
  written_at: string | null;
  g24: string | null; g24_prev: string | null;
  g22: string | null; g22_prev: string | null;
  silver: string | null; silver_prev: string | null;
  petrol: string | null; petrol_chg: string | null;
  diesel: string | null; diesel_chg: string | null; fuel_as_of: string | null;
  lpg: string | null; lpg_as_of: string | null;
}

export async function getHomeRates(): Promise<{ asOf: string | null; updatedAt: string | null; rates: HomeRate[] }> {
  return safe(async () => {
    const rows = await query<RateRow>(`
      WITH d AS (SELECT DISTINCT price_date FROM gold_prices ORDER BY price_date DESC LIMIT 2),
           cur AS (SELECT MAX(price_date) AS dt FROM d),
           prev AS (SELECT MIN(price_date) AS dt FROM d HAVING count(*) = 2),
           sd AS (SELECT DISTINCT price_date FROM silver_prices ORDER BY price_date DESC LIMIT 2),
           delhi AS (SELECT id FROM cities WHERE slug = 'delhi'),
           f AS (SELECT * FROM fuel_prices WHERE city_id = (SELECT id FROM delhi) ORDER BY price_date DESC LIMIT 1)
      SELECT (SELECT dt FROM cur)::text AS price_date,
        (SELECT MAX(created_at) FROM gold_prices WHERE price_date = (SELECT dt FROM cur))::text AS written_at,
        (SELECT AVG(gold_24k_per_gram) FROM gold_prices WHERE price_date = (SELECT dt FROM cur))::numeric(12,2) AS g24,
        (SELECT AVG(gold_24k_per_gram) FROM gold_prices WHERE price_date = (SELECT dt FROM prev))::numeric(12,2) AS g24_prev,
        (SELECT AVG(gold_22k_per_gram) FROM gold_prices WHERE price_date = (SELECT dt FROM cur))::numeric(12,2) AS g22,
        (SELECT AVG(gold_22k_per_gram) FROM gold_prices WHERE price_date = (SELECT dt FROM prev))::numeric(12,2) AS g22_prev,
        (SELECT AVG(silver_per_gram) FROM silver_prices WHERE price_date = (SELECT MAX(price_date) FROM sd))::numeric(12,2) AS silver,
        (SELECT AVG(silver_per_gram) FROM silver_prices WHERE price_date = (SELECT MIN(price_date) FROM sd) AND (SELECT count(*) FROM sd) = 2)::numeric(12,2) AS silver_prev,
        (SELECT petrol_price FROM f) AS petrol, (SELECT petrol_change FROM f) AS petrol_chg,
        (SELECT diesel_price FROM f) AS diesel, (SELECT diesel_change FROM f) AS diesel_chg,
        (SELECT data_as_of::text FROM f) AS fuel_as_of,
        (SELECT domestic_14kg FROM lpg_prices WHERE state = 'Delhi' ORDER BY price_date DESC LIMIT 1) AS lpg,
        (SELECT data_as_of::text FROM lpg_prices WHERE state = 'Delhi' ORDER BY price_date DESC LIMIT 1) AS lpg_as_of`);
    const r = rows[0];
    if (!r) return { asOf: null, updatedAt: null, rates: [] };
    const n = (v: string | null): number | null => (v == null ? null : Number(v));
    const pct = (a: number | null, b: number | null): number | null => {
      if (a == null || b == null || b <= 0) return null;
      const v = ((a - b) / b) * 100;
      return Math.abs(v) > 15 ? null : v; // a jump this size is a data error, not news
    };
    const rates: HomeRate[] = [];
    const g24 = n(r.g24), g22 = n(r.g22), s = n(r.silver), p = n(r.petrol), d = n(r.diesel), l = n(r.lpg);
    if (g24) rates.push({ kind: 'gold24', label: 'Gold 24K', value: g24, unit: 'per gram', changePct: pct(g24, n(r.g24_prev)), href: '/gold-rate', note: 'India average of 50 cities' });
    if (g22) rates.push({ kind: 'gold22', label: 'Gold 22K', value: g22, unit: 'per gram', changePct: pct(g22, n(r.g22_prev)), href: '/gold-rate', note: 'Jewellery gold, before making charges' });
    if (s) rates.push({ kind: 'silver', label: 'Silver', value: s * 1000, unit: 'per kg', changePct: pct(s, n(r.silver_prev)), href: '/silver-rate', note: 'India average of 50 cities' });
    if (p) rates.push({ kind: 'petrol', label: 'Petrol', value: p, unit: 'per litre', changePct: pct(p, p - (n(r.petrol_chg) ?? 0)), href: '/petrol-price', note: `Delhi, verified ${r.fuel_as_of ?? ''}`.trim() });
    if (d) rates.push({ kind: 'diesel', label: 'Diesel', value: d, unit: 'per litre', changePct: pct(d, d - (n(r.diesel_chg) ?? 0)), href: '/diesel-price', note: `Delhi, verified ${r.fuel_as_of ?? ''}`.trim() });
    if (l) rates.push({ kind: 'lpg', label: 'LPG cylinder', value: l, unit: '14.2 kg', changePct: null, href: '/lpg-price', note: `Delhi domestic, verified ${r.lpg_as_of ?? ''}`.trim() });
    return { asOf: r.price_date, updatedAt: r.written_at, rates };
  }, { asOf: null, updatedAt: null, rates: [] });
}

const FEATURED = ['pm-kisan', 'ayushman-bharat', 'pm-awas-yojana', 'sukanya-samriddhi', 'mudra-loan', 'pm-vishwakarma'];

export async function getFeaturedSchemes(): Promise<HomeScheme[]> {
  return safe(async () => {
    const rows = await query<QueryResultRow & { slug: string; name: string; category: string; benefit_summary: string | null }>(
      'SELECT slug, name, category, benefit_summary FROM schemes WHERE is_active AND slug = ANY($1)',
      [FEATURED],
    );
    const order = new Map(FEATURED.map((s, i) => [s, i]));
    return rows
      .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
      .map((r) => ({ slug: r.slug, name: r.name, category: r.category, benefit: r.benefit_summary ?? '' }));
  }, []);
}

export async function getSchemeCategoryCounts(limit = 4): Promise<Array<{ category: string; n: number }>> {
  return safe(async () => (await query<QueryResultRow & { category: string; n: number }>(
    'SELECT category, count(*)::int AS n FROM schemes WHERE is_active GROUP BY category ORDER BY n DESC LIMIT $1', [limit],
  )).map((r) => ({ category: r.category, n: r.n })), []);
}

export async function getTopScholarships(limit = 3): Promise<Array<{ name: string; amountMax: number | null; level: string }>> {
  return safe(async () => (await query<QueryResultRow & { name: string; amount_max: number | null; level: string }>(
    `SELECT name, amount_max, level FROM scholarships WHERE active AND amount_max IS NOT NULL
      ORDER BY amount_max DESC LIMIT $1`, [limit],
  )).map((r) => ({ name: r.name, amountMax: r.amount_max, level: r.level })), []);
}
/** The price update runs at these IST times (deploy/systemd/paisareality-prices.timer). */
const UPDATE_SLOTS = [[6, 15], [9, 15], [12, 15], [15, 15], [18, 15]] as const;

/** "3:15 pm today" or "6:15 am tomorrow", in IST. */
export function nextUpdateLabel(now: Date = new Date()): string {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const next = UPDATE_SLOTS.find(([h, m]) => h * 60 + m > mins);
  const [h, m] = next ?? UPDATE_SLOTS[0];
  const t = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
  return `${t} ${next ? 'today' : 'tomorrow'}`;
}