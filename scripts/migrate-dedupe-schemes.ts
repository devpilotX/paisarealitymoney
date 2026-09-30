/**
 * Deactivate duplicate scheme rows listed in src/lib/scheme-redirects.json.
 *
 * Each alias slug describes the same programme as its canonical slug, so two
 * indexable pages competed for one query. The alias row is set is_active = FALSE
 * (never deleted, so bookmarks and applications keep their foreign keys), which
 * drops it from the sitemap, finder and static params. next.config.js then
 * 301-redirects the old URL. Only aliases whose canonical row exists and is
 * active are touched, so this can never leave a programme without a page.
 *
 * Idempotent. Run: npm run db:migrate-dedupe-schemes
 */
import { buildScriptPool } from './lib/script-pool';
import schemeRedirects from '../src/lib/scheme-redirects.json';

async function main(): Promise<void> {
  const pairs = Object.entries(schemeRedirects as Record<string, string>).filter(([k]) => !k.startsWith('_'));
  const pool = buildScriptPool();
  let deactivated = 0;
  try {
    await pool.query('BEGIN');
    for (const [alias, canonical] of pairs) {
      const res = await pool.query(
        `UPDATE schemes SET is_active = FALSE
          WHERE slug = $1 AND is_active = TRUE
            AND EXISTS (SELECT 1 FROM schemes WHERE slug = $2 AND is_active = TRUE)`,
        [alias, canonical],
      );
      if ((res.rowCount ?? 0) > 0) {
        deactivated += 1;
        console.log(`  deactivated ${alias} -> ${canonical}`);
      }
    }
    await pool.query('COMMIT');
    console.log(`Done. ${deactivated} duplicate scheme row(s) deactivated, ${pairs.length} aliases checked.`);
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Dedupe failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
