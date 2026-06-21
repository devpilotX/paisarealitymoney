#!/usr/bin/env ts-node
/**
 * One-time data migration: MySQL → PostgreSQL
 * 
 * Prerequisites:
 *   1. Run scripts/migrations/001_create_all_tables.sql on your PG database first
 *   2. Set both MySQL (MYSQL_*) and PG (DATABASE_URL or PG*) env vars in .env
 *   3. Run: npx ts-node -r dotenv/config --project tsconfig.scripts.json scripts/migrate-data.ts
 * 
 * This script:
 *   - Reads all rows from each MySQL table
 *   - Inserts them into the corresponding PostgreSQL table
 *   - Converts types (JSON string → jsonb, 1/0 → boolean, etc.)
 *   - Uses ON CONFLICT DO NOTHING to be re-runnable safely
 *   - Reports row counts for verification
 */
import mysql from 'mysql2/promise';
import { Pool } from 'pg';

// ─── MySQL connection ────────────────────────────────────────────────────────
function getMysqlPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST!,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
    connectionLimit: 5,
  });
}

// ─── PostgreSQL connection ───────────────────────────────────────────────────
function getPgPool() {
  if (process.env.DATABASE_URL) return new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return new Pool({
    host: process.env.PGHOST!, port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER!, password: process.env.PGPASSWORD!, database: process.env.PGDATABASE!, max: 5,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toBool(val: unknown): boolean {
  return val === 1 || val === true || val === '1';
}

function toJsonb(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { JSON.parse(val); return val; } catch { return JSON.stringify(val); }
  }
  return JSON.stringify(val);
}

function toIso(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

// ─── Migration functions per table ───────────────────────────────────────────
async function migrateCities(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM cities ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO cities (id, slug, name, name_hi, state, is_metro, latitude, longitude, created_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (slug) DO NOTHING`,
      [r.id, r.slug, r.name, r.name_hi, r.state, toBool(r.is_metro), r.latitude, r.longitude, toIso(r.created_at)]
    );
  }
  // Reset the identity sequence
  await pg.query(`SELECT setval(pg_get_serial_sequence('cities', 'id'), COALESCE((SELECT MAX(id) FROM cities), 1))`);
  return data.length;
}

async function migrateGoldPrices(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM gold_prices ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO gold_prices (id, city_id, price_date, gold_24k_per_gram, gold_22k_per_gram, gold_18k_per_gram, gold_24k_per_10gram, gold_22k_per_10gram, change_amount, change_percent, created_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (city_id, price_date) DO NOTHING`,
      [r.id, r.city_id, r.price_date, r.gold_24k_per_gram, r.gold_22k_per_gram, r.gold_18k_per_gram, r.gold_24k_per_10gram, r.gold_22k_per_10gram, r.change_amount, r.change_percent, toIso(r.created_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('gold_prices', 'id'), COALESCE((SELECT MAX(id) FROM gold_prices), 1))`);
  return data.length;
}

async function migrateSilverPrices(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM silver_prices ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO silver_prices (id, city_id, price_date, silver_per_gram, silver_per_kg, change_amount, change_percent, created_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (city_id, price_date) DO NOTHING`,
      [r.id, r.city_id, r.price_date, r.silver_per_gram, r.silver_per_kg, r.change_amount, r.change_percent, toIso(r.created_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('silver_prices', 'id'), COALESCE((SELECT MAX(id) FROM silver_prices), 1))`);
  return data.length;
}

async function migrateFuelPrices(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM fuel_prices ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO fuel_prices (id, city_id, price_date, petrol_price, diesel_price, petrol_change, diesel_change, created_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (city_id, price_date) DO NOTHING`,
      [r.id, r.city_id, r.price_date, r.petrol_price, r.diesel_price, r.petrol_change, r.diesel_change, toIso(r.created_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('fuel_prices', 'id'), COALESCE((SELECT MAX(id) FROM fuel_prices), 1))`);
  return data.length;
}

async function migrateLpgPrices(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM lpg_prices ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO lpg_prices (id, state, price_date, domestic_14kg, commercial_19kg, subsidy_amount, change_amount, created_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (state, price_date) DO NOTHING`,
      [r.id, r.state, r.price_date, r.domestic_14kg, r.commercial_19kg, r.subsidy_amount, r.change_amount, toIso(r.created_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('lpg_prices', 'id'), COALESCE((SELECT MAX(id) FROM lpg_prices), 1))`);
  return data.length;
}

async function migrateSchemes(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM schemes ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO schemes (id, slug, name, name_hi, category, level, ministry, description, description_hi,
       benefit_summary, benefit_amount_max, apply_url, official_url, deadline, min_age, max_age, gender,
       states, categories, max_income, occupations, education_min, area, bpl_required, minority_only,
       disability_only, how_to_apply, documents_required, meta_title, meta_description, is_active,
       source_url, last_verified, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35)
       ON CONFLICT (slug) DO NOTHING`,
      [r.id, r.slug, r.name, r.name_hi, r.category, r.level, r.ministry, r.description, r.description_hi,
       r.benefit_summary, r.benefit_amount_max, r.apply_url, r.official_url, r.deadline, r.min_age, r.max_age,
       r.gender || 'all', toJsonb(r.states), toJsonb(r.categories), r.max_income, toJsonb(r.occupations),
       r.education_min, r.area || 'all', toBool(r.bpl_required), toBool(r.minority_only), toBool(r.disability_only),
       r.how_to_apply, toJsonb(r.documents_required), r.meta_title, r.meta_description, toBool(r.is_active),
       r.source_url, r.last_verified, toIso(r.created_at), toIso(r.updated_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('schemes', 'id'), COALESCE((SELECT MAX(id) FROM schemes), 1))`);
  return data.length;
}

async function migrateBanks(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM banks ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO banks (id, slug, name, logo_url, type, website, created_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING`,
      [r.id, r.slug, r.name, r.logo_url, r.type, r.website, toIso(r.created_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('banks', 'id'), COALESCE((SELECT MAX(id) FROM banks), 1))`);
  return data.length;
}

async function migrateBankRates(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM bank_rates ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO bank_rates (id, bank_id, rate_type, tenure, general_rate, senior_citizen_rate, effective_date, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
      [r.id, r.bank_id, r.rate_type, r.tenure, r.general_rate, r.senior_citizen_rate, r.effective_date, toIso(r.created_at), toIso(r.updated_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('bank_rates', 'id'), COALESCE((SELECT MAX(id) FROM bank_rates), 1))`);
  return data.length;
}

async function migrateUsers(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM users ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO users (id, email, password_hash, name, plan, plan_expires_at, razorpay_customer_id,
       age, gender, state, district, area, category, income, occupation, education, email_alerts, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,lower($2),$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT DO NOTHING`,
      [r.id, r.email, r.password_hash, r.name, r.plan || 'free', toIso(r.plan_expires_at), r.razorpay_customer_id,
       r.age, r.gender, r.state, r.district, r.area, r.category, r.income, r.occupation, r.education,
       toBool(r.email_alerts), toIso(r.created_at), toIso(r.updated_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))`);
  return data.length;
}

async function migrateBookmarks(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM bookmarks ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO bookmarks (id, user_id, scheme_id, created_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, scheme_id) DO NOTHING`,
      [r.id, r.user_id, r.scheme_id, toIso(r.created_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('bookmarks', 'id'), COALESCE((SELECT MAX(id) FROM bookmarks), 1))`);
  return data.length;
}

async function migrateApplications(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM applications ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO applications (id, user_id, scheme_id, status, reference_number, applied_date, notes, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
      [r.id, r.user_id, r.scheme_id, r.status || 'not_started', r.reference_number, r.applied_date, r.notes, toIso(r.created_at), toIso(r.updated_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('applications', 'id'), COALESCE((SELECT MAX(id) FROM applications), 1))`);
  return data.length;
}

async function migrateBlogPosts(my: mysql.Pool, pg: Pool) {
  const [rows] = await my.query('SELECT * FROM blog_posts ORDER BY id');
  const data = rows as Record<string, unknown>[];
  for (const r of data) {
    await pg.query(
      `INSERT INTO blog_posts (id, slug, title, description, content, category, tags, cover_image,
       author, read_time, is_published, meta_title, meta_description, published_at, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (slug) DO NOTHING`,
      [r.id, r.slug, r.title, r.description, r.content, r.category || 'finance',
       toJsonb(r.tags), r.cover_image, r.author || 'Paisa Reality', r.read_time || '5 min read',
       toBool(r.is_published), r.meta_title, r.meta_description, toIso(r.published_at),
       toIso(r.created_at), toIso(r.updated_at)]
    );
  }
  await pg.query(`SELECT setval(pg_get_serial_sequence('blog_posts', 'id'), COALESCE((SELECT MAX(id) FROM blog_posts), 1))`);
  return data.length;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const my = getMysqlPool();
  const pg = getPgPool();

  console.log('Starting MySQL → PostgreSQL data migration...\n');

  const results: [string, number][] = [];

  const tables: [string, (m: mysql.Pool, p: Pool) => Promise<number>][] = [
    ['cities', migrateCities],
    ['gold_prices', migrateGoldPrices],
    ['silver_prices', migrateSilverPrices],
    ['fuel_prices', migrateFuelPrices],
    ['lpg_prices', migrateLpgPrices],
    ['schemes', migrateSchemes],
    ['banks', migrateBanks],
    ['bank_rates', migrateBankRates],
    ['users', migrateUsers],
    ['bookmarks', migrateBookmarks],
    ['applications', migrateApplications],
    ['blog_posts', migrateBlogPosts],
  ];

  for (const [name, fn] of tables) {
    try {
      const count = await fn(my, pg);
      results.push([name, count]);
      console.log(`  ✓ ${name}: ${count} rows`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err instanceof Error ? err.message : err}`);
      results.push([name, -1]);
    }
  }

  // Verification: compare counts
  console.log('\n── Verification ──');
  for (const [name] of results) {
    const [myRows] = await my.query(`SELECT COUNT(*) as c FROM ${name}`);
    const pgRes = await pg.query(`SELECT COUNT(*)::int as c FROM ${name}`);
    const myCount = (myRows as {c: number}[])[0]?.c ?? 0;
    const pgCount = pgRes.rows[0]?.c ?? 0;
    const match = myCount === pgCount ? '✓' : '✗ MISMATCH';
    console.log(`  ${match} ${name}: MySQL=${myCount} PG=${pgCount}`);
  }

  await my.end();
  await pg.end();
  console.log('\nDone.');
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
