import { NextRequest, NextResponse } from 'next/server';
import { recordImpression } from '@/lib/ads';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/** POST /api/ads/impression  body: { id: number }  -> best-effort impression count. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Throttle per visitor so a script cannot inflate a creative's numbers. Still answer 200.
  if (!checkRateLimit(request, 'ad-impression', RATE_LIMITS.api).allowed) return NextResponse.json({ ok: true });
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
