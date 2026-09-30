import { NextResponse } from 'next/server';

/**
 * Sign out. The session cookies are httpOnly, so the browser cannot clear them
 * from JavaScript; only a response from the server can.
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  for (const name of ['auth-token', 'refresh-token']) {
    response.cookies.set(name, '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
  }
  return response;
}
