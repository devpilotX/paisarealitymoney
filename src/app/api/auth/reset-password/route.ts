import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendPasswordChangedEmail } from '@/lib/email';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import type { QueryResultRow } from 'pg';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'auth', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetIn);

  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[a-f0-9]{64}$/i.test(token)) return NextResponse.json({ success: false, error: 'This reset link is invalid or has expired.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
    if (password.length > 128) return NextResponse.json({ success: false, error: 'Password must be at most 128 characters.' }, { status: 400 });

    // Claim the token atomically, so two concurrent requests cannot both use it.
    const claimed = await query<QueryResultRow & { user_id: number }>(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1 AND used = false AND expires_at > now() RETURNING user_id',
      [token]
    );
    const userId = claimed[0]?.user_id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const newHash = await hashPassword(password);
    await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    // Any other outstanding reset links for this account stop working too.
    await execute('UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false', [userId]);

    const users = await query<QueryResultRow & { email: string; name: string | null }>(
      'SELECT email, name FROM users WHERE id = $1', [userId]
    );
    if (users[0]) sendPasswordChangedEmail(users[0].email, users[0].name || 'there').catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('reset-password error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
