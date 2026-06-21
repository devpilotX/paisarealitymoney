-- =============================================================================
-- Financial Health Score — PostgreSQL schema
-- =============================================================================
-- Idempotent and additive: safe to run repeatedly. Uses CREATE ... IF NOT EXISTS
-- and ADD COLUMN IF NOT EXISTS, and NEVER drops data.
--
-- Run with:  npm run db:migrate-pg     (cross-platform; uses the pg pool + .env)
-- or:        psql "$DATABASE_URL" -f scripts/pg-health-score.sql
--
-- Column types are derived from the code that reads/writes them:
--   src/lib/db/score-repo.ts      (saveScore INSERTs, getScoreHistory SELECT)
--   src/lib/db/benchmark-repo.ts  (runBenchmarkAggregation, getBenchmark)
--   src/lib/health-score/score.ts (ScoreInput / ScoreResult shapes)
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto (and in core since PG13). No-op if present.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- financial_snapshots — one immutable row per save (the raw inputs behind a score).
-- History is the product: saves always INSERT, never UPDATE.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_snapshots (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              text,                          -- stringified app user id; NULL when logged-out
    anon_id              text NOT NULL,                 -- first-party cookie id; ALWAYS written (enables anon->user merge)
    monthly_income       numeric(14,2) NOT NULL,
    monthly_expense      numeric(14,2) NOT NULL,
    liquid_savings       numeric(16,2) NOT NULL,
    monthly_debt_payment numeric(14,2) NOT NULL,
    has_cc_revolving     boolean       NOT NULL,
    monthly_invested     numeric(14,2) NOT NULL,
    asset_classes        text[]        NOT NULL DEFAULT '{}',   -- e.g. {equity,debt,gold,cash,realestate}
    term_cover           numeric(16,2),                 -- nullable (input.termCover ?? null)
    health_cover         numeric(16,2),                 -- nullable (input.healthCover ?? null)
    dependents           integer       NOT NULL,
    age                  integer       NOT NULL,
    retirement_age       integer       NOT NULL,
    current_corpus       numeric(16,2) NOT NULL,
    tax_regime           text          NOT NULL DEFAULT 'new' CHECK (tax_regime IN ('old', 'new')),
    actual_tax           numeric(14,2) NOT NULL,
    optimal_tax          numeric(14,2) NOT NULL,
    source               text          NOT NULL DEFAULT 'onboarding',  -- 'onboarding' | 'tool:*'
    -- Assumed by benchmark-repo.ts but NOT written by the current snapshot route/saveScore,
    -- so both MUST have defaults (otherwise inserts fail). consent_benchmark gates whether a
    -- row is eligible for cohort aggregation; until consent capture is wired in the UI/route,
    -- it stays FALSE and the benchmarks table will remain empty by design.
    city_tier            text,                          -- metro|tier1|tier2|tier3 (benchmark COALESCEs NULL -> 'unknown')
    consent_benchmark    boolean       NOT NULL DEFAULT false,
    created_at           timestamptz   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- scores — one computed score per snapshot. Never updated (new row per recompute).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       text,                                 -- denormalized for fast per-user history reads
    snapshot_id   uuid  NOT NULL REFERENCES financial_snapshots(id) ON DELETE CASCADE,
    total_score   integer NOT NULL,                     -- 300..900 (Math.round in the engine)
    band          text  NOT NULL,                       -- 'At Risk'|'Needs Work'|'Fair'|'Good'|'Excellent'
    pillar_scores jsonb NOT NULL,                        -- { savings:0..100, emergency:..., ... }
    top_actions   jsonb NOT NULL,                        -- [{ label, link, pointsRecoverable }]
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- benchmarks — pre-aggregated cohort percentiles, rebuilt by the nightly job.
-- Only cohorts with >= 50 people are stored (k-anonymity, enforced in the agg SQL).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS benchmarks (
    cohort_key         text PRIMARY KEY,                 -- 'age:..|city:..|income:..'
    cohort_size        integer NOT NULL,
    pillar_percentiles jsonb   NOT NULL,                 -- { pillar: { p25, p50, p75 } }
    total_percentiles  jsonb   NOT NULL,                 -- { p25, p50, p75 }
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Upgrade path for installs whose financial_snapshots predate the benchmark columns.
-- (No-op when the table was just created above with these columns.)
-- -----------------------------------------------------------------------------
ALTER TABLE financial_snapshots ADD COLUMN IF NOT EXISTS city_tier         text;
ALTER TABLE financial_snapshots ADD COLUMN IF NOT EXISTS consent_benchmark boolean NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_scores_user_created  ON scores (user_id, created_at);   -- getScoreHistory
CREATE INDEX IF NOT EXISTS idx_scores_snapshot      ON scores (snapshot_id);           -- agg join
CREATE INDEX IF NOT EXISTS idx_snapshots_user       ON financial_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_anon       ON financial_snapshots (anon_id);  -- anon->user merge
CREATE INDEX IF NOT EXISTS idx_snapshots_consent    ON financial_snapshots (consent_benchmark) WHERE consent_benchmark = true;
