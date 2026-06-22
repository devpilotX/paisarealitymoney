import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

interface UserRow extends QueryResultRow {
  id: number; email: string; name: string; plan: string;
  full_name: string | null; phone: string | null; city: string | null;
  email_verified: boolean; created_at: string; last_login_at: string | null;
  age: number | null; gender: string | null; state: string | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const users = await query<UserRow>(
      'SELECT id, email, name, plan, full_name, phone, city, email_verified, created_at, last_login_at, age, gender, state FROM users WHERE id = $1 LIMIT 1',
      [auth.user.userId]
    );
    const user = users[0];
    if (!user) return unauthorizedResponse('User not found.');
    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
