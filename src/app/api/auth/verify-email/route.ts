import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import type { QueryResultRow } from 'pg';

interface TokenRow extends QueryResultRow {
  id: number; user_id: number; expires_at: string; used: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/dashboard/account?verify=invalid', request.url));

  try {
    const rows = await query<TokenRow>(
      'SELECT id, user_id, expires_at, used FROM email_verification_tokens WHERE token = $1 LIMIT 1',
      [token]
    );
    const row = rows[0];
    if (!row || row.used || new Date(row.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/dashboard/account?verify=expired', request.url));
    }

    await execute('UPDATE users SET email_verified = true WHERE id = $1', [row.user_id]);
    await execute('UPDATE email_verification_tokens SET used = true WHERE id = $1', [row.id]);

    return NextResponse.redirect(new URL('/dashboard/account?verify=success', request.url));
  } catch {
    return NextResponse.redirect(new URL('/dashboard/account?verify=error', request.url));
  }
}
