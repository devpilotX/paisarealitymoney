import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // In production: admin.paisareality.com rewrites to /admin
  if (host.startsWith('admin.')) {
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin') && !pathname.startsWith('/_next')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin' + pathname;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
