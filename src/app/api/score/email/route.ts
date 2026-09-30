import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getAppUrl, escapeHtml, emailLayout, btn } from '@/lib/email';
import { execute } from '@/lib/db';
import { sanitizeEmail } from '@/lib/sanitize';
import crypto from 'crypto';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = sanitizeEmail(body.email);
    if (!email) return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });

    const score = Number(body.score) || 0;
    const band = typeof body.band === 'string' ? body.band : '';
    const pillars = Array.isArray(body.pillars) ? body.pillars as { name: string; score: number }[] : [];
    const subscribe = body.subscribe === true;

    // Build pillar table rows
    const pillarRows = pillars.map(p =>
      `<tr><td style="padding:6px 12px;font-size:14px;color:#374151;">${escapeHtml(p.name)}</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#1C3A5E;">${p.score}/100</td></tr>`
    ).join('');

    const html = emailLayout(`
      <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 4px;font-weight:600;">Your Money Health Score</h2>
      <p style="font-size:14px;color:#6B7280;margin:0 0 20px;">Worked out from the answers you gave on paisareality.com.</p>
      <p style="font-size:44px;line-height:1;font-weight:700;color:#1C3A5E;margin:0;">${score}<span style="font-size:18px;font-weight:500;color:#6B7280;"> out of 900</span></p>
      <p style="font-size:15px;color:#374151;margin:8px 0 20px;">Band: <strong>${escapeHtml(band)}</strong></p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;border-collapse:separate;">${pillarRows}</table>
      ${btn(`${getAppUrl()}/score`, 'See what to improve first')}
      <p style="font-size:13px;color:#6B7280;margin:0;">This score is an educational summary, not financial advice.</p>
    `, `Your score is ${score} out of 900`);

    const result = await sendEmail({ to: email, subject: `Your Money Health Score: ${score}/900`, html, replyTo: 'connect@paisareality.com' });

    // Log
    execute(
      'INSERT INTO email_logs (to_email, subject, kind, resend_id, status, error) VALUES ($1, $2, $3, $4, $5, $6)',
      [email, `Score: ${score}/900`, 'score_result', result.id || null, result.ok ? 'sent' : 'failed', result.error || null]
    ).catch(() => {});

    // Optional newsletter subscribe
    if (subscribe) {
      const token = crypto.randomBytes(24).toString('hex');
      execute(
        "INSERT INTO subscribers (email, source, unsubscribe_token) VALUES ($1, 'score_page', $2) ON CONFLICT (email) DO NOTHING",
        [email, token]
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
