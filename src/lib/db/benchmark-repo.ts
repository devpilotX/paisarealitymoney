/**
 * Benchmark aggregation + reads (PostgreSQL). Privacy: raw financials never leave the server;
 * only cohort percentiles are stored/returned, and only for cohorts of >= 50 people.
 *
 * ASSUMED SCHEMA (create if missing):
 *   benchmarks(cohort_key text PRIMARY KEY, cohort_size int NOT NULL,
 *              pillar_percentiles jsonb NOT NULL, total_percentiles jsonb NOT NULL,
 *              updated_at timestamptz NOT NULL DEFAULT now())
 * ASSUMED financial_snapshots columns used here: city_tier text, consent_benchmark boolean.
 */
import { pgQuery, withPgTransaction } from './pg';
import { PILLAR_NAMES, type PillarName } from '../score-config';
import type { Quartiles, PillarPercentiles } from '../health-score/cohort';

export const K_ANONYMITY_MIN = 50;

export interface Benchmark {
  cohortKey: string;
  cohortSize: number;
  totalPercentiles: Quartiles;
  pillarPercentiles: PillarPercentiles;
}
interface BenchmarkRow { cohort_key: string; cohort_size: number; total_percentiles: Quartiles; pillar_percentiles: PillarPercentiles }

/** Injectable query fn (defaults to the real pool); lets tests verify the k-anonymity guard. */
export interface BenchmarkDeps { query: typeof pgQuery }

/** Read one cohort's benchmark. Returns null if it does not exist or is below k-anonymity. */
export async function getBenchmark(cohortKey: string, deps: BenchmarkDeps = { query: pgQuery }): Promise<Benchmark | null> {
  const rows = await deps.query<BenchmarkRow>(
    `SELECT cohort_key, cohort_size, total_percentiles, pillar_percentiles
       FROM benchmarks WHERE cohort_key = $1 AND cohort_size >= $2 LIMIT 1`,
    [cohortKey, K_ANONYMITY_MIN],
  );
  const r = rows[0];
  return r ? { cohortKey: r.cohort_key, cohortSize: r.cohort_size, totalPercentiles: r.total_percentiles, pillarPercentiles: r.pillar_percentiles } : null;
}

/** Build the per-pillar percentile SELECT fragments (p25/p50/p75 from the pillar_scores jsonb). */
function pillarPercentileSelects(): string {
  const out: string[] = [];
  for (const p of PILLAR_NAMES) {
    out.push(`percentile_cont(0.25) WITHIN GROUP (ORDER BY (pillar_scores->>'${p}')::numeric) AS ${p}_25`);
    out.push(`percentile_cont(0.5)  WITHIN GROUP (ORDER BY (pillar_scores->>'${p}')::numeric) AS ${p}_50`);
    out.push(`percentile_cont(0.75) WITHIN GROUP (ORDER BY (pillar_scores->>'${p}')::numeric) AS ${p}_75`);
  }
  return out.join(',\n        ');
}

interface AggRow { cohort_key: string; cohort_size: number; t_25: number; t_50: number; t_75: number; [key: string]: number | string }

/**
 * Nightly job: rebuild the benchmarks table from the LATEST consented snapshot+score per person,
 * grouped by cohort, keeping only cohorts with >= 50 people (k-anonymity enforced in SQL).
 * @returns the number of cohorts written.
 */
export async function runBenchmarkAggregation(): Promise<number> {
  const sql = `
    WITH person_latest AS (
      SELECT DISTINCT ON (COALESCE(fs.user_id::text, fs.anon_id))
             fs.age, fs.monthly_income, COALESCE(fs.city_tier, 'unknown') AS city_tier,
             sc.total_score, sc.pillar_scores
        FROM scores sc
        JOIN financial_snapshots fs ON fs.id = sc.snapshot_id
       WHERE fs.consent_benchmark = TRUE
       ORDER BY COALESCE(fs.user_id::text, fs.anon_id), sc.created_at DESC
    ),
    cohorted AS (
      SELECT
        'age:' || CASE WHEN age < 25 THEN '<25' WHEN age <= 30 THEN '25-30'
                       WHEN age <= 40 THEN '31-40' WHEN age <= 50 THEN '41-50' ELSE '51+' END
        || '|city:' || city_tier
        || '|income:' || CASE WHEN monthly_income*12 < 500000 THEN '<5L'
                              WHEN monthly_income*12 < 1000000 THEN '5-10L'
                              WHEN monthly_income*12 < 2500000 THEN '10-25L' ELSE '25L+' END AS cohort_key,
        total_score, pillar_scores
      FROM person_latest
    )
    SELECT cohort_key, COUNT(*)::int AS cohort_size,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY total_score) AS t_25,
        percentile_cont(0.5)  WITHIN GROUP (ORDER BY total_score) AS t_50,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY total_score) AS t_75,
        ${pillarPercentileSelects()}
      FROM cohorted
     GROUP BY cohort_key
    HAVING COUNT(*) >= ${K_ANONYMITY_MIN}`;

  return withPgTransaction(async (client) => {
    const { rows } = await client.query<AggRow>(sql);
    // Truncate-and-rebuild so cohorts that drop below 50 disappear (privacy).
    await client.query('DELETE FROM benchmarks');
    for (const r of rows) {
      const total: Quartiles = { p25: Number(r.t_25), p50: Number(r.t_50), p75: Number(r.t_75) };
      const pillars = {} as PillarPercentiles;
      for (const p of PILLAR_NAMES as readonly PillarName[]) {
        pillars[p] = { p25: Number(r[`${p}_25`]), p50: Number(r[`${p}_50`]), p75: Number(r[`${p}_75`]) };
      }
      await client.query(
        `INSERT INTO benchmarks (cohort_key, cohort_size, pillar_percentiles, total_percentiles, updated_at)
         VALUES ($1,$2,$3,$4, now())`,
        [r.cohort_key, r.cohort_size, JSON.stringify(pillars), JSON.stringify(total)],
      );
    }
    return rows.length;
  });
}
