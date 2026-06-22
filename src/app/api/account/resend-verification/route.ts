import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import type { QueryResultRow } from 'pg';
import crypto from 'crypto';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const rows = await query<QueryResultRow & { email: string; name: string; email_verified: boolean }>(
      'SELECT email, name, email_verified FROM users WHERE id = $1 LIMIT 1',
      [auth.user.userId]
    );
    const user = rows[0];
    if (!user) return unauthorizedResponse('User not found.');
    if (user.email_verified) return NextResponse.json({ success: false, error: 'Email is already verified.' }, { status: 400 });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await execute(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [auth.user.userId, token, expiresAt]
    );

    sendVerificationEmail(user.email, user.name || 'User', token).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
