import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import { sendEmail, wrapBroadcast } from '@/lib/email';
import type { QueryResultRow } from 'pg';

interface Sub extends QueryResultRow { email: string; unsubscribe_token: string; }

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { subject?: string; html?: string };
    const subject = (body.subject || '').trim();
    const htmlBody = (body.html || '').trim();
    if (!subject || !htmlBody) return NextResponse.json({ error: 'Subject and body required.' }, { status: 400 });

    const subs = await query<Sub>("SELECT email, unsubscribe_token FROM subscribers WHERE status = 'active'");
    let sent = 0; let failed = 0;

    for (const sub of subs) {
      const html = wrapBroadcast(htmlBody, sub.unsubscribe_token);
      const result = await sendEmail({ to: sub.email, subject, html, replyTo: 'contact@paisareality.com' });
      const status = result.ok ? 'sent' : 'failed';
      if (result.ok) sent++; else failed++;
      execute(
        'INSERT INTO email_logs (to_email, subject, kind, resend_id, status, error) VALUES ($1, $2, $3, $4, $5, $6)',
        [sub.email, subject, 'broadcast', result.id || null, status, result.error || null]
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, sent, failed, total: subs.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
