import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Lightweight "am I signed in?" check for the header. Always answers 200 so the
 * browser console stays clean for visitors who are not signed in. Reads only the
 * signed token; no database call.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  return NextResponse.json(
    auth.authenticated ? { signedIn: true, plan: auth.user.plan } : { signedIn: false },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
