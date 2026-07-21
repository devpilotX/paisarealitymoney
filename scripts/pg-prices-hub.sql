-- Prices hub: national daily rollup for gold and silver.
-- Additive and idempotent. Safe to re-run: table is created IF NOT EXISTS and
-- rows are upserted by (metal, price_date). Derived from the per-city price
-- history already in gold_prices / silver_prices; touches no existing table.

CREATE TABLE IF NOT EXISTS metal_national_daily (
  metal          TEXT NOT NULL CHECK (metal IN ('gold', 'silver')),
  price_date     DATE NOT NULL,
  k24_per_gram   NUMERIC(12,2),   -- gold only
  k22_per_gram   NUMERIC(12,2),   -- gold only
  k24_per_10gram NUMERIC(12,2),   -- gold only
  per_gram       NUMERIC(12,2),   -- gold 24k per gram, or silver per gram
  per_kg         NUMERIC(14,2),   -- silver only
  day_high       NUMERIC(14,2),   -- highest tracked-city value that day
  day_low        NUMERIC(14,2),   -- lowest tracked-city value that day
  change_amount  NUMERIC(12,2),   -- vs previous price_date (gold: per gram; silver: per kg)
  change_percent NUMERIC(7,2),
  basis          TEXT NOT NULL DEFAULT 'city_avg',
  source         TEXT,
  data_as_of     DATE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metal, price_date)
);

CREATE INDEX IF NOT EXISTS idx_metal_national_daily_metal_date
  ON metal_national_daily (metal, price_date DESC);

-- Backfill GOLD: national figure = average across tracked cities per date.
INSERT INTO metal_national_daily
  (metal, price_date, k24_per_gram, k22_per_gram, k24_per_10gram, per_gram, day_high, day_low, basis, source, data_as_of)
SELECT 'gold', price_date,
       ROUND(AVG(gold_24k_per_gram)::numeric, 2),
       ROUND(AVG(gold_22k_per_gram)::numeric, 2),
       ROUND(AVG(gold_24k_per_10gram)::numeric, 2),
       ROUND(AVG(gold_24k_per_gram)::numeric, 2),
       ROUND(MAX(gold_24k_per_gram)::numeric, 2),
       ROUND(MIN(gold_24k_per_gram)::numeric, 2),
       'city_avg', 'Paisa Reality tracked-city average', price_date
FROM gold_prices
GROUP BY price_date
ON CONFLICT (metal, price_date) DO UPDATE SET
  k24_per_gram = EXCLUDED.k24_per_gram, k22_per_gram = EXCLUDED.k22_per_gram,
  k24_per_10gram = EXCLUDED.k24_per_10gram, per_gram = EXCLUDED.per_gram,
  day_high = EXCLUDED.day_high, day_low = EXCLUDED.day_low,
  source = EXCLUDED.source, data_as_of = EXCLUDED.data_as_of, updated_at = NOW();

-- Backfill SILVER.
INSERT INTO metal_national_daily
  (metal, price_date, per_gram, per_kg, day_high, day_low, basis, source, data_as_of)
SELECT 'silver', price_date,
       ROUND(AVG(silver_per_gram)::numeric, 2),
       ROUND(AVG(silver_per_kg)::numeric, 2),
       ROUND(MAX(silver_per_kg)::numeric, 2),
       ROUND(MIN(silver_per_kg)::numeric, 2),
       'city_avg', 'Paisa Reality tracked-city average', price_date
FROM silver_prices
GROUP BY price_date
ON CONFLICT (metal, price_date) DO UPDATE SET
  per_gram = EXCLUDED.per_gram, per_kg = EXCLUDED.per_kg,
  day_high = EXCLUDED.day_high, day_low = EXCLUDED.day_low,
  source = EXCLUDED.source, data_as_of = EXCLUDED.data_as_of, updated_at = NOW();

-- Day-over-day change for gold (on per gram).
WITH g AS (
  SELECT price_date, per_gram AS v,
         LAG(per_gram) OVER (ORDER BY price_date) AS prev
  FROM metal_national_daily WHERE metal = 'gold'
)
UPDATE metal_national_daily m SET
  change_amount = ROUND((g.v - g.prev)::numeric, 2),
  change_percent = CASE WHEN g.prev > 0 THEN ROUND(((g.v - g.prev) / g.prev * 100)::numeric, 2) ELSE 0 END
FROM g WHERE m.metal = 'gold' AND m.price_date = g.price_date AND g.prev IS NOT NULL;

-- Day-over-day change for silver (on per kg).
WITH s AS (
  SELECT price_date, per_kg AS v,
         LAG(per_kg) OVER (ORDER BY price_date) AS prev
  FROM metal_national_daily WHERE metal = 'silver'
)
UPDATE metal_national_daily m SET
  change_amount = ROUND((s.v - s.prev)::numeric, 2),
  change_percent = CASE WHEN s.prev > 0 THEN ROUND(((s.v - s.prev) / s.prev * 100)::numeric, 2) ELSE 0 END
FROM s WHERE m.metal = 'silver' AND m.price_date = s.price_date AND s.prev IS NOT NULL;
