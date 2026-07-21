import { NextRequest, NextResponse } from 'next/server';
import { cacheClearAll } from '@/lib/cache';
import { execute, query } from '@/lib/db';
import { escapeHtml, getAppUrl, sendAdminAlert, sendEmail } from '@/lib/email';
import { checkPriceAlerts } from '@/lib/price-alerts';
import { revalidatePriceRoutes } from '@/lib/revalidate-prices';
import { checkMetalDrift } from '@/lib/price-drift';
import { refreshNationalDaily } from '@/lib/national-prices';
import { getDueScholarshipReminders, markReminderSent, type DueReminder } from '@/lib/scholarships';
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

function scholarshipReminderHtml(r: DueReminder): string {
  const url = `${getAppUrl()}/scholarships/${r.slug}`;
  const official = r.official_url
    ? `<p style="margin:12px 0">Apply on the official portal: <a href="${r.official_url}" style="color:#007A78">${escapeHtml(r.official_url)}</a></p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px">
    <h2 style="color:#007A78;font-size:22px;margin:0 0 8px">${escapeHtml(r.name)}</h2>
    <p style="margin:0 0 8px">This is your reminder: the application closes on <strong>${escapeHtml(r.deadline)}</strong>.</p>
    ${official}
    <p style="margin:12px 0"><a href="${url}" style="color:#007A78">View eligibility, documents and steps</a></p>
    <p style="color:#6b7280;font-size:13px;margin-top:16px">You asked Paisa Reality to remind you. Always verify the exact dates on the official portal.</p>
  </div>`;
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

  // Roll up the national gold/silver averages for the prices hub (best-effort).
  try {
    await refreshNationalDaily();
  } catch (err) {
    console.error('refreshNationalDaily failed:', err instanceof Error ? err.message : err);
  }

  cacheClearAll();

  // Purge the ISR full-route cache for every price page so the freshly written
  // prices show up on the very next request instead of after a lazy regen.
  const revalidatedRoutes = revalidatePriceRoutes();

  // Fresh prices are in — evaluate user price alerts against them.
  const userAlerts = await checkPriceAlerts();

  const problems = collectAlerts(results);

  // Self-policing accuracy: flag when our computed metal rates drift from an
  // independent published dealer benchmark (fail-open; never blocks the cron).
  try {
    const [gRows, sRows] = await Promise.all([
      query<QueryResultRow & { g: string | null }>(
        `SELECT AVG(gold_24k_per_gram)::numeric(12,2) AS g FROM gold_prices WHERE price_date = (SELECT MAX(price_date) FROM gold_prices)`
      ),
      query<QueryResultRow & { s: string | null }>(
        `SELECT AVG(silver_per_gram)::numeric(12,2) AS s FROM silver_prices WHERE price_date = (SELECT MAX(price_date) FROM silver_prices)`
      ),
    ]);
    const ourGold = gRows[0]?.g != null ? Number(gRows[0].g) : null;
    const ourSilver = sRows[0]?.s != null ? Number(sRows[0].s) : null;
    problems.push(...(await checkMetalDrift(ourGold, ourSilver)));
  } catch {
    // fail-open: drift monitoring must never break the price cron
  }

  if (userAlerts.errors.length > 0) {
    problems.push(`Price alerts: ${userAlerts.errors.length} error(s), first: ${userAlerts.errors[0]}`);
  }
  let alerted = false;
  if (problems.length > 0 && (await shouldSendAlert())) {
    alerted = await sendAdminAlert('Price data needs attention', problems);
    if (alerted) await markAlertSent();
  }

  // Scholarship deadline reminders (reuses the same daily cron + email pipeline).
  let scholarshipReminders = 0;
  try {
    const due = await getDueScholarshipReminders();
    for (const r of due) {
      const res = await sendEmail({
        to: r.email,
        subject: `Reminder: ${r.name} closes soon`,
        html: scholarshipReminderHtml(r),
      });
      if (res.ok) {
        await markReminderSent(r.id);
        scholarshipReminders += 1;
      }
    }
  } catch {
    // scholarship_reminders table may not be migrated yet; skip silently.
  }

  return NextResponse.json({
    success: Object.values(results).every((result) => result.success),
    duration: `${Date.now() - startTime}ms`,
    updatedAt: new Date().toISOString(),
    revalidatedRoutes,
    problems,
    alerted,
    scholarshipReminders,
    userAlerts,
    results,
  });
}
