import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signToken, signRefreshToken } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizeEmail } from '@/lib/sanitize';
import { RowDataPacket } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
  id: number; email: string; password_hash: string; name: string; plan: 'free' | 'premium';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'auth', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetIn);

  try {
    const body = await request.json() as Record<string, unknown>;
    const email = sanitizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email) return NextResponse.json({ success: false, error: 'Please enter a valid email.' }, { status: 400 });
    if (!password) return NextResponse.json({ success: false, error: 'Please enter your password.' }, { status: 400 });

    const users = await query<UserRow[]>('SELECT id, email, password_hash, name, plan FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];
    if (!user) return NextResponse.json({ success: false, error: 'No account found with this email.' }, { status: 401 });

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return NextResponse.json({ success: false, error: 'Incorrect password. Please try again.' }, { status: 401 });

    const token = signToken({ userId: user.id, email: user.email, plan: user.plan });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, plan: user.plan });

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, plan: user.plan }, token });
    response.cookies.set('auth-token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
    response.cookies.set('refresh-token', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/' });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}