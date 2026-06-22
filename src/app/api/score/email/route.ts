import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getAppUrl, escapeHtml } from '@/lib/email';
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
      `<tr><td style="padding:6px 12px;font-size:14px;color:#374151;">${escapeHtml(p.name)}</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#007A78;">${p.score}/100</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#f9fafb;">
<div style="background:#fff;border-radius:12px;margin:20px;overflow:hidden;border:1px solid #e5e7eb;">
<div style="background:#007A78;padding:24px;text-align:center;">
<h1 style="color:#fff;font-size:22px;margin:0;">Paisa Reality</h1>
<p style="color:#d1fae5;font-size:13px;margin:6px 0 0;">Money Health Score</p>
</div>
<div style="padding:32px 28px;text-align:center;">
<p style="font-size:48px;font-weight:800;color:#007A78;margin:0;">${score}</p>
<p style="font-size:16px;color:#374151;margin:4px 0 0;">out of 900 | <strong>${escapeHtml(band)}</strong></p>
<table style="width:100%;border-collapse:collapse;margin:24px 0;text-align:left;">
<thead><tr><th style="padding:6px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Pillar</th><th style="padding:6px 12px;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Score</th></tr></thead>
<tbody>${pillarRows}</tbody>
</table>
<a href="${getAppUrl()}/score" style="background:#007A78;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">Improve Your Score</a>
</div>
<div style="background:#f9fafb;padding:16px 28px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="font-size:11px;color:#9ca3af;margin:0;">paisareality.com</p>
</div></div></body></html>`;

    const result = await sendEmail({ to: email, subject: `Your Money Health Score: ${score}/900`, html, replyTo: 'contact@paisareality.com' });

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
