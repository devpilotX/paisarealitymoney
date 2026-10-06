import { NextRequest, NextResponse } from 'next/server';
import { recordClick } from '@/lib/ads';
import { getAppUrl } from '@/lib/email';

/** GET /api/ads/click?id=123 -> records a click and redirects to the ad's https destination. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Behind nginx the request origin is the internal address, so build the fallback from APP_URL.
  const home = new URL('/', getAppUrl());
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.redirect(home);

  const dest = await recordClick(id);
  if (!dest) return NextResponse.redirect(home);

  try {
    const target = new URL(dest);
    if (target.protocol === 'https:' || target.protocol === 'http:') {
      const res = NextResponse.redirect(target, 302);
      res.headers.set('Cache-Control', 'no-store');
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }
  } catch {
    // fall through to home on an invalid URL
  }
  return NextResponse.redirect(home);
}
