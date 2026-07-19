import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { cacheClearAll } from '@/lib/cache';
import { checkPriceAlerts } from '@/lib/price-alerts';
import { revalidatePriceRoutes } from '@/lib/revalidate-prices';
import {
  updateFuelPricesLive,
  updateGoldPricesLive,
  updateLpgPricesLive,
  updateSilverPricesLive,
} from '@/lib/price-providers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Admin-authenticated price refresh — same work as the cron endpoint but
 * guarded by the admin session instead of CRON_SECRET, so the dashboard
 * button works without pasting a secret.
 */
export async function POST(): Promise<NextResponse> {
  const ok = await verifyAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const startTime = Date.now();
  const results = {
    gold: await updateGoldPricesLive(),
    silver: await updateSilverPricesLive(),
    fuel: await updateFuelPricesLive(),
    lpg: await updateLpgPricesLive(),
  };
  cacheClearAll();
  const revalidatedRoutes = revalidatePriceRoutes();
  const userAlerts = await checkPriceAlerts();

  return NextResponse.json({
    success: Object.values(results).every((r) => r.success),
    duration: `${Date.now() - startTime}ms`,
    revalidatedRoutes,
    userAlerts,
    results,
  });
}
