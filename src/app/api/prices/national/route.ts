import { NextRequest, NextResponse } from 'next/server';
import { getNationalSnapshot, getNationalSeries } from '@/lib/national-prices';

export const dynamic = 'force-dynamic';

/**
 * National gold/silver rollup: latest snapshot + a daily series for the trend.
 * GET /api/prices/national?metal=gold|silver&days=90
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const metalParam = request.nextUrl.searchParams.get('metal');
  const metal: 'gold' | 'silver' = metalParam === 'silver' ? 'silver' : 'gold';
  const daysRaw = Number(request.nextUrl.searchParams.get('days'));
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(365, Math.floor(daysRaw)) : 90;

  try {
    const [snapshot, series] = await Promise.all([
      getNationalSnapshot(metal),
      getNationalSeries(metal, days),
    ]);
    return NextResponse.json(
      { success: true, metal, snapshot, series },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch {
    return NextResponse.json({ success: false, error: 'National rollup unavailable' }, { status: 500 });
  }
}
