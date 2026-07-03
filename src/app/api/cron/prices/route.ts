import { NextRequest, NextResponse } from 'next/server';
import { cacheClearAll } from '@/lib/cache';
import { execute, query } from '@/lib/db';
import { sendAdminAlert } from '@/lib/email';
import { checkPriceAlerts } from '@/lib/price-alerts';
import { FUEL_STALE_AFTER_DAYS, LPG_STALE_AFTER_DAYS } from '@/lib/fuel-data';
import {
  updateFuelPricesLive,
  updateGoldPricesLive,
  updateLpgPricesLive,
  updateSilverPricesLive,
  type UpdateResult,
} from '@/lib/price-providers';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALERT_THROTTLE_KEY = 'price_cron_last_alert';
const ALERT_THROTTLE_MS = 20 * 60 * 60 * 1000; // at most one alert per ~day

function daysSince(dateStr: string): number {
  const then = new Date(`${dateStr}T00:00:00Z`).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
}

/** Collect problems worth waking the admin for. */
function collectAlerts(results: Record<string, UpdateResult>): string[] {
  const problems: string[] = [];
  for (const [name, result] of Object.entries(results)) {
    if (!result.success) {
      problems.push(`${name} update FAILED: ${result.message}`);
    } else if (result.errors.length > 0) {
      problems.push(`${name}: ${result.errors.length} row error(s), first: ${result.errors[0]}`);
    }
  }
  const fuelAge = results.fuel?.dataAsOf ? daysSince(results.fuel.dataAsOf) : null;
  if (fuelAge !== null && fuelAge > FUEL_STALE_AFTER_DAYS) {
    problems.push(
      `Fuel data is ${fuelAge} days old (verified ${results.fuel?.dataAsOf}). Update the baseline in src/lib/fuel-data.ts or POST an override to /api/admin/prices/overrides.`
    );
  }
  const lpgAge = results.lpg?.dataAsOf ? daysSince(results.lpg.dataAsOf) : null;
  if (lpgAge !== null && lpgAge > LPG_STALE_AFTER_DAYS) {
    problems.push(
      `LPG data is ${lpgAge} days old (verified ${results.lpg?.dataAsOf}). LPG revises on the 1st of each month; refresh the baseline or set an override.`
    );
  }
  return problems;
}

/** True when we have not alerted within the throttle window. Fails open silently. */
async function shouldSendAlert(): Promise<boolean> {
  try {
    const rows = await query<QueryResultRow & { value: { at?: string } }>(
      'SELECT value FROM system_meta WHERE key = $1',
      [ALERT_THROTTLE_KEY]
    );
    const last = rows[0]?.value?.at ? new Date(rows[0].value.at).getTime() : 0;
    return Date.now() - last > ALERT_THROTTLE_MS;
  } catch {
    // system_meta may not exist yet; alert rather than stay silent.
    return true;
  }
}

async function markAlertSent(): Promise<void> {
  try {
    await execute(
      `INSERT INTO system_meta (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [ALERT_THROTTLE_KEY, JSON.stringify({ at: new Date().toISOString() })]
    );
  } catch {
    // best effort; a missing table just means alerts are unthrottled
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Record<string, UpdateResult> = {
    gold: await updateGoldPricesLive(),
    silver: await updateSilverPricesLive(),
    fuel: await updateFuelPricesLive(),
    lpg: await updateLpgPricesLive(),
  };

  cacheClearAll();

  // Fresh prices are in — evaluate user price alerts against them.
  const userAlerts = await checkPriceAlerts();

  const problems = collectAlerts(results);
  if (userAlerts.errors.length > 0) {
    problems.push(`Price alerts: ${userAlerts.errors.length} error(s), first: ${userAlerts.errors[0]}`);
  }
  let alerted = false;
  if (problems.length > 0 && (await shouldSendAlert())) {
    alerted = await sendAdminAlert('Price data needs attention', problems);
    if (alerted) await markAlertSent();
  }

  return NextResponse.json({
    success: Object.values(results).every((result) => result.success),
    duration: `${Date.now() - startTime}ms`,
    updatedAt: new Date().toISOString(),
    problems,
    alerted,
    userAlerts,
    results,
  });
}
