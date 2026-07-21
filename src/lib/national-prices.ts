/**
 * National daily rollup for gold and silver, powering the "gold/silver rate
 * today in India" hub headline and trend. The national figure is the average
 * across our tracked cities (basis 'city_avg'); the metal_national_daily table
 * is backfilled by scripts/pg-prices-hub.sql and kept current by
 * refreshNationalDaily() on each price cron run.
 */
import { query, execute } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export interface NationalSnapshot {
  metal: 'gold' | 'silver';
  priceDate: string;
  k24PerGram: number | null;
  k22PerGram: number | null;
  k24Per10gram: number | null;
  perGram: number | null;
  perKg: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  changeAmount: number | null;
  changePercent: number | null;
  source: string | null;
}

interface NationalRow extends QueryResultRow {
  metal: 'gold' | 'silver';
  price_date: string;
  k24_per_gram: string | null;
  k22_per_gram: string | null;
  k24_per_10gram: string | null;
  per_gram: string | null;
  per_kg: string | null;
  day_high: string | null;
  day_low: string | null;
  change_amount: string | null;
  change_percent: string | null;
  source: string | null;
}

const num = (v: string | null): number | null => (v == null ? null : Number(v));

function toSnapshot(r: NationalRow): NationalSnapshot {
  return {
    metal: r.metal,
    priceDate: r.price_date,
    k24PerGram: num(r.k24_per_gram),
    k22PerGram: num(r.k22_per_gram),
    k24Per10gram: num(r.k24_per_10gram),
    perGram: num(r.per_gram),
    perKg: num(r.per_kg),
    dayHigh: num(r.day_high),
    dayLow: num(r.day_low),
    changeAmount: num(r.change_amount),
    changePercent: num(r.change_percent),
    source: r.source,
  };
}

const SELECT_COLS = `metal, price_date::text AS price_date, k24_per_gram, k22_per_gram, k24_per_10gram,
  per_gram, per_kg, day_high, day_low, change_amount, change_percent, source`;

/** Latest national row for a metal, or null if the rollup is not populated yet. */
export async function getNationalSnapshot(metal: 'gold' | 'silver'): Promise<NationalSnapshot | null> {
  const rows = await query<NationalRow>(
    `SELECT ${SELECT_COLS} FROM metal_national_daily WHERE metal = $1 ORDER BY price_date DESC LIMIT 1`,
    [metal],
  );
  return rows[0] ? toSnapshot(rows[0]) : null;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

/** Ascending daily series (per gram) for the trend chart; most recent `days` points. */
export async function getNationalSeries(metal: 'gold' | 'silver', days = 90): Promise<SeriesPoint[]> {
  const limit = Math.max(1, Math.min(365, Math.floor(days)));
  const rows = await query<QueryResultRow & { d: string; v: string | null }>(
    `SELECT price_date::text AS d, per_gram AS v FROM metal_national_daily
     WHERE metal = $1 AND per_gram IS NOT NULL ORDER BY price_date DESC LIMIT $2`,
    [metal, limit],
  );
  return rows
    .map((r) => ({ date: r.d, value: Number(r.v) }))
    .filter((p) => Number.isFinite(p.value))
    .reverse();
}

/**
 * Recompute today's national rollup from the freshly written per-city prices,
 * then refresh the day-over-day change on the latest row. Idempotent; called
 * from the price cron. Best-effort: callers should not fail if this throws.
 */
export async function refreshNationalDaily(): Promise<void> {
  await execute(
    `INSERT INTO metal_national_daily
       (metal, price_date, k24_per_gram, k22_per_gram, k24_per_10gram, per_gram, day_high, day_low, basis, source, data_as_of)
     SELECT 'gold', price_date,
       ROUND(AVG(gold_24k_per_gram)::numeric, 2), ROUND(AVG(gold_22k_per_gram)::numeric, 2),
       ROUND(AVG(gold_24k_per_10gram)::numeric, 2), ROUND(AVG(gold_24k_per_gram)::numeric, 2),
       ROUND(MAX(gold_24k_per_gram)::numeric, 2), ROUND(MIN(gold_24k_per_gram)::numeric, 2),
       'city_avg', 'Paisa Reality tracked-city average', price_date
     FROM gold_prices WHERE price_date = (SELECT MAX(price_date) FROM gold_prices)
     GROUP BY price_date
     ON CONFLICT (metal, price_date) DO UPDATE SET
       k24_per_gram = EXCLUDED.k24_per_gram, k22_per_gram = EXCLUDED.k22_per_gram,
       k24_per_10gram = EXCLUDED.k24_per_10gram, per_gram = EXCLUDED.per_gram,
       day_high = EXCLUDED.day_high, day_low = EXCLUDED.day_low,
       source = EXCLUDED.source, data_as_of = EXCLUDED.data_as_of, updated_at = NOW()`,
  );
  await execute(
    `INSERT INTO metal_national_daily
       (metal, price_date, per_gram, per_kg, day_high, day_low, basis, source, data_as_of)
     SELECT 'silver', price_date,
       ROUND(AVG(silver_per_gram)::numeric, 2), ROUND(AVG(silver_per_kg)::numeric, 2),
       ROUND(MAX(silver_per_kg)::numeric, 2), ROUND(MIN(silver_per_kg)::numeric, 2),
       'city_avg', 'Paisa Reality tracked-city average', price_date
     FROM silver_prices WHERE price_date = (SELECT MAX(price_date) FROM silver_prices)
     GROUP BY price_date
     ON CONFLICT (metal, price_date) DO UPDATE SET
       per_gram = EXCLUDED.per_gram, per_kg = EXCLUDED.per_kg,
       day_high = EXCLUDED.day_high, day_low = EXCLUDED.day_low,
       source = EXCLUDED.source, data_as_of = EXCLUDED.data_as_of, updated_at = NOW()`,
  );
  // Refresh day-over-day change on the latest row of each metal.
  await execute(
    `WITH g AS (
       SELECT price_date, per_gram AS v, LAG(per_gram) OVER (ORDER BY price_date) AS prev
       FROM metal_national_daily WHERE metal = 'gold'
     )
     UPDATE metal_national_daily m SET
       change_amount = ROUND((g.v - g.prev)::numeric, 2),
       change_percent = CASE WHEN g.prev > 0 THEN ROUND(((g.v - g.prev) / g.prev * 100)::numeric, 2) ELSE 0 END
     FROM g
     WHERE m.metal = 'gold' AND m.price_date = g.price_date
       AND m.price_date = (SELECT MAX(price_date) FROM metal_national_daily WHERE metal = 'gold')
       AND g.prev IS NOT NULL`,
  );
  await execute(
    `WITH s AS (
       SELECT price_date, per_kg AS v, LAG(per_kg) OVER (ORDER BY price_date) AS prev
       FROM metal_national_daily WHERE metal = 'silver'
     )
     UPDATE metal_national_daily m SET
       change_amount = ROUND((s.v - s.prev)::numeric, 2),
       change_percent = CASE WHEN s.prev > 0 THEN ROUND(((s.v - s.prev) / s.prev * 100)::numeric, 2) ELSE 0 END
     FROM s
     WHERE m.metal = 'silver' AND m.price_date = s.price_date
       AND m.price_date = (SELECT MAX(price_date) FROM metal_national_daily WHERE metal = 'silver')
       AND s.prev IS NOT NULL`,
  );
}
