import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { getCityBySlug } from '@/lib/cities';
import {
  ALERT_LIMITS,
  isAlertCommodity,
  isAlertDirection,
  isSaneTarget,
} from '@/lib/price-alerts-core';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

interface AlertRow extends QueryResultRow {
  id: number;
  commodity: string;
  city_slug: string;
  direction: string;
  target_price: number;
  active: boolean;
  triggered_at: string | null;
  triggered_price: number | null;
  created_at: string;
}

const MIGRATION_HINT = 'Alerts are not set up yet. Run: npm run db:migrate-alerts';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const rows = await query<AlertRow>(
      `SELECT id, commodity, city_slug, direction, target_price, active,
              triggered_at::text AS triggered_at, triggered_price, created_at::text AS created_at
       FROM price_alerts WHERE user_id = $1 ORDER BY active DESC, created_at DESC LIMIT 50`,
      [auth.user.userId]
    );
    const alerts = rows.map((r) => ({ ...r, city_name: getCityBySlug(r.city_slug)?.name ?? r.city_slug }));
    const limit = ALERT_LIMITS[auth.user.plan] ?? ALERT_LIMITS.free;
    return NextResponse.json({ success: true, alerts, limit, active: alerts.filter((a) => a.active).length });
  } catch {
    return NextResponse.json({ success: false, error: MIGRATION_HINT }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  let body: { commodity?: unknown; citySlug?: unknown; direction?: unknown; targetPrice?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const commodity = body.commodity;
  const direction = body.direction;
  const citySlug = String(body.citySlug ?? '');
  const targetPrice = Number(body.targetPrice);

  if (!isAlertCommodity(commodity)) {
    return NextResponse.json({ success: false, error: 'Pick 24K gold, 22K gold, or silver.' }, { status: 400 });
  }
  if (!isAlertDirection(direction)) {
    return NextResponse.json({ success: false, error: 'Direction must be below or above.' }, { status: 400 });
  }
  if (!getCityBySlug(citySlug)) {
    return NextResponse.json({ success: false, error: 'Unknown city.' }, { status: 400 });
  }
  if (!isSaneTarget(commodity, targetPrice)) {
    return NextResponse.json(
      { success: false, error: 'That target looks off. Gold targets are per gram (Rs 1,000 to 1,00,000); silver Rs 10 to 2,000 per gram.' },
      { status: 400 }
    );
  }

  try {
    const limit = ALERT_LIMITS[auth.user.plan] ?? ALERT_LIMITS.free;
    const countRows = await query<QueryResultRow & { n: number }>(
      'SELECT count(*)::int AS n FROM price_alerts WHERE user_id = $1 AND active',
      [auth.user.userId]
    );
    if ((countRows[0]?.n ?? 0) >= limit) {
      return NextResponse.json(
        { success: false, error: `You have reached your limit of ${limit} active alerts${auth.user.plan === 'free' ? ' on the free plan. Upgrade for more, or delete an old alert.' : '. Delete an old alert first.'}` },
        { status: 400 }
      );
    }

    await execute(
      `INSERT INTO price_alerts (user_id, commodity, city_slug, direction, target_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [auth.user.userId, commodity, citySlug, direction, targetPrice]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: MIGRATION_HINT }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Alert id required.' }, { status: 400 });
  }

  try {
    const res = await execute('DELETE FROM price_alerts WHERE id = $1 AND user_id = $2', [id, auth.user.userId]);
    return NextResponse.json({ success: true, deleted: res.rowCount });
  } catch {
    return NextResponse.json({ success: false, error: MIGRATION_HINT }, { status: 500 });
  }
}
