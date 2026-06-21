/**
 * Unified database access layer — PostgreSQL only.
 * Drop-in replacement for the old MySQL db.ts.
 * All query/execute calls route through the single PG pool in ./db/pg.ts.
 */
import { pgQuery, withPgTransaction, getPgPool } from './db/pg';
import type { PoolClient, QueryResultRow } from 'pg';

export { getPgPool, pgQuery, withPgTransaction };

/**
 * Run a parameterized SELECT and return typed rows.
 * Replacement for the old mysql2 query<T>().
 */
export async function query<T extends QueryResultRow>(
  sql: string,
  params?: readonly unknown[]
): Promise<T[]> {
  return pgQuery<T>(sql, params ?? []);
}

/**
 * Run a parameterized INSERT/UPDATE/DELETE.
 * Returns { rowCount, rows } — use RETURNING id for insert ids.
 */
export async function execute<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: readonly unknown[]
): Promise<{ rowCount: number; rows: T[] }> {
  const pool = getPgPool();
  const res = await pool.query<T>(sql, params ? [...params] : []);
  return { rowCount: res.rowCount ?? 0, rows: res.rows };
}

/**
 * Run a callback inside a single transaction (BEGIN/COMMIT, ROLLBACK on throw).
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withPgTransaction(callback);
}

export async function healthCheck(): Promise<boolean> {
  try {
    await pgQuery('SELECT 1 AS health');
    return true;
  } catch {
    return false;
  }
}

export default { query, execute, transaction, healthCheck };
