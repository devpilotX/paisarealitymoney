import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse, hashPassword, verifyPassword } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { sendPasswordChangedEmail } from '@/lib/email';
import type { QueryResultRow } from 'pg';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const body = await request.json() as Record<string, unknown>;
    const currentPassword = typeof body.current_password === 'string' ? body.current_password : '';
    const newPassword = typeof body.new_password === 'string' ? body.new_password : '';

    if (!currentPassword) return NextResponse.json({ success: false, error: 'Current password is required.' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ success: false, error: 'New password must be at least 8 characters.' }, { status: 400 });

    const rows = await query<QueryResultRow & { password_hash: string; email: string; name: string }>(
      'SELECT password_hash, email, name FROM users WHERE id = $1 LIMIT 1',
      [auth.user.userId]
    );
    const user = rows[0];
    if (!user) return unauthorizedResponse('User not found.');

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 403 });

    const newHash = await hashPassword(newPassword);
    await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, auth.user.userId]);

    sendPasswordChangedEmail(user.email, user.name || 'User').catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
