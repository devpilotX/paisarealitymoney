/**
 * Upsert scripts/data/grants.json into the grants table. Additive and idempotent:
 * existing rows are refreshed by slug, nothing is deleted. The link-check counters
 * are left alone so a reseed does not hide or revive anything by itself, except that
 * a programme hidden for a passed deadline comes back when the data gives it a new one.
 *
 * Usage: npm run db:seed-grants
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildScriptPool } from './lib/script-pool';

interface GrantRecord {
  slug: string; name: string; provider: string; region: string; level: string; state: string | null;
  kind: string; funding_type: string; amount_min_inr: number | null; amount_max_inr: number | null;
  amount_note: string | null; equity_taken: string | null; stage: string[]; sectors: string[];
  summary: string; eligibility: string[]; documents: string[]; how_to_apply: string | null;
  apply_url: string; official_url: string; application_status: string;
  opens_on: string | null; deadline: string | null; cycle_note: string | null;
  verified_on: string; source_note: string | null; meta_title?: string | null;
}

async function main(): Promise<void> {
  const data = JSON.parse(readFileSync(join(__dirname, 'data', 'grants.json'), 'utf8')) as { grants: GrantRecord[] };
  const pool = buildScriptPool();
  let inserted = 0;
  let updated = 0;
  try {
    for (const g of data.grants) {
      const r = await pool.query<{ inserted: boolean }>(
        `INSERT INTO grants (slug, name, provider, region, level, state, kind, funding_type, amount_min_inr, amount_max_inr,
           amount_note, equity_taken, stage, sectors, summary, eligibility, documents, how_to_apply, apply_url, official_url,
           application_status, opens_on, deadline, cycle_note, verified_on, source_note, meta_title)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name, provider = EXCLUDED.provider, region = EXCLUDED.region, level = EXCLUDED.level,
           state = EXCLUDED.state, kind = EXCLUDED.kind, funding_type = EXCLUDED.funding_type,
           amount_min_inr = EXCLUDED.amount_min_inr, amount_max_inr = EXCLUDED.amount_max_inr,
           amount_note = EXCLUDED.amount_note, equity_taken = EXCLUDED.equity_taken, stage = EXCLUDED.stage,
           sectors = EXCLUDED.sectors, summary = EXCLUDED.summary, eligibility = EXCLUDED.eligibility,
           documents = EXCLUDED.documents, how_to_apply = EXCLUDED.how_to_apply, apply_url = EXCLUDED.apply_url,
           official_url = EXCLUDED.official_url, application_status = EXCLUDED.application_status,
           opens_on = EXCLUDED.opens_on, deadline = EXCLUDED.deadline, cycle_note = EXCLUDED.cycle_note,
           verified_on = EXCLUDED.verified_on, source_note = EXCLUDED.source_note, meta_title = EXCLUDED.meta_title, updated_at = NOW(),
           active = CASE WHEN grants.hidden_reason = 'deadline passed'
                          AND (EXCLUDED.deadline IS NULL OR EXCLUDED.deadline >= CURRENT_DATE) THEN TRUE ELSE grants.active END,
           hidden_reason = CASE WHEN grants.hidden_reason = 'deadline passed'
                          AND (EXCLUDED.deadline IS NULL OR EXCLUDED.deadline >= CURRENT_DATE) THEN NULL ELSE grants.hidden_reason END
         RETURNING (xmax = 0) AS inserted`,
        [g.slug, g.name, g.provider, g.region, g.level, g.state, g.kind, g.funding_type, g.amount_min_inr, g.amount_max_inr,
          g.amount_note, g.equity_taken, g.stage, g.sectors, g.summary, g.eligibility, g.documents, g.how_to_apply,
          g.apply_url, g.official_url, g.application_status, g.opens_on, g.deadline, g.cycle_note, g.verified_on, g.source_note, g.meta_title ?? null],
      );
      if (r.rows[0]?.inserted) inserted++; else updated++;
    }
    const total = await pool.query<{ n: string }>('SELECT count(*) AS n FROM grants WHERE active');
    console.log(`Grants: ${inserted} new, ${updated} refreshed. Active now: ${total.rows[0]?.n}.`);
  } finally {
    await pool.end();
  }
}

main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
