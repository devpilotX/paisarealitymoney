/**
 * Uploaded images live in PostgreSQL, so they survive every release swap
 * (releases are separate directories) and ride along in the encrypted backups.
 */
import { randomBytes } from 'crypto';
import { pgQuery } from '@/lib/db';
import type { ImageKind } from '@/lib/upload-core';

let ready: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  ready ??= pgQuery(`
    CREATE TABLE IF NOT EXISTS media_uploads (
      id          SERIAL PRIMARY KEY,
      token       TEXT NOT NULL,
      mime        TEXT NOT NULL,
      ext         TEXT NOT NULL,
      original    TEXT,
      size_bytes  INTEGER NOT NULL,
      data        BYTEA NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).then(() => undefined).catch((e: unknown) => { ready = null; throw e; });
  return ready;
}

/** Stores the image and returns its public path, e.g. /media/12-0123456789abcdef.png */
export async function saveUpload(data: Buffer, kind: ImageKind, original: string | null): Promise<string> {
  await ensureTable();
  const token = randomBytes(8).toString('hex');
  const rows = await pgQuery<{ id: number }>(
    `INSERT INTO media_uploads (token, mime, ext, original, size_bytes, data)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [token, kind.mime, kind.ext, original ? original.slice(0, 200) : null, data.length, data],
  );
  const row = rows[0];
  if (!row) throw new Error('upload insert returned no id');
  return `/media/${row.id}-${token}.${kind.ext}`;
}

export async function getUpload(id: number, token: string): Promise<{ mime: string; data: Buffer } | null> {
  await ensureTable();
  const rows = await pgQuery<{ mime: string; data: Buffer }>(
    'SELECT mime, data FROM media_uploads WHERE id = $1 AND token = $2',
    [id, token],
  );
  return rows[0] ?? null;
}
