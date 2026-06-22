import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { sendEmail, getAppUrl, escapeHtml } from '@/lib/email';
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
    const html = `<div style="font-family:Inter,system-ui,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <h2 style="color:#007A78;">You are subscribed!</h2>
      <p>Thank you for subscribing to the Paisa Reality newsletter. You will receive updates on prices, tools, and financial tips.</p>
      <p style="font-size:12px;color:#6b7280;margin-top:24px;"><a href="${escapeHtml(unsub)}">Unsubscribe</a></p>
    </div>`;
    sendEmail({ to: email, subject: 'Subscribed to Paisa Reality', html, replyTo: 'contact@paisareality.com' }).catch(() => {});

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
