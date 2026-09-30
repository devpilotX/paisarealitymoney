/**
 * Official-link monitor for scheme and scholarship pages, run in batches by
 * /api/cron/links (n8n calls it every hour, 30 at a time). Each record is checked at most
 * once a day. Pages are never hidden automatically; failures and changed official
 * pages are reported so a person can review them.
 */
import { query, execute } from '@/lib/db';
import { checkUrl } from '@/lib/link-check';
import { LINK_FAIL_REPORT } from '@/lib/data-health-core';
import type { QueryResultRow } from 'pg';

export interface LinkBatchResult {
  checked: number;
  failing: Array<{ table: string; slug: string; name: string; status: string; failures: number }>;
  changed: Array<{ table: string; slug: string; name: string; url: string }>;
}

interface Row extends QueryResultRow {
  id: number; slug: string; name: string; url: string | null; link_failures: number; content_hash: string | null;
}

const TABLES = [
  { table: 'schemes', url: 'COALESCE(official_url, apply_url)', live: 'is_active' },
  { table: 'scholarships', url: 'official_url', live: 'active' },
] as const;

/** Run up to `limit` due checks, `concurrency` at a time. */
export async function runLinkBatch(limit = 30, concurrency = 10, fetchImpl: typeof fetch = fetch): Promise<LinkBatchResult> {
  const out: LinkBatchResult = { checked: 0, failing: [], changed: [] };
  const due: Array<Row & { table: string }> = [];
  for (const t of TABLES) {
    const rows = await query<Row>(
      `SELECT id, slug, name, ${t.url} AS url, link_failures, content_hash FROM ${t.table}
        WHERE ${t.live} AND ${t.url} IS NOT NULL
          AND (link_checked_at IS NULL OR link_checked_at < NOW() - INTERVAL '20 hours')
        ORDER BY link_checked_at NULLS FIRST LIMIT $1`, [limit]);
    due.push(...rows.map((r) => ({ ...r, table: t.table })));
  }
  due.splice(limit);

  for (let i = 0; i < due.length; i += concurrency) {
    await Promise.all(due.slice(i, i + concurrency).map(async (r) => {
      const res = await checkUrl(r.url!, fetchImpl, { hash: true });
      out.checked++;
      const failures = res.ok ? 0 : r.link_failures + 1;
      const changed = Boolean(res.contentHash && r.content_hash && res.contentHash !== r.content_hash);
      await execute(
        `UPDATE ${r.table} SET link_failures = $2, link_checked_at = NOW(), link_last_status = $3,
                content_hash = COALESCE($4, content_hash),
                content_changed_at = CASE WHEN $5 THEN NOW() ELSE content_changed_at END
          WHERE id = $1`,
        [r.id, failures, res.status, res.contentHash ?? null, changed],
      );
      // Reported once, when a link reaches the threshold; the daily health report lists it after that.
      if (!res.ok && failures === LINK_FAIL_REPORT) out.failing.push({ table: r.table, slug: r.slug, name: r.name, status: res.status, failures });
      if (changed) out.changed.push({ table: r.table, slug: r.slug, name: r.name, url: r.url! });
    }));
  }
  return out;
}
