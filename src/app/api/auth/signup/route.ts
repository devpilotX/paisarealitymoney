import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { hashPassword, signToken, signRefreshToken } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizeString, sanitizeEmail } from '@/lib/sanitize';
import { sendWelcomeEmail } from '@/lib/email';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'auth', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetIn);

  try {
    const body = await request.json() as Record<string, unknown>;
    const name = sanitizeString(body.name);
    const email = sanitizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || name.length < 2) return NextResponse.json({ success: false, error: 'Name must be at least 2 characters.' }, { status: 400 });
    if (!email) return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });

    const existing = await query<RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const result = await execute('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email, passwordHash, name]);
    const userId = result.insertId;

    const token = signToken({ userId, email, plan: 'free' });
    const refreshToken = signRefreshToken({ userId, email, plan: 'free' });

    sendWelcomeEmail(email, name).catch((err) => console.error('Welcome email failed:', err));

    const response = NextResponse.json({ success: true, user: { id: userId, name, email, plan: 'free' }, token }, { status: 201 });
    response.cookies.set('auth-token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
    response.cookies.set('refresh-token', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/' });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}