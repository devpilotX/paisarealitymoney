import { NextRequest, NextResponse } from 'next/server';
import { recordImpression } from '@/lib/ads';

/** POST /api/ads/impression  body: { id: number }  -> best-effort impression count. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { id } = (await request.json()) as { id?: number };
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
      await recordImpression(id);
    }
  } catch {
    // best-effort: never error the beacon
  }
  return NextResponse.json({ ok: true });
}
