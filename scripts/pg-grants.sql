-- Startup grants, seed funds and accelerators open to Indian founders.
-- Seeded from scripts/data/grants.json by scripts/seed-grants.ts (idempotent upsert by slug).
--
-- Automatic upkeep, run by the price cron (src/lib/grants-upkeep.ts):
--   * a programme whose deadline has passed is hidden the next day (active = false,
--     hidden_reason = 'deadline passed'); a recurring programme comes back when the
--     seed or an admin sets a new deadline.
--   * every official and apply link is checked once a day; after 3 failed checks in a
--     row the programme is hidden (hidden_reason = 'link failing') and the admin is
--     alerted. One good check brings it back.
CREATE TABLE IF NOT EXISTS grants (
  id                 SERIAL PRIMARY KEY,
  slug               TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  provider           TEXT NOT NULL,
  region             TEXT NOT NULL CHECK (region IN ('india', 'international')),
  level              TEXT NOT NULL CHECK (level IN ('central', 'state', 'private', 'international')),
  state              TEXT,
  kind               TEXT NOT NULL,
  funding_type       TEXT NOT NULL,
  amount_min_inr     BIGINT,
  amount_max_inr     BIGINT,
  amount_note        TEXT,
  equity_taken       TEXT,
  stage              TEXT[] NOT NULL DEFAULT '{}',
  sectors            TEXT[] NOT NULL DEFAULT '{all}',
  summary            TEXT NOT NULL,
  eligibility        TEXT[] NOT NULL DEFAULT '{}',
  documents          TEXT[] NOT NULL DEFAULT '{}',
  how_to_apply       TEXT,
  apply_url          TEXT NOT NULL,
  official_url       TEXT NOT NULL,
  application_status TEXT NOT NULL,
  opens_on           DATE,
  deadline           DATE,
  cycle_note         TEXT,
  verified_on        DATE NOT NULL,
  source_note        TEXT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  hidden_reason      TEXT,
  link_failures      INTEGER NOT NULL DEFAULT 0,
  link_checked_at    TIMESTAMPTZ,
  link_last_status   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grants_active ON grants (active, region);

ALTER TABLE grants ADD COLUMN IF NOT EXISTS meta_title TEXT;
