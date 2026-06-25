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

export function middleware(request: NextRequest): NextResponse {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname } = request.nextUrl;
  const isAdminHost = host.startsWith(ADMIN_HOST_PREFIX);

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
