import { NextRequest, NextResponse } from 'next/server';
import { cacheClearAll } from '@/lib/cache';
import {
  updateFuelPricesLive,
  updateGoldPricesLive,
  updateLpgPricesLive,
  updateSilverPricesLive,
} from '@/lib/price-providers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    gold: await updateGoldPricesLive(),
    silver: await updateSilverPricesLive(),
    fuel: await updateFuelPricesLive(),
    lpg: await updateLpgPricesLive(),
  };

  cacheClearAll();

  return NextResponse.json({
    success: Object.values(results).every((result) => result.success),
    duration: `${Date.now() - startTime}ms`,
    updatedAt: new Date().toISOString(),
    results,
  });
}
