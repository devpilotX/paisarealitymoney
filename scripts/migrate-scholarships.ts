/**
 * Apply scripts/pg-scholarships.sql: the scholarships + scholarship_reminders tables
 * plus a small curated, idempotent starter set.
 *
 * Usage:  npm run db:migrate-scholarships
 * Env:    DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (from .env).
 * Standalone by design: talks to `pg` directly and does not import from src/.
 * Idempotent: safe to run more than once (seed uses ON CONFLICT DO UPDATE).
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
  const sqlPath = join(__dirname, 'pg-scholarships.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const pool = buildPool();
  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    console.log('\u2713 Migration applied: scholarships + scholarship_reminders (+ starter set).');
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('\u2717 Migration failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
