/**
 * Apply scripts/pg-price-integrity.sql — provenance columns on fuel/LPG price
 * tables, the price_overrides table, and the system_meta table.
 *
 * Usage:  npm run db:migrate-price-integrity
 * Env:    DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (loaded
 *         from .env via `-r dotenv/config`, same as the other db:* scripts).
 *
 * Standalone by design: talks to `pg` directly and does not import from src/.
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
  const sqlPath = join(__dirname, 'pg-price-integrity.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const pool = buildPool();
  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    console.log('✓ Migration applied: fuel/LPG provenance columns, price_overrides, system_meta.');
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('✗ Migration failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
