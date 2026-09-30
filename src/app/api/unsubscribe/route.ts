import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

/**
 * One-click unsubscribe (RFC 8058). Mail clients such as Gmail POST here directly
 * from the List-Unsubscribe header, with no page visit. The token is the
 * per-subscriber random value stored in subscribers.unsubscribe_token.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = (request.nextUrl.searchParams.get('token') || '').trim();
  if (!/^[a-f0-9]{16,128}$/i.test(token)) return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
  try {
    await execute("UPDATE subscribers SET status = 'unsubscribed' WHERE unsubscribe_token = $1 AND status = 'active'", [token]);
    // Same answer whether or not the token matched, so tokens cannot be probed.
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
