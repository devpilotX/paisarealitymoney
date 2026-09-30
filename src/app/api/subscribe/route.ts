import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { sendEmail, getAppUrl, escapeHtml, emailLayout, unsubscribeHeaders } from '@/lib/email';
import { sanitizeEmail } from '@/lib/sanitize';
import crypto from 'crypto';
import type { QueryResultRow } from 'pg';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = sanitizeEmail(body.email);
    if (!email) return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });

    // Check if already exists
    const existing = await query<QueryResultRow & { status: string }>(
      'SELECT status FROM subscribers WHERE email = $1 LIMIT 1', [email]
    );
    if (existing.length > 0) {
      // If unsubscribed, reactivate
      if (existing[0]!.status !== 'active') {
        await execute('UPDATE subscribers SET status = $1 WHERE email = $2', ['active', email]);
      }
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(24).toString('hex');
    await execute(
      'INSERT INTO subscribers (email, source, unsubscribe_token) VALUES ($1, $2, $3)',
      [email, 'website_footer', token]
    );

    // Send confirmation (best-effort)
    const unsub = `${getAppUrl()}/unsubscribe?token=${token}`;
    const html = emailLayout(`
      <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">You are subscribed</h2>
      <p style="margin:0 0 12px;color:#374151;">Thanks for signing up. Once a week we send a short note: what moved in gold and fuel prices, new schemes and scholarships worth knowing about, and one money question answered plainly.</p>
      <p style="margin:0;color:#6B7280;font-size:13px;">Did not sign up? <a href="${escapeHtml(unsub)}" style="color:#4B5563;">Unsubscribe with one click</a>.</p>
    `, 'Your weekly Paisa Reality note starts soon');
    sendEmail({ to: email, subject: 'You are subscribed to Paisa Reality', html, replyTo: 'connect@paisareality.com', headers: unsubscribeHeaders(token) }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });

    const result = await execute('UPDATE subscribers SET status = $1 WHERE unsubscribe_token = $2 AND status = $3', ['unsubscribed', token, 'active']);
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
