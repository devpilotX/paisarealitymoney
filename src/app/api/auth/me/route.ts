import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
  id: number; email: string; name: string; plan: string;
  age: number | null; gender: string | null; state: string | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const users = await query<UserRow[]>(
      'SELECT id, email, name, plan, age, gender, state FROM users WHERE id = ? LIMIT 1',
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