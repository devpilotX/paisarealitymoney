import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import type { QueryResultRow } from 'pg';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) return NextResponse.json({ success: false, error: 'Invalid token.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });

    const rows = await query<QueryResultRow & { id: number; user_id: number; expires_at: string; used: boolean }>(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1 LIMIT 1', [token]
    );
    const row = rows[0];
    if (!row || row.used || new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const newHash = await hashPassword(password);
    await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, row.user_id]);
    await execute('UPDATE password_reset_tokens SET used = true WHERE id = $1', [row.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
