/**
 * Apply scripts/pg-prices-hub.sql: the metal_national_daily rollup table plus a
 * historical backfill derived from the per-city gold_prices / silver_prices
 * history. Powers the national "gold/silver rate today" hub headline and trend.
 *
 * Usage:  npm run db:migrate-prices-hub
 * Env:    DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (from .env).
 * Standalone by design: talks to `pg` directly and does not import from src/.
 * Idempotent: safe to run more than once (CREATE IF NOT EXISTS + upserts).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

function buildPool(): Pool {
  if (process.env.DATABASE_URL) return new Pool({ connectionString: process.env.DATABASE_URL });
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    throw new Error(
      'Missing PostgreSQL env. Set DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE in .env.',
    );
  }
  return new Pool({
    host: PGHOST,
    port: PGPORT ? parseInt(PGPORT, 10) : 5432,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
  });
}

async function main(): Promise<void> {
  const sqlPath = join(__dirname, 'pg-prices-hub.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const pool = buildPool();
  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    const g = await pool.query("SELECT count(*)::int AS n, max(price_date)::text AS latest FROM metal_national_daily WHERE metal='gold'");
    const s = await pool.query("SELECT count(*)::int AS n, max(price_date)::text AS latest FROM metal_national_daily WHERE metal='silver'");
    console.log('\u2713 Migration applied: metal_national_daily (+ backfill).');
    console.log(`  gold rows: ${g.rows[0].n} (latest ${g.rows[0].latest})`);
    console.log(`  silver rows: ${s.rows[0].n} (latest ${s.rows[0].latest})`);
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('\u2717 Migration failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
