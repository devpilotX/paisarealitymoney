import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

interface CountRow extends QueryResultRow { n: number }
interface SchemeRow extends QueryResultRow { total: number; central: number; state: number }
interface PostRow extends QueryResultRow { total: number; published: number }
interface DateRow extends QueryResultRow { d: string | null }

export async function GET(): Promise<NextResponse> {
  const ok = await verifyAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const schemes = (await query<SchemeRow>(
      "SELECT count(*)::int AS total, count(*) FILTER (WHERE level = 'central')::int AS central, count(*) FILTER (WHERE level = 'state')::int AS state FROM schemes WHERE is_active = TRUE",
    ))[0];
    const banks = (await query<CountRow>('SELECT count(*)::int AS n FROM banks'))[0];
    const bankRates = (await query<CountRow>('SELECT count(*)::int AS n FROM bank_rates'))[0];
    const cities = (await query<CountRow>('SELECT count(*)::int AS n FROM cities'))[0];
    const users = (await query<CountRow>('SELECT count(*)::int AS n FROM users'))[0];
    const posts = (await query<PostRow>(
      'SELECT count(*)::int AS total, count(*) FILTER (WHERE is_published)::int AS published FROM blog_posts',
    ))[0];
    const gold = (await query<DateRow>('SELECT max(price_date)::text AS d FROM gold_prices'))[0];
    const alerts = await query<CountRow>('SELECT count(*)::int AS n FROM price_alerts WHERE active')
      .then((rows) => rows[0]?.n ?? 0)
      .catch(() => 0);

    return NextResponse.json({
      schemes: { total: schemes?.total ?? 0, central: schemes?.central ?? 0, state: schemes?.state ?? 0 },
      banks: banks?.n ?? 0,
      bankRates: bankRates?.n ?? 0,
      cities: cities?.n ?? 0,
      users: users?.n ?? 0,
      activeAlerts: alerts,
      newsletterPosts: { total: posts?.total ?? 0, published: posts?.published ?? 0 },
      pricesUpdated: gold?.d ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
