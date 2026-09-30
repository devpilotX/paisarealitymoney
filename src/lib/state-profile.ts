/**
 * Everything the state page needs that is specific to one state, so no two state
 * pages read alike: its own schemes, scholarships and grants, the cities we price
 * there, and its LPG rate. Fails soft section by section.
 */
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export interface StateScheme { slug: string; name: string; category: string; benefit: string; amountMax: number | null }
export interface StateCityPrice { slug: string; name: string; gold22: number | null; petrol: number | null; diesel: number | null }
export interface StateProfile {
  stateSchemes: StateScheme[];
  centralCount: number;
  centralTop: StateScheme[];
  categories: Array<{ category: string; n: number }>;
  scholarships: Array<{ slug: string; name: string; amountMax: number | null }>;
  grants: Array<{ slug: string; name: string; amountMax: number | null }>;
  cities: StateCityPrice[];
  lpg: { domestic: number; commercial: number | null; asOf: string | null } | null;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

interface SRow extends QueryResultRow { slug: string; name: string; category: string; benefit_summary: string | null; benefit_amount_max: number | null; level: string }

export async function getStateProfile(state: string): Promise<StateProfile> {
  const stateJson = JSON.stringify([state]);
  const [schemes, scholarships, grants, cities, lpg] = await Promise.all([
    safe(() => query<SRow>(
      `SELECT slug, name, category, benefit_summary, benefit_amount_max, level FROM schemes
        WHERE is_active AND (states IS NULL OR states @> $1::jsonb OR states @> '"all"'::jsonb)
        ORDER BY benefit_amount_max DESC NULLS LAST, name`, [stateJson]), [] as SRow[]),
    safe(() => query<QueryResultRow & { slug: string; name: string; amount_max: number | null }>(
      `SELECT slug, name, amount_max FROM scholarships WHERE active AND state = $1 ORDER BY amount_max DESC NULLS LAST, name`, [state]), []),
    safe(() => query<QueryResultRow & { slug: string; name: string; amount_max_inr: string | null }>(
      `SELECT slug, name, amount_max_inr FROM grants WHERE active AND state = $1
         AND (deadline IS NULL OR deadline >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date) ORDER BY name`, [state]), []),
    safe(() => query<QueryResultRow & { slug: string; name: string; g22: string | null; petrol: string | null; diesel: string | null }>(
      `SELECT c.slug, c.name,
              (SELECT gold_22k_per_gram FROM gold_prices WHERE city_id = c.id ORDER BY price_date DESC LIMIT 1) AS g22,
              (SELECT petrol_price FROM fuel_prices WHERE city_id = c.id ORDER BY price_date DESC LIMIT 1) AS petrol,
              (SELECT diesel_price FROM fuel_prices WHERE city_id = c.id ORDER BY price_date DESC LIMIT 1) AS diesel
         FROM cities c WHERE c.state = $1 ORDER BY c.is_metro DESC, c.name`, [state]), []),
    safe(() => query<QueryResultRow & { domestic_14kg: string; commercial_19kg: string | null; data_as_of: string | null }>(
      `SELECT domestic_14kg, commercial_19kg, data_as_of::text FROM lpg_prices WHERE state = $1 ORDER BY price_date DESC LIMIT 1`, [state]), []),
  ]);

  const map = (r: SRow): StateScheme => ({ slug: r.slug, name: r.name, category: r.category, benefit: r.benefit_summary ?? '', amountMax: r.benefit_amount_max });
  const own = schemes.filter((s) => s.level === 'state').map(map);
  const central = schemes.filter((s) => s.level !== 'state');
  const catMap = new Map<string, number>();
  for (const s of schemes) catMap.set(s.category, (catMap.get(s.category) ?? 0) + 1);
  const n = (v: string | null): number | null => (v == null ? null : Number(v));

  return {
    stateSchemes: own,
    centralCount: central.length,
    centralTop: central.slice(0, 4).map(map),
    categories: [...catMap.entries()].map(([category, count]) => ({ category, n: count })).sort((a, b) => b.n - a.n),
    scholarships: scholarships.map((s) => ({ slug: s.slug, name: s.name, amountMax: s.amount_max })),
    grants: grants.map((g) => ({ slug: g.slug, name: g.name, amountMax: n(g.amount_max_inr) })),
    cities: cities.map((c) => ({ slug: c.slug, name: c.name, gold22: n(c.g22), petrol: n(c.petrol), diesel: n(c.diesel) })),
    lpg: lpg[0] ? { domestic: Number(lpg[0].domestic_14kg), commercial: n(lpg[0].commercial_19kg), asOf: lpg[0].data_as_of } : null,
  };
}
