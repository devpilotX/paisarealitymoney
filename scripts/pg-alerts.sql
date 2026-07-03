-- Price alerts: one-shot per-city gold/silver price targets per user.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commodity TEXT NOT NULL CHECK (commodity IN ('gold_24k', 'gold_22k', 'silver')),
    city_slug TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('below', 'above')),
    target_price NUMERIC(12,2) NOT NULL CHECK (target_price > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    triggered_price NUMERIC(12,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(commodity) WHERE active;
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
