import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { execute } from '@/lib/db';
import { sanitizeString } from '@/lib/sanitize';

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const body = await request.json() as Record<string, unknown>;
    const full_name = sanitizeString(body.full_name);
    const phone = sanitizeString(body.phone);
    const city = sanitizeString(body.city);

    if (!full_name || full_name.length < 2) {
      return NextResponse.json({ success: false, error: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    await execute(
      'UPDATE users SET full_name = $1, phone = $2, city = $3, name = $1 WHERE id = $4',
      [full_name, phone || null, city || null, auth.user.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
  }
}
