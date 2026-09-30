/**
 * Shared PostgreSQL pool for the standalone seed scripts.
 * Reads DATABASE_URL, or the discrete PG* vars, from .env (loaded via -r dotenv/config).
 * Deliberately does not import from src/ so the scripts stay decoupled from the app pool.
 */
import { Pool } from 'pg';

export function buildScriptPool(): Pool {
  if (process.env.DATABASE_URL) return new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
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
    max: 4,
  });
}
