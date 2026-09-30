/**
 * Daily data-health report: everything on the site that can go out of date, in one
 * list. n8n calls /api/cron/health each morning and posts the result to Telegram.
 * This file is pure (tested); data-health.ts gathers the facts from the database.
 */
import { SMALL_SAVINGS_NEXT_REVISION, RBI_NEXT_MPC_ENDS, RBI_RATES_AS_OF } from './policy-rates';

export interface HealthFacts {
  today: string; // YYYY-MM-DD, IST
  latestPrice: Record<'gold' | 'silver' | 'fuel' | 'lpg', string | null>;
  banksStale: number; // banks whose newest rate is older than BANK_STALE_DAYS
  banksTotal: number;
  schemesUnverified: number; // active schemes not verified for SCHEME_STALE_DAYS
  scholarshipsPastDeadline: number; // still active although the deadline has passed
  linksFailing: Array<{ table: string; slug: string; status: string }>;
  pagesChanged: Array<{ table: string; slug: string }>;
}

export interface HealthIssue { level: 'fix' | 'review'; text: string }
export interface HealthReport { ok: boolean; issues: HealthIssue[]; facts: HealthFacts }

export const BANK_STALE_DAYS = 100;
export const SCHEME_STALE_DAYS = 180;
export const LINK_FAIL_REPORT = 3;

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from.slice(0, 10) + 'T00:00:00Z')) / 86_400_000);
}

export function evaluateHealth(f: HealthFacts, policy = { ssNext: SMALL_SAVINGS_NEXT_REVISION, mpcEnds: RBI_NEXT_MPC_ENDS, rbiAsOf: RBI_RATES_AS_OF }): HealthReport {
  const issues: HealthIssue[] = [];
  for (const [name, d] of Object.entries(f.latestPrice)) {
    if (!d) issues.push({ level: 'fix', text: `No ${name} prices at all` });
    else if (daysBetween(d, f.today) > 1) issues.push({ level: 'fix', text: `${name} prices last written ${d}, ${daysBetween(d, f.today)} days ago` });
  }
  if (f.today >= policy.ssNext) issues.push({ level: 'fix', text: `Small savings quarter from ${policy.ssNext} has started: check the DEA notification and update policy-rates.ts` });
  if (f.today > policy.mpcEnds && policy.rbiAsOf < policy.mpcEnds) issues.push({ level: 'fix', text: `RBI MPC ended ${policy.mpcEnds}: update the repo rate block in policy-rates.ts` });
  if (f.banksStale > 0) issues.push({ level: 'review', text: `${f.banksStale} of ${f.banksTotal} banks have rates older than ${BANK_STALE_DAYS} days` });
  if (f.schemesUnverified > 0) issues.push({ level: 'review', text: `${f.schemesUnverified} schemes not verified in ${SCHEME_STALE_DAYS} days` });
  if (f.scholarshipsPastDeadline > 0) issues.push({ level: 'review', text: `${f.scholarshipsPastDeadline} scholarships are past their deadline: set the next cycle's date or mark closed` });
  for (const l of f.linksFailing.slice(0, 15)) issues.push({ level: 'review', text: `Official link failing (${l.status}): /${l.table}/${l.slug}` });
  if (f.linksFailing.length > 15) issues.push({ level: 'review', text: `and ${f.linksFailing.length - 15} more failing links` });
  for (const p of f.pagesChanged.slice(0, 15)) issues.push({ level: 'review', text: `Official page changed, recheck the details: /${p.table}/${p.slug}` });
  if (f.pagesChanged.length > 15) issues.push({ level: 'review', text: `and ${f.pagesChanged.length - 15} more changed pages` });
  return { ok: !issues.some((i) => i.level === 'fix'), issues, facts: f };
}
