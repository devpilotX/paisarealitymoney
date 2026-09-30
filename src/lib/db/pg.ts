/**
 * PostgreSQL access for the Financial Health Score feature.
 * Self-hosted Postgres; connection comes from env (never hardcode the password).
 * Parameterized queries only. This is the ONLY place that opens a Postgres connection.
 */
import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';

// Return DATE columns as the plain 'YYYY-MM-DD' string the row types already
// declare. The driver default builds a JS Date at *server-local* midnight, so a
// DATE rendered through a UTC formatter on an IST host showed the previous day
// (a 30 Sep last_verified printed as "29 September" in the FAQ, "30 September"
// in the body). Timestamps (timestamptz) are unaffected.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

/** Build the pool config from env (DATABASE_URL wins; else discrete PG* vars). */
function poolConfig(): { connectionString?: string; host?: string; port?: number; user?: string; password?: string; database?: string } {
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    throw new Error('Missing PostgreSQL env: set DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE.');
  }
  return { host: PGHOST, port: PGPORT ? parseInt(PGPORT, 10) : 5432, user: PGUSER, password: PGPASSWORD, database: PGDATABASE };
}

// Cache the pool across hot reloads in dev.
const globalForPg = globalThis as unknown as { __pgPool?: Pool };

/** Singleton connection pool. */
export function getPgPool(): Pool {
  if (!globalForPg.__pgPool) {
    globalForPg.__pgPool = new Pool({ ...poolConfig(), max: 10, idleTimeoutMillis: 30000 });
  }
  return globalForPg.__pgPool;
}

/**
 * Run a parameterized query and return typed rows.
 * @param text SQL with $1, $2 ... placeholders.
 * @param params positional parameters.
 */
export async function pgQuery<T extends QueryResultRow>(text: string, params: readonly unknown[] = []): Promise<T[]> {
  const res = await getPgPool().query<T>(text, params as unknown[]);
  return res.rows;
}

/**
 * Run `fn` inside a single transaction (BEGIN/COMMIT, ROLLBACK on throw).
 * @param fn receives a dedicated client; use client.query for all statements.
 */
export async function withPgTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPgPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
