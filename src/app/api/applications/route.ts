import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

const STATUSES = ['not_started', 'applied', 'under_review', 'approved', 'rejected'] as const;
type Status = (typeof STATUSES)[number];

interface AppRow extends QueryResultRow {
  id: number; slug: string; name: string; status: Status; reference_number: string | null;
  applied_date: string | null; notes: string | null; updated_at: string; official_url: string | null;
}

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/[\u0000-\u001f]/g, ' ').trim();
  return t ? t.slice(0, max) : null;
};

/** Every application the user is tracking. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  try {
    const rows = await query<AppRow>(
      `SELECT a.id, s.slug, s.name, a.status, a.reference_number, a.applied_date::text, a.notes, a.updated_at, s.official_url
         FROM applications a JOIN schemes s ON s.id = a.scheme_id
        WHERE a.user_id = $1 ORDER BY a.updated_at DESC`,
      [auth.user.userId],
    );
    return NextResponse.json({ success: true, applications: rows });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load your applications.' }, { status: 500 });
  }
}

/**
 * Add or update the tracked application for one scheme:
 * { slug, status?, reference_number?, applied_date?, notes? }. One row per scheme per user.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  try {
    const b = (await request.json()) as Record<string, unknown>;
    const slug = typeof b.slug === 'string' && /^[a-z0-9-]{2,120}$/.test(b.slug) ? b.slug : null;
    const status = (STATUSES as readonly string[]).includes(String(b.status ?? 'not_started')) ? String(b.status ?? 'not_started') : null;
    const date = typeof b.applied_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.applied_date) ? b.applied_date : null;
    if (!slug || !status) return NextResponse.json({ success: false, error: 'Check the scheme and status.' }, { status: 400 });
    const s = await query<QueryResultRow & { id: number }>('SELECT id FROM schemes WHERE slug = $1 LIMIT 1', [slug]);
    if (!s[0]) return NextResponse.json({ success: false, error: 'Unknown scheme.' }, { status: 404 });

    const existing = await query<QueryResultRow & { id: number }>('SELECT id FROM applications WHERE user_id = $1 AND scheme_id = $2 LIMIT 1', [auth.user.userId, s[0].id]);
    const vals = [status, clean(b.reference_number, 80), date, clean(b.notes, 1000)];
    if (existing[0]) {
      await execute(
        'UPDATE applications SET status = $1, reference_number = $2, applied_date = $3, notes = $4, updated_at = NOW() WHERE id = $5 AND user_id = $6',
        [...vals, existing[0].id, auth.user.userId],
      );
    } else {
      await execute(
        'INSERT INTO applications (user_id, scheme_id, status, reference_number, applied_date, notes) VALUES ($1, $2, $3, $4, $5, $6)',
        [auth.user.userId, s[0].id, ...vals],
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not save the application.' }, { status: 500 });
  }
}

/** Stop tracking: { id }. Only the owner's row can be removed. */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  try {
    const b = (await request.json()) as { id?: unknown };
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ success: false, error: 'Invalid id.' }, { status: 400 });
    await execute('DELETE FROM applications WHERE id = $1 AND user_id = $2', [id, auth.user.userId]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not remove it.' }, { status: 500 });
  }
}
