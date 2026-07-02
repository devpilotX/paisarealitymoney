-- Price data integrity: provenance columns, admin overrides, system metadata.
-- Idempotent: safe to re-run.

ALTER TABLE fuel_prices ADD COLUMN IF NOT EXISTS data_as_of DATE;
ALTER TABLE fuel_prices ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE lpg_prices ADD COLUMN IF NOT EXISTS data_as_of DATE;
ALTER TABLE lpg_prices ADD COLUMN IF NOT EXISTS source TEXT;

-- Admin-managed price overrides. region_key is a city slug (fuel) or a state
-- name (fuel or lpg). payload holds the priced components, e.g.
-- {"petrol": 102.12, "diesel": 95.20} or {"domestic": 942, "commercial": 2930}.
CREATE TABLE IF NOT EXISTS price_overrides (
    id SERIAL PRIMARY KEY,
    commodity TEXT NOT NULL CHECK (commodity IN ('fuel', 'lpg')),
    region_key TEXT NOT NULL,
    payload JSONB NOT NULL,
    as_of DATE NOT NULL,
    source TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (commodity, region_key)
);

-- Small key/value store for operational state (alert throttles, cron marks).
CREATE TABLE IF NOT EXISTS system_meta (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank rates freshness: bank_rates.effective_date already exists; make sure
-- rows without one get a sane default so the UI can always show an as-of date.
UPDATE bank_rates SET effective_date = updated_at::date WHERE effective_date IS NULL;
