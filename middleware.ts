import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Subdomain routing for the admin area.
 *
 * - On admin.paisareality.com the whole site is the admin dashboard: the
 *   subdomain root and any non-admin path are routed into the /admin section,
 *   while /admin, /api, and framework assets pass through untouched.
 * - On the main domain (paisareality.com and www) the admin area does not
 *   exist: any /admin or /api/admin request returns a 404, so the admin
 *   dashboard is never reachable at paisareality.com/admin.
 */

const ADMIN_HOST_PREFIX = 'admin.';

function isAdminPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  );
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF guard for cookie-authenticated API calls. Browsers always send Origin on
 * a cross-site POST, so a request whose Origin names another host is refused.
 * Requests with no Origin (server-to-server: Razorpay webhook, cron, one-click
 * unsubscribe from a mail client) pass, because they carry no browser cookies
 * worth forging.
 */
function isCrossSiteWrite(request: NextRequest, host: string): boolean {
  if (!MUTATING.has(request.method)) return false;
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  try {
    return new URL(origin).host.toLowerCase() !== host;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest): NextResponse {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname } = request.nextUrl;
  const isAdminHost = host.startsWith(ADMIN_HOST_PREFIX);

  if (pathname.startsWith('/api/') && isCrossSiteWrite(request, host)) {
    return NextResponse.json({ error: 'Cross-site request refused.' }, { status: 403 });
  }

  if (isAdminHost) {
    // Route the admin subdomain into the /admin section of the app.
    const passThrough =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next');

    if (!passThrough) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Main domain: the admin area is not available here.
  if (isAdminPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/_not-found';
    return NextResponse.rewrite(url, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
