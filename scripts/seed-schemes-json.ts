/**
 * Upsert schemes from JSON datasets in scripts/data/ (state-schemes-*.json).
 * Each file: { dataset_verified_on, schemes: [...] } with the same fields as the
 * other scheme seeds. Additive and idempotent by slug; never deletes. Hand-written
 * meta titles in the database are kept.
 *
 * Usage: npm run db:seed-schemes-json
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildScriptPool } from './lib/script-pool';

const COLUMNS = [
  'slug', 'name', 'name_hi', 'category', 'level', 'ministry', 'description', 'benefit_summary',
  'benefit_amount_max', 'apply_url', 'official_url', 'min_age', 'max_age', 'gender',
  'states', 'categories', 'max_income', 'occupations', 'education_min', 'area', 'bpl_required',
  'minority_only', 'disability_only', 'how_to_apply', 'documents_required', 'source_url', 'meta_title',
] as const;
const JSONB = new Set(['states', 'categories', 'occupations', 'documents_required']);
const CATEGORIES = new Set(['agriculture', 'business', 'disability', 'education', 'employment', 'finance', 'healthcare', 'housing', 'insurance', 'pension', 'senior-citizen', 'skill-training', 'social', 'women']);

type Scheme = Record<(typeof COLUMNS)[number], unknown>;

async function main(): Promise<void> {
  const dir = join(__dirname, 'data');
  const files = readdirSync(dir).filter((f) => /^state-schemes-.*\.json$/.test(f)).sort();
  const pool = buildScriptPool();
  let inserted = 0; let updated = 0;
  try {
    for (const f of files) {
      const data = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { dataset_verified_on: string; schemes: Scheme[] };
      for (const s of data.schemes) {
        s.level = s.level ?? 'state'; // these files hold state schemes only
        if (!CATEGORIES.has(String(s.category))) throw new Error(`${f}: ${s.slug} has unknown category ${s.category}`);
        if (!Array.isArray(s.states) || s.states.length === 0) throw new Error(`${f}: ${s.slug} has no states`);
        const values = COLUMNS.map((c) => (JSONB.has(c) ? JSON.stringify(s[c] ?? (c === 'documents_required' ? [] : ['all'])) : s[c] ?? null));
        const ph = COLUMNS.map((c, i) => (JSONB.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`)).join(', ');
        const set = COLUMNS.filter((c) => c !== 'slug').map((c) => (c === 'meta_title' ? 'meta_title = COALESCE(EXCLUDED.meta_title, schemes.meta_title)' : `${c} = EXCLUDED.${c}`)).join(', ');
        const r = await pool.query<{ inserted: boolean }>(
          `INSERT INTO schemes (${COLUMNS.join(', ')}, last_verified, is_active)
           VALUES (${ph}, $${COLUMNS.length + 1}::date, true)
           ON CONFLICT (slug) DO UPDATE SET ${set}, last_verified = EXCLUDED.last_verified, is_active = true, updated_at = NOW()
           RETURNING (xmax = 0) AS inserted`,
          [...values, data.dataset_verified_on],
        );
        if (r.rows[0]?.inserted) inserted++; else updated++;
      }
    }
    const t = await pool.query<{ n: string }>('SELECT count(*) AS n FROM schemes WHERE is_active');
    console.log(`Schemes from JSON: ${inserted} new, ${updated} refreshed (${files.join(', ')}). Active now: ${t.rows[0]?.n}.`);
  } finally {
    await pool.end();
  }
}

main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
