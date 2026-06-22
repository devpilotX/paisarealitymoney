import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { sendPasswordReset } from '@/lib/email';
import { sanitizeEmail } from '@/lib/sanitize';
import type { QueryResultRow } from 'pg';
import crypto from 'crypto';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = sanitizeEmail(body.email);
    if (!email) return NextResponse.json({ success: true }); // never reveal existence

    const rows = await query<QueryResultRow & { id: number }>(
      'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]
    );
    if (rows[0]) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await execute(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [rows[0].id, token, expiresAt]
      );
      sendPasswordReset(email, token).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // always same response
  }
}
