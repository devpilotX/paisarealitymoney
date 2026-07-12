import { query, execute } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import { AD_PLACEMENTS, AD_TYPES, type AdType } from '@/lib/ads-constants';

export { AD_PLACEMENTS, AD_TYPES };
export type { AdType };

interface AdRow extends QueryResultRow {
  id: number;
  name: string;
  placement: string;
  type: string;
  image_url: string | null;
  video_url: string | null;
  html: string | null;
  link_url: string | null;
  alt_text: string | null;
  active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export interface AdCreative {
  id: number;
  name: string;
  placement: string;
  type: AdType;
  imageUrl: string | null;
  videoUrl: string | null;
  html: string | null;
  linkUrl: string | null;
  altText: string | null;
  active: boolean;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdInput {
  name: string;
  placement: string;
  type: AdType;
  imageUrl?: string | null;
  videoUrl?: string | null;
  html?: string | null;
  linkUrl?: string | null;
  altText?: string | null;
  active?: boolean;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

const COLS = `id, name, placement, type, image_url, video_url, html, link_url, alt_text,
  active, priority, starts_at::text AS starts_at, ends_at::text AS ends_at,
  impressions::int AS impressions, clicks::int AS clicks,
  created_at::text AS created_at, updated_at::text AS updated_at`;

function toAd(r: AdRow): AdCreative {
  const type: AdType = (AD_TYPES as readonly string[]).includes(r.type) ? (r.type as AdType) : 'image';
  return {
    id: r.id, name: r.name, placement: r.placement, type,
    imageUrl: r.image_url, videoUrl: r.video_url, html: r.html,
    linkUrl: r.link_url, altText: r.alt_text, active: r.active, priority: r.priority,
    startsAt: r.starts_at, endsAt: r.ends_at,
    impressions: r.impressions, clicks: r.clicks,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

/** Winning active creative for a placement (scheduling-aware). Null when none or table missing. */
export async function getActiveAdForPlacement(placement: string): Promise<AdCreative | null> {
  try {
    const rows = await query<AdRow>(
      `SELECT ${COLS} FROM ad_creatives
        WHERE placement = $1 AND active = TRUE
          AND (starts_at IS NULL OR starts_at <= NOW())
          AND (ends_at IS NULL OR ends_at >= NOW())
        ORDER BY priority DESC, updated_at DESC
        LIMIT 1`,
      [placement],
    );
    return rows[0] ? toAd(rows[0]) : null;
  } catch {
    return null;
  }
}

/** All creatives for the admin list. Empty array when the table is missing. */
export async function getAllAds(): Promise<AdCreative[]> {
  try {
    const rows = await query<AdRow>(`SELECT ${COLS} FROM ad_creatives ORDER BY placement ASC, priority DESC, updated_at DESC`);
    return rows.map(toAd);
  } catch {
    return [];
  }
}

export async function getAdById(id: number): Promise<AdCreative | null> {
  try {
    const rows = await query<AdRow>(`SELECT ${COLS} FROM ad_creatives WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] ? toAd(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function createAd(input: AdInput): Promise<number> {
  const res = await execute<QueryResultRow & { id: number }>(
    `INSERT INTO ad_creatives
       (name, placement, type, image_url, video_url, html, link_url, alt_text, active, priority, starts_at, ends_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [
      input.name, input.placement, input.type,
      input.imageUrl || null, input.videoUrl || null, input.html || null,
      input.linkUrl || null, input.altText || null,
      input.active ?? true, input.priority ?? 0,
      input.startsAt || null, input.endsAt || null,
    ],
  );
  return res.rows[0]?.id ?? 0;
}

export async function updateAd(id: number, input: AdInput): Promise<void> {
  await execute(
    `UPDATE ad_creatives SET
       name=$2, placement=$3, type=$4, image_url=$5, video_url=$6, html=$7,
       link_url=$8, alt_text=$9, active=$10, priority=$11, starts_at=$12, ends_at=$13, updated_at=NOW()
     WHERE id=$1`,
    [
      id, input.name, input.placement, input.type,
      input.imageUrl || null, input.videoUrl || null, input.html || null,
      input.linkUrl || null, input.altText || null,
      input.active ?? true, input.priority ?? 0,
      input.startsAt || null, input.endsAt || null,
    ],
  );
}

export async function deleteAd(id: number): Promise<void> {
  await execute('DELETE FROM ad_creatives WHERE id = $1', [id]);
}

export async function recordImpression(id: number): Promise<void> {
  try {
    await execute('UPDATE ad_creatives SET impressions = impressions + 1 WHERE id = $1', [id]);
  } catch {
    // tracking is best-effort
  }
}

/** Increment clicks and return the destination URL (or null). */
export async function recordClick(id: number): Promise<string | null> {
  try {
    const res = await execute<QueryResultRow & { link_url: string | null }>(
      'UPDATE ad_creatives SET clicks = clicks + 1 WHERE id = $1 RETURNING link_url',
      [id],
    );
    return res.rows[0]?.link_url ?? null;
  } catch {
    return null;
  }
}
