# Prices Hub — Feature Spec

- Status: Approved, ready to build (kick-off next session)
- Date: 2026-07-21
- Author: Kiro (with owner approval)
- Related: `/gold-rate`, `/silver-rate` hubs; `gold_prices` / `silver_prices` / `cities` tables; `/api/cron/prices`; `revalidate-prices.ts`

## 1. Goal and background

Own the recurring, location-agnostic head terms **"gold rate today"** and **"silver rate today"**, which are natural daily-return queries, and stop the 50+ city pages from cannibalising them.

Grounding data (Google Search Console, this session):
- "gold rate today" ranks at ~pos 26.8 with real impressions (a content gap: no single authoritative page wins it).
- 30+ city `silver-rate` / `gold-rate` pages compete for the generic query, splitting authority.
- The metadata/CTR work already live means scheme/scholarship pages are handled; prices are the next lever for **recurring** volume.

This is an **upgrade**, not a greenfield build: the hubs already exist and already target the head term. The gaps are (a) no single national "today" number + trend, (b) weak head-term authority, (c) thin trust/freshness signals.

## 2. Current state (build on this)

- Tables: `cities` (id, name, slug, state, is_metro), `gold_prices` / `silver_prices` (city_id, k24/k22 per gram, k24 per 10g, change_amount, change_percent, price_date), `fuel_prices` / `lpg_prices` (+ `data_as_of`, `source`), `price_overrides` (fuel/lpg only), `system_meta` (kv).
- Pipeline: `price-providers.ts` -> `scraper-prices.ts` -> DB -> `/api/cron/prices` -> `revalidatePriceRoutes()` purges hubs + city routes.
- Rendering: hubs are ISR SSG (`revalidate = 900`); city pages SSG; `/api/prices/*` and `/api/history` exist.
- Hub already emits Dataset + FAQPage JSON-LD and targets "gold rate today" in metadata.

## 3. Proposed architecture

Data flow (additions in bold):

```
providers -> scraper -> gold_prices / silver_prices (per city, per day)
                               |
                               v
        /api/cron/prices  --> **compute national rollup** --> **metal_national_daily**
                               |                                      |
                               v                                      v
                    revalidatePriceRoutes()              **/api/prices/national** (chart feed)
                               |                                      |
                               v                                      v
                    /gold-rate, /silver-rate hubs  <-- **headline number + trend chart**
```

The national number is **derived from data we already ingest** — no new external provider needed.

## 4. Database schema

New table (core addition) — a daily national rollup so the hub shows a headline + trend without scanning 50 cities per request, with its own provenance:

```sql
CREATE TABLE IF NOT EXISTS metal_national_daily (
  metal          TEXT NOT NULL CHECK (metal IN ('gold','silver')),
  price_date     DATE NOT NULL,
  k24_per_gram   NUMERIC,      -- gold; national figure (basis in section 8)
  k22_per_gram   NUMERIC,      -- gold
  k24_per_10gram NUMERIC,      -- gold
  silver_per_kg  NUMERIC,      -- silver
  day_high       NUMERIC,      -- across cities that day
  day_low        NUMERIC,
  change_amount  NUMERIC,      -- vs previous price_date
  change_percent NUMERIC,
  basis          TEXT NOT NULL DEFAULT 'metro_avg', -- 'metro_avg' | 'representative_city' | 'override'
  source         TEXT,
  data_as_of     DATE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metal, price_date)
);
```

- Migration `scripts/pg-prices-hub.sql` — additive + idempotent, mirroring `pg-price-integrity.sql`.
- Backfill from existing `gold_prices` / `silver_prices` history so the trend chart has 90 days on day one.
- Optional: extend `price_overrides.commodity` CHECK to allow `'gold'` / `'silver'` so admins can pin the national number without a deploy (same mechanism fuel already uses).

## 5. APIs

