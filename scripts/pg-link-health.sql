-- Health of the official links on scheme and scholarship pages, kept by
-- /api/cron/links (called by n8n every two hours, a batch at a time).
--   link_failures      failed checks in a row; reset by one good check
--   content_hash       hash of the official page's visible text at the last check
--   content_changed_at when that hash last changed, so a person can review the record
-- Scheme and scholarship pages are never hidden automatically: a failing portal is
-- often temporary, and the page is still useful. They are reported instead.
ALTER TABLE schemes      ADD COLUMN IF NOT EXISTS link_failures      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schemes      ADD COLUMN IF NOT EXISTS link_checked_at    TIMESTAMPTZ;
ALTER TABLE schemes      ADD COLUMN IF NOT EXISTS link_last_status   TEXT;
ALTER TABLE schemes      ADD COLUMN IF NOT EXISTS content_hash       TEXT;
ALTER TABLE schemes      ADD COLUMN IF NOT EXISTS content_changed_at TIMESTAMPTZ;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS link_failures      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS link_checked_at    TIMESTAMPTZ;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS link_last_status   TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS content_hash       TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS content_changed_at TIMESTAMPTZ;
ALTER TABLE grants       ADD COLUMN IF NOT EXISTS content_hash       TEXT;
ALTER TABLE grants       ADD COLUMN IF NOT EXISTS content_changed_at TIMESTAMPTZ;

-- Weekly market wraps are generated from data; the slug is unique per week.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;
