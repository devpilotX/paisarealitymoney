-- Self-hosted Ad Manager: admin-managed image / video / html ad creatives.
-- Idempotent and additive. Safe to run multiple times. Touches no existing table.

CREATE TABLE IF NOT EXISTS ad_creatives (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,                 -- internal label, e.g. "Diwali gold sale banner"
  placement    TEXT NOT NULL,                 -- slot key: 'home-top','article-inline','sidebar','footer', etc.
  type         TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video' | 'html'
  image_url    TEXT,                          -- for type='image'
  video_url    TEXT,                          -- for type='video' (mp4/webm)
  html         TEXT,                          -- for type='html' (raw sanitized markup)
  link_url     TEXT,                          -- click-through destination
  alt_text     TEXT,                          -- accessibility text / aria-label
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  priority     INTEGER NOT NULL DEFAULT 0,    -- higher wins when several target one placement
  starts_at    TIMESTAMPTZ,                   -- NULL = no start bound
  ends_at      TIMESTAMPTZ,                   -- NULL = no end bound
  impressions  BIGINT NOT NULL DEFAULT 0,
  clicks       BIGINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup of the winning active creative for a placement.
CREATE INDEX IF NOT EXISTS idx_ad_creatives_placement
  ON ad_creatives (placement, active, priority DESC);
