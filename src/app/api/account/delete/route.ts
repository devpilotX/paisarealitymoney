import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import { withPgTransaction } from '@/lib/db/pg';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import type { QueryResultRow } from 'pg';

/**
 * Permanently delete the signed-in user's account and the personal data tied
 * to it (right to erasure under the DPDP Act, 2023). Requires the current
 * password so a stolen session alone cannot wipe an account.
 *
 * Bookmarks, applications, price alerts and auth tokens go through ON DELETE
 * CASCADE. Scores and snapshots store the user id as text without a foreign
 * key, and newsletter and reminder rows are keyed by email, so those are
 * removed explicitly in the same transaction.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  const rateCheck = checkRateLimit(request, 'account-delete', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetIn);

  try {
    const body = await request.json() as Record<string, unknown>;
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) return NextResponse.json({ success: false, error: 'Enter your password to confirm.' }, { status: 400 });

    const rows = await query<QueryResultRow & { password_hash: string; email: string }>(
      'SELECT password_hash, email FROM users WHERE id = $1 LIMIT 1',
      [auth.user.userId]
    );
    const user = rows[0];
    if (!user) return unauthorizedResponse('User not found.');
    if (!(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ success: false, error: 'Password is incorrect.' }, { status: 403 });
    }

    const userIdText = String(auth.user.userId);
    await withPgTransaction(async (client) => {
      // Tables that may not exist on an older database are skipped with a savepoint.
      const optional = async (sql: string, params: unknown[]): Promise<void> => {
        await client.query('SAVEPOINT opt');
        try {
          await client.query(sql, params);
          await client.query('RELEASE SAVEPOINT opt');
        } catch {
          await client.query('ROLLBACK TO SAVEPOINT opt');
        }
      };
      await optional('DELETE FROM scores WHERE user_id = $1', [userIdText]);
      await optional('DELETE FROM financial_snapshots WHERE user_id = $1', [userIdText]);
      await optional('DELETE FROM scholarship_reminders WHERE lower(email) = lower($1)', [user.email]);
      await optional('DELETE FROM subscribers WHERE lower(email) = lower($1)', [user.email]);
      await client.query('DELETE FROM users WHERE id = $1', [auth.user.userId]);
    });

    const response = NextResponse.json({ success: true });
    for (const name of ['auth-token', 'refresh-token']) {
      response.cookies.set(name, '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
    }
    return response;
  } catch (error) {
    console.error('account delete error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
