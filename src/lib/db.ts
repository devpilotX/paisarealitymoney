import mysql, { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function getDatabaseConfig(): DatabaseConfig {
  const host = process.env.MYSQL_HOST;
  const port = process.env.MYSQL_PORT;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !port || !user || !password || !database) {
    throw new Error(
      'Missing required database environment variables. Check MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.'
    );
  }

  return {
    host,
    port: parseInt(port, 10),
    user,
    password,
    database,
  };
}

const poolConfig: PoolOptions = {
  ...getDatabaseConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
  timezone: '+05:30',
};

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(poolConfig);
  }
  return pool;
}

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: (string | number | boolean | null | Date)[]
): Promise<T> {
  const db = getPool();
  try {
    const [rows] = await db.execute<T>(sql, params);
    return rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error(`Database query error: ${message}`, { sql, params });
    throw new Error(`Database query failed: ${message}`);
  }
}

export async function execute(
  sql: string,
  params?: (string | number | boolean | null | Date)[]
): Promise<ResultSetHeader> {
  const db = getPool();
  try {
    const [result] = await db.execute<ResultSetHeader>(sql, params);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error(`Database execute error: ${message}`, { sql, params });
    throw new Error(`Database execute failed: ${message}`);
  }
}

export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const db = getPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    const message = error instanceof Error ? error.message : 'Unknown transaction error';
    console.error(`Transaction error: ${message}`);
    throw new Error(`Transaction failed: ${message}`);
  } finally {
    connection.release();
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1 as health');
    return true;
  } catch {
    return false;
  }
}

export default { getPool, query, execute, transaction, healthCheck };