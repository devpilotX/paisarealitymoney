import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

interface SavedRow extends QueryResultRow {
  id: number; slug: string; name: string; category: string; level: string;
  benefit_summary: string | null; benefit_amount_max: number | null; saved_at: string;
}

/** The signed-in user's saved schemes, newest first. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  try {
    const rows = await query<SavedRow>(
      `SELECT s.id, s.slug, s.name, s.category, s.level, s.benefit_summary, s.benefit_amount_max, b.created_at AS saved_at
         FROM bookmarks b JOIN schemes s ON s.id = b.scheme_id
        WHERE b.user_id = $1 AND s.is_active
        ORDER BY b.created_at DESC`,
      [auth.user.userId],
    );
    return NextResponse.json({ success: true, schemes: rows });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load your saved schemes.' }, { status: 500 });
  }
}

async function schemeId(slug: unknown): Promise<number | null> {
  if (typeof slug !== 'string' || !/^[a-z0-9-]{2,120}$/.test(slug)) return null;
  const r = await query<QueryResultRow & { id: number }>('SELECT id FROM schemes WHERE slug = $1 AND is_active LIMIT 1', [slug]);
  return r[0]?.id ?? null;
}

/** Save a scheme: { slug }. Saving twice is harmless. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  try {
    const body = (await request.json()) as { slug?: unknown };
    const id = await schemeId(body.slug);
    if (!id) return NextResponse.json({ success: false, error: 'Unknown scheme.' }, { status: 404 });
    await execute('INSERT INTO bookmarks (user_id, scheme_id) VALUES ($1, $2) ON CONFLICT (user_id, scheme_id) DO NOTHING', [auth.user.userId, id]);
    return NextResponse.json({ success: true, saved: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not save the scheme.' }, { status: 500 });
  }
}

/** Remove a saved scheme: { slug }. */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  try {
    const body = (await request.json()) as { slug?: unknown };
    const id = await schemeId(body.slug);
    if (!id) return NextResponse.json({ success: false, error: 'Unknown scheme.' }, { status: 404 });
    await execute('DELETE FROM bookmarks WHERE user_id = $1 AND scheme_id = $2', [auth.user.userId, id]);
    return NextResponse.json({ success: true, saved: false });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not remove the scheme.' }, { status: 500 });
  }
}
