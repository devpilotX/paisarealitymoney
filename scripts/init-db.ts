import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function escapeIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, '``')}\``;
}

async function main(): Promise<void> {
  const host = requiredEnv('MYSQL_HOST');
  const port = Number.parseInt(requiredEnv('MYSQL_PORT'), 10);
  const user = requiredEnv('MYSQL_USER');
  const password = requiredEnv('MYSQL_PASSWORD');
  const database = requiredEnv('MYSQL_DATABASE');

  if (!Number.isInteger(port)) {
    throw new Error('MYSQL_PORT must be a valid number');
  }

  const sqlPath = path.join(process.cwd(), 'scripts', 'init-db.sql');
  const rawSql = fs.readFileSync(sqlPath, 'utf8');
  const schemaSql = rawSql
    .replace(/^CREATE DATABASE IF NOT EXISTS [\s\S]*?;\s*/im, '')
    .replace(/^USE [\s\S]*?;\s*/im, '');

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE ${escapeIdentifier(database)}`);
    await connection.query(schemaSql);
    console.log(`Database initialized: ${database}`);
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown database initialization error';
  console.error(message);
  process.exit(1);
});
