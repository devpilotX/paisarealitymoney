/**
 * Create every table on an empty PostgreSQL database, in dependency order.
 *
 * Usage:  npm run db:schema          (tables only)
 *         npm run db:setup           (tables, reference data, and the SEO meta overrides)
 *
 * Every file it runs is idempotent (CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
 * ON CONFLICT), so running it against a database that already has data changes nothing
 * that exists. Pass a file list to run only some of them:
 *   npm run db:schema -- scripts/pg-alerts.sql
 */
import { readFileSync } from 'fs';
import { join, relative } from 'path';
import { buildScriptPool } from './lib/script-pool';

const root = join(__dirname, '..');

/** Order matters: later files alter or reference tables from earlier ones. */
const SCHEMA_FILES = [
  'scripts/migrations/001_create_all_tables.sql',
  'scripts/migrations/002_contact_messages.sql',
  'scripts/migrations/003_account_system.sql',
  'scripts/migrations/004_newsletter.sql',
  'scripts/migrations/005_email_templates.sql',
  'scripts/pg-health-score.sql',
  'scripts/pg-price-integrity.sql',
  'scripts/pg-alerts.sql',
  'scripts/pg-scholarships.sql',
  'scripts/pg-prices-hub.sql',
  'scripts/pg-ads.sql',
  'scripts/pg-grants.sql',
  'scripts/pg-link-health.sql',
  'scripts/pg-articles.sql',
];

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const files = args.length > 0 ? args : SCHEMA_FILES;
  const pool = buildScriptPool();
  try {
    for (const file of files) {
      const path = join(root, file);
      const sql = readFileSync(path, 'utf8');
      // Files that manage their own transaction are run as-is.
      const ownsTx = /^\s*BEGIN\s*;/im.test(sql);
      const client = await pool.connect();
      try {
        if (!ownsTx) await client.query('BEGIN');
        await client.query(sql);
        if (!ownsTx) await client.query('COMMIT');
        console.log(`applied ${relative(root, path)}`);
      } catch (err) {
        if (!ownsTx) await client.query('ROLLBACK').catch(() => {});
        throw new Error(`${file}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
