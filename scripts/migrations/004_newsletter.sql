-- Migration 004: Newsletter system
-- Run with: psql "$DATABASE_URL" -f scripts/migrations/004_newsletter.sql

CREATE TABLE IF NOT EXISTS subscribers (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email             text    NOT NULL,
    status            text    NOT NULL DEFAULT 'active',
    source            text,
    unsubscribe_token text    NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT subscribers_email_unique UNIQUE (email),
    CONSTRAINT subscribers_token_unique UNIQUE (unsubscribe_token)
);

CREATE TABLE IF NOT EXISTS email_logs (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    to_email   text   NOT NULL,
    subject    text   NOT NULL,
    kind       text   NOT NULL,
    resend_id  text,
    status     text   NOT NULL DEFAULT 'sent',
    error      text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs (created_at DESC);
