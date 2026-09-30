/**
 * Keeps the grants list honest without anyone editing it by hand.
 * Called from the price cron (/api/cron/prices), which runs five times a day.
 *
 * 1. Deadlines: a programme whose deadline is before today (IST) is hidden, with
 *    hidden_reason 'deadline passed'. The seed brings it back when it gets a new date.
 * 2. Links: each official_url and apply_url is fetched at most once a day. A page
 *    that answers 2xx or 3xx is fine. After LINK_FAILURE_LIMIT failed days in a row
 *    the programme is hidden with hidden_reason 'link failing', and the cron's admin
 *    alert names it. One good check later brings it back.
 *
 * Government portals are often slow and some refuse HEAD, so the check uses GET with
 * a real browser user agent and a generous timeout, and a single timeout never counts
 * as a hard failure on its own day.
 */
import { query, execute } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import { checkUrl } from './link-check';

export { checkUrl, isHealthyStatus } from './link-check';

export const LINK_FAILURE_LIMIT = 3;

export interface UpkeepResult {
  expired: string[];
  checked: number;
  hidden: string[];
  restored: string[];
  failing: string[];
}

interface GrantLinkRow extends QueryResultRow {
  id: number; slug: string; name: string; official_url: string; apply_url: string;
  active: boolean; hidden_reason: string | null; link_failures: number;
}

export async function runGrantsUpkeep(fetchImpl: typeof fetch = fetch): Promise<UpkeepResult> {
  const result: UpkeepResult = { expired: [], checked: 0, hidden: [], restored: [], failing: [] };

  const expired = await query<QueryResultRow & { slug: string }>(
    `UPDATE grants SET active = FALSE, hidden_reason = 'deadline passed', updated_at = NOW()
      WHERE active AND deadline IS NOT NULL AND deadline < (NOW() AT TIME ZONE 'Asia/Kolkata')::date
      RETURNING slug`,
  );
  result.expired = expired.map((r) => r.slug);

  // Once a day per programme; programmes hidden for a passed deadline are not rechecked.
  const due = await query<GrantLinkRow>(
    `SELECT id, slug, name, official_url, apply_url, active, hidden_reason, link_failures
       FROM grants
      WHERE (hidden_reason IS NULL OR hidden_reason = 'link failing')
        AND (link_checked_at IS NULL OR link_checked_at < NOW() - INTERVAL '20 hours')
      ORDER BY link_checked_at NULLS FIRST
      LIMIT 40`,
  );

  for (const g of due) {
    const urls = [...new Set([g.official_url, g.apply_url].filter(Boolean))];
    const checks = await Promise.all(urls.map((u) => checkUrl(u, fetchImpl)));
    result.checked++;
    const ok = checks.every((c) => c.ok);
    const status = checks.map((c, i) => `${urls[i]} ${c.status}`).join('; ');

    if (ok) {
      await execute(
        `UPDATE grants SET link_failures = 0, link_checked_at = NOW(), link_last_status = $2,
                active = CASE WHEN hidden_reason = 'link failing' THEN TRUE ELSE active END,
                hidden_reason = CASE WHEN hidden_reason = 'link failing' THEN NULL ELSE hidden_reason END
          WHERE id = $1`,
        [g.id, status],
      );
      if (g.hidden_reason === 'link failing') result.restored.push(g.slug);
      continue;
    }

    const failures = g.link_failures + 1;
    const hide = failures >= LINK_FAILURE_LIMIT;
    await execute(
      `UPDATE grants SET link_failures = $2, link_checked_at = NOW(), link_last_status = $3,
              active = CASE WHEN $4 THEN FALSE ELSE active END,
              hidden_reason = CASE WHEN $4 THEN 'link failing' ELSE hidden_reason END
        WHERE id = $1`,
      [g.id, failures, status, hide],
    );
    if (hide && g.active) result.hidden.push(`${g.name}: ${status}`);
    else if (!hide) result.failing.push(`${g.name} (${failures}/${LINK_FAILURE_LIMIT}): ${status}`);
  }
  return result;
}
