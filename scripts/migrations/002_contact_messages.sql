-- Migration 002: Create contact_messages table
-- Run with: psql "$DATABASE_URL" -f scripts/migrations/002_contact_messages.sql

CREATE TABLE IF NOT EXISTS contact_messages (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       text    NOT NULL,
    email      text    NOT NULL,
    message    text    NOT NULL,
    is_read    boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages (is_read, created_at DESC);
