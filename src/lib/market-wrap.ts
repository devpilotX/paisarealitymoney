/** Database side of the weekly wrap; the text itself is built in market-wrap-core.ts. */
import { query, execute } from '@/lib/db';
import { composeWrap, type DayAvg, type Wrap, type WrapData } from '@/lib/market-wrap-core';
import type { QueryResultRow } from 'pg';

export type { Wrap };

interface AvgRow extends QueryResultRow { d: string; v: string }
const toSeries = (rows: AvgRow[]): DayAvg[] => rows.map((r) => ({ date: r.d, value: Number(r.v) }));

export async function gatherWrapData(): Promise<WrapData> {
  const window = `price_date > (SELECT max(price_date) FROM gold_prices) - 7`;
  const gold24 = await query<AvgRow>(`SELECT to_char(price_date,'YYYY-MM-DD') d, avg(gold_24k_per_10gram) v FROM gold_prices WHERE ${window} GROUP BY price_date ORDER BY price_date`);
  const gold22 = await query<AvgRow>(`SELECT to_char(price_date,'YYYY-MM-DD') d, avg(gold_22k_per_10gram) v FROM gold_prices WHERE ${window} GROUP BY price_date ORDER BY price_date`);
  const silver = await query<AvgRow>(`SELECT to_char(price_date,'YYYY-MM-DD') d, avg(silver_per_kg) v FROM silver_prices WHERE ${window} GROUP BY price_date ORDER BY price_date`);
  const [cities] = await query<{ n: string } & QueryResultRow>(`SELECT count(*) n FROM gold_prices WHERE price_date = (SELECT max(price_date) FROM gold_prices)`);
  const fuel = await query<{ city: string; slug: string; p: string; di: string; pw: string | null; dw: string | null } & QueryResultRow>(
    `SELECT c.name city, c.slug, n.petrol_price p, n.diesel_price di, w.petrol_price pw, w.diesel_price dw
       FROM cities c
       JOIN LATERAL (SELECT petrol_price, diesel_price, price_date FROM fuel_prices WHERE city_id = c.id ORDER BY price_date DESC LIMIT 1) n ON true
       LEFT JOIN LATERAL (SELECT petrol_price, diesel_price FROM fuel_prices WHERE city_id = c.id AND price_date <= n.price_date - 7 ORDER BY price_date DESC LIMIT 1) w ON true
      WHERE c.slug IN ('delhi','mumbai','kolkata','chennai')
      ORDER BY array_position(ARRAY['delhi','mumbai','kolkata','chennai'], c.slug::text)`);
  const lpg = await query<{ now: string; wk: string | null } & QueryResultRow>(
    `SELECT n.domestic_14kg now, (SELECT domestic_14kg FROM lpg_prices WHERE state = 'Delhi' AND price_date <= n.price_date - 7 ORDER BY price_date DESC LIMIT 1) wk
       FROM (SELECT domestic_14kg, price_date FROM lpg_prices WHERE state = 'Delhi' ORDER BY price_date DESC LIMIT 1) n`);
  const deadlines = await query<{ kind: 'scholarship' | 'grant'; name: string; slug: string; deadline: string } & QueryResultRow>(
    `SELECT 'scholarship' kind, name, slug, to_char(deadline,'YYYY-MM-DD') deadline FROM scholarships
      WHERE active AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
     UNION ALL
     SELECT 'grant', name, slug, to_char(deadline,'YYYY-MM-DD') FROM grants
      WHERE active AND hidden_reason IS NULL AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
     ORDER BY 4 LIMIT 12`);
  return {
    cityCount: Number(cities?.n ?? 0),
    gold24: toSeries(gold24),
    gold22: toSeries(gold22),
    silverKg: toSeries(silver),
    fuel: fuel.map((f) => ({ city: f.city, slug: f.slug, petrol: Number(f.p), diesel: Number(f.di), petrolWeekAgo: f.pw === null ? null : Number(f.pw), dieselWeekAgo: f.dw === null ? null : Number(f.dw) })),
    lpgDelhi: lpg[0] ? { now: Number(lpg[0].now), weekAgo: lpg[0].wk === null ? null : Number(lpg[0].wk) } : null,
    deadlines,
  };
}

/** Write (or refresh) this week's post. Returns null when there is not a full week of prices yet. */
export async function publishWeeklyWrap(): Promise<Wrap | null> {
  const wrap = composeWrap(await gatherWrapData());
  if (!wrap) return null;
  const words = wrap.content.split(/\s+/).length;
  await execute(
    `INSERT INTO blog_posts (slug, title, description, content, category, tags, author, read_time, is_published, meta_title, meta_description, published_at)
     VALUES ($1, $2, $3, $4, 'prices', $5::jsonb, 'Paisa Reality', $6, true, $7, $3, NOW())
     ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, content = EXCLUDED.content,
       meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description, read_time = EXCLUDED.read_time, updated_at = NOW()`,
    [wrap.slug, wrap.title, wrap.description, wrap.content, JSON.stringify(['gold', 'silver', 'fuel', 'weekly']), `${Math.max(2, Math.round(words / 200))} min read`, wrap.metaTitle],
  );
  return wrap;
}
