/**
 * Numbers that make each city's metal page its own: how the city compares with the
 * India average and with other cities in its state today, where it ranks, and its
 * own 30-day range. Fails soft to null.
 */
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export interface CityMetalContext {
  cityPrice: number;
  indiaAvg: number;
  diffFromAvg: number;
  rank: number;          // 1 = cheapest
  cityCount: number;
  cheapest: { name: string; slug: string; price: number };
  dearest: { name: string; slug: string; price: number };
  statePeers: Array<{ name: string; slug: string; price: number }>;
  high30: number | null;
  low30: number | null;
  days: number;
}

interface Row extends QueryResultRow { slug: string; name: string; state: string; price: string }

export async function getCityMetalContext(metal: 'gold' | 'silver', citySlug: string): Promise<CityMetalContext | null> {
  const table = metal === 'gold' ? 'gold_prices' : 'silver_prices';
  const col = metal === 'gold' ? 'gold_22k_per_gram' : 'silver_per_gram';
  try {
    const rows = await query<Row>(
      `SELECT c.slug, c.name, c.state, p.${col}::text AS price
         FROM ${table} p JOIN cities c ON c.id = p.city_id
        WHERE p.price_date = (SELECT MAX(price_date) FROM ${table})
        ORDER BY p.${col}, c.name`,
    );
    const me = rows.find((r) => r.slug === citySlug);
    if (!me || rows.length < 2) return null;
    const prices = rows.map((r) => Number(r.price));
    const indiaAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const cityPrice = Number(me.price);
    const range = await query<QueryResultRow & { hi: string | null; lo: string | null; n: string }>(
      `SELECT MAX(p.${col})::text AS hi, MIN(p.${col})::text AS lo, COUNT(*)::text AS n
         FROM ${table} p JOIN cities c ON c.id = p.city_id
        WHERE c.slug = $1 AND p.price_date > (SELECT MAX(price_date) FROM ${table}) - INTERVAL '30 days'`,
      [citySlug],
    );
    const pick = (r: Row): { name: string; slug: string; price: number } => ({ name: r.name, slug: r.slug, price: Number(r.price) });
    const days = Number(range[0]?.n ?? 0);
    return {
      cityPrice,
      indiaAvg,
      diffFromAvg: cityPrice - indiaAvg,
      rank: rows.findIndex((r) => r.slug === citySlug) + 1,
      cityCount: rows.length,
      cheapest: pick(rows[0]!),
      dearest: pick(rows[rows.length - 1]!),
      statePeers: rows.filter((r) => r.state === me.state && r.slug !== citySlug).map(pick),
      high30: days > 1 && range[0]?.hi ? Number(range[0].hi) : null,
      low30: days > 1 && range[0]?.lo ? Number(range[0].lo) : null,
      days,
    };
  } catch {
    return null;
  }
}

/**
 * What a jewellery purchase actually costs: gold value, making charge on the gold
 * value, and 3% GST on gold plus making (5% GST applies to making charges billed
 * separately as a job-work service, but a shop sale bills both at 3%).
 */
export function jewelleryBill(pricePerGram: number, grams: number, makingPct: number): {
  gold: number; making: number; gst: number; total: number;
} {
  const gold = pricePerGram * grams;
  const making = gold * (makingPct / 100);
  const gst = (gold + making) * 0.03;
  return { gold, making, gst, total: gold + making + gst };
}
