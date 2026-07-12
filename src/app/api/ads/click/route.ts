import { NextRequest, NextResponse } from 'next/server';
import { recordClick } from '@/lib/ads';

/** GET /api/ads/click?id=123 -> records a click and 302-redirects to the ad's destination. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  const home = new URL('/', origin);
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isFinite(id) || id <= 0) return NextResponse.redirect(home);

  const dest = await recordClick(id);
  if (!dest) return NextResponse.redirect(home);

  try {
    const target = new URL(dest);
    if (target.protocol === 'http:' || target.protocol === 'https:') {
      return NextResponse.redirect(target);
    }
  } catch {
    // fall through to home on an invalid URL
  }
  return NextResponse.redirect(home);
}
