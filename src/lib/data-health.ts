/** Gathers the facts for the daily data-health report; the rules are in data-health-core.ts. */
import { query } from '@/lib/db';
import { evaluateHealth, BANK_STALE_DAYS, SCHEME_STALE_DAYS, LINK_FAIL_REPORT, type HealthReport } from '@/lib/data-health-core';
import type { QueryResultRow } from 'pg';

function istToday(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

interface DateRow extends QueryResultRow { d: string | null }

export async function gatherHealth(): Promise<HealthReport> {
  const latest = async (t: string) => {
    // price_date is a DATE; format in SQL so the server time zone cannot shift it.
    const [r] = await query<DateRow>(`SELECT to_char(max(price_date), 'YYYY-MM-DD') AS d FROM ${t}`);
    return r?.d ?? null;
  };
  const [banks] = await query<{ stale: string; total: string } & QueryResultRow>(
    `SELECT count(*) FILTER (WHERE newest < CURRENT_DATE - $1::int) AS stale, count(*) AS total
       FROM (SELECT bank_id, max(effective_date) AS newest FROM bank_rates GROUP BY bank_id) b`, [BANK_STALE_DAYS]);
  const [schemes] = await query<{ n: string } & QueryResultRow>(
    `SELECT count(*) AS n FROM schemes WHERE is_active AND (last_verified IS NULL OR last_verified < CURRENT_DATE - $1::int)`, [SCHEME_STALE_DAYS]);
  const [sch] = await query<{ n: string } & QueryResultRow>(
    `SELECT count(*) AS n FROM scholarships WHERE active AND deadline IS NOT NULL AND deadline < CURRENT_DATE`);
  const failing = await query<{ table: string; slug: string; status: string } & QueryResultRow>(
    `SELECT 'schemes' AS table, slug, link_last_status AS status FROM schemes WHERE is_active AND link_failures >= $1
     UNION ALL
     SELECT 'scholarships', slug, link_last_status FROM scholarships WHERE active AND link_failures >= $1
     ORDER BY 2`, [LINK_FAIL_REPORT]);
  const changed = await query<{ table: string; slug: string } & QueryResultRow>(
    `SELECT 'schemes' AS table, slug FROM schemes WHERE is_active AND content_changed_at > NOW() - INTERVAL '7 days'
     UNION ALL
     SELECT 'scholarships', slug FROM scholarships WHERE active AND content_changed_at > NOW() - INTERVAL '7 days'
     UNION ALL
     SELECT 'grants', slug FROM grants WHERE content_changed_at > NOW() - INTERVAL '7 days'
     ORDER BY 2`);
  return evaluateHealth({
    today: istToday(),
    latestPrice: { gold: await latest('gold_prices'), silver: await latest('silver_prices'), fuel: await latest('fuel_prices'), lpg: await latest('lpg_prices') },
    banksStale: Number(banks?.stale ?? 0),
    banksTotal: Number(banks?.total ?? 0),
    schemesUnverified: Number(schemes?.n ?? 0),
    scholarshipsPastDeadline: Number(sch?.n ?? 0),
    linksFailing: failing,
    pagesChanged: changed,
  });
}