| Endpoint | Change | Purpose |
|---|---|---|
| `/api/cron/prices` | extend | After city prices land, compute + upsert `metal_national_daily` for gold and silver |
| `/api/prices/national?metal=gold&days=90` | new | Feed the hub trend chart from the rollup (small, cacheable) |
| `revalidate-prices.ts` | reuse | Already purges `/gold-rate` and `/silver-rate` — no change |

## 6. Frontend (hub upgrade)

- Headline block: "Gold rate today in India — Rs X/gram (24K), Rs Y/gram (22K)" with today's change and a visible "Updated {date} - Source {source}" line.
- Trend: 30/90-day national chart (client component -> `/api/prices/national`). Reuse the existing charting approach used by city pages; avoid heavy new deps.
- Keep the 50-city table, content, FAQ; add today's high/low and weekly/monthly change.
- Schema.org: keep Dataset + FAQPage; add `dateModified`. Use `Product`/`Offer` only if fully accurate, else stay with Dataset to avoid trust risk.

## 7. SEO and cannibalisation strategy

- Hub self-canonicals and owns "gold rate today", "gold price today india".
- City pages stay (valid local intent), target "gold rate in {city} today", self-canonical to themselves. No redirects.
- Concentrate authority on the hub: every city page links up to the hub; hub links to top metros; breadcrumbs throughout. Let Google prefer the hub for the generic query.

## 8. E-E-A-T and content accuracy (YMYL — must be exact)

This is a Your-Money-Your-Life topic; every figure must be current and sourced. Verified as of 2026-07-21:

- **Gold/silver import (customs) duty: 15% total = 10% Basic Customs Duty (BCD) + 5% Agriculture Infrastructure and Development Cess (AIDC).** Effective **13 May 2026**, via Ministry of Finance Customs Notification No. 16/2026.
- With **3% IGST** applied on the assessable value after BCD + AIDC, the **effective duty is ~18.4%** (up from ~9.2%).
- This **reversed the July 2024 Budget cut to 6%** (which was 5% BCD + 1% AIDC). The hike was made to curb imports and support the rupee/forex.
- Jeweller retail price also includes making charges (typically 5%-25%) and hallmarking; the rates we publish are indicative market rates, not final shop prices.
- Every price surface must show a visible "Data verified as of {date} - Source: {source}" line and link to `/methodology`.

ACTION (content correction, tracked here): the current `/gold-rate` and `/silver-rate` copy still says "import duty (6% since the July 2024 budget)". This is now **stale and inaccurate** and must be updated to the 15% (10% BCD + 5% AIDC) figure as part of this build. Recommend a small hotfix to the existing pages even before the full hub ships, since it is a live factual error on a money page.

## 9. Rollout plan (safe, matches our deploy flow)

1. Migration + backfill (idempotent).
2. Cron aggregation + `/api/prices/national`.
3. Hub UI + schema/trust + duty content correction.
4. Verify `typecheck` + `build` + `test` green locally.
5. Deploy with a rollback point; run migration; rebuild; pm2 restart; verify public 200s, headline/trend, canonical tags, and correct duty text.
6. Measure "gold rate today" / "silver rate today" position in GSC over 2-4 weeks.

## 10. Open decisions

1. National number basis (trust-critical): metro average vs a representative standard (e.g., Delhi/Mumbai) vs admin-overridable. Leaning: metro average + admin override, clearly labelled with source.
2. v1 scope: gold + silver first (recommended); fuel/LPG hub later.
3. Chart: reuse city-page charting vs minimal custom SVG (match existing).

## 11. Verification checklist (for the build session)

- [ ] Migration idempotent; backfill populates >= 90 days for gold and silver.
- [ ] Cron upserts `metal_national_daily` after city prices land.
- [ ] `/api/prices/national` returns correct series; hub headline + trend render.
- [ ] Canonicals: hub self-canonical; city pages self-canonical; no accidental cross-canonical.
- [ ] Duty text reads 15% (10% BCD + 5% AIDC), effective 13 May 2026, ~18.4% with IGST; source cited.
- [ ] `typecheck` + `build` + `test` all green; public 200s post-deploy; rollback point saved.
