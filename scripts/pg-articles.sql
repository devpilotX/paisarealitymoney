-- Daily researched articles published by the n8n "Content: daily verified article" workflow.
--   sources      [{ "title": ..., "url": ... }] shown under every article and used as schema.org citations
--   topic_key    normalised topic, so the same story is not written twice in 30 days
--   origin       'admin' (written in the dashboard), 'weekly-wrap', or 'daily-research'
-- Idempotent and additive.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS sources   JSONB;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS topic_key TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS origin    TEXT NOT NULL DEFAULT 'admin';
CREATE INDEX IF NOT EXISTS idx_blog_topic_key ON blog_posts (topic_key, published_at DESC);
