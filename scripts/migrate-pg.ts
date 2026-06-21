/**
 * Apply scripts/pg-health-score.sql to PostgreSQL — cross-platform (no psql needed).
 *
 * Usage:  npm run db:migrate-pg
 * Env:    DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (loaded from .env
 *         via `-r dotenv/config`, same as the other db:* scripts).
 *
 * Standalone by design: it talks to `pg` directly and does NOT import from src/ (so it
 * needs no path-alias resolution and stays decoupled from the app's runtime pool).
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
  const sqlPath = join(__dirname, 'pg-health-score.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const pool = buildPool();
  try {
    // The whole file runs in one transaction: all-or-nothing.
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    console.log('✓ Migration applied: financial_snapshots, scores, benchmarks (+ indexes).');
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('✗ Migration failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
