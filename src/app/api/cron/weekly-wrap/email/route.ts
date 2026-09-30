import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { secretMatches } from '@/lib/secret-compare';
import { sendEmail, wrapBroadcast, unsubscribeHeaders, escapeHtml, btn, getAppUrl } from '@/lib/email';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface Post extends QueryResultRow { id: number; slug: string; title: string; description: string }
interface Sub extends QueryResultRow { email: string; unsubscribe_token: string }

/**
 * Emails the newest weekly wrap to active subscribers, once. Triggered only when the
 * owner sends /sendwrap to the Telegram bot. The post is claimed (emailed_at set)
 * before sending, so a repeated command cannot send it twice. Bearer CRON_SECRET only.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secretMatches(bearer, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [post] = await query<Post>(
    `UPDATE blog_posts SET emailed_at = NOW()
      WHERE id = (SELECT id FROM blog_posts WHERE slug LIKE 'weekly-prices-%' AND is_published
                   ORDER BY published_at DESC LIMIT 1)
        AND emailed_at IS NULL
      RETURNING id, slug, title, description`);
  if (!post) return NextResponse.json({ success: true, skipped: 'the latest weekly post was already emailed, or none exists' });

  const url = `${getAppUrl()}/newsletter/${post.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${post.slug}`;
  const body = `
    <h1 style="font-size:22px;line-height:1.3;color:#1C3A5E;margin:0 0 12px;">${escapeHtml(post.title)}</h1>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 20px;">${escapeHtml(post.description)}</p>
    ${btn(url, 'Read this week\u2019s prices')}
    <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:20px 0 0;">You get this because you subscribed on paisareality.com. One email a week, at most.</p>`;

  const subs = await query<Sub>("SELECT email, unsubscribe_token FROM subscribers WHERE status = 'active'");
  let sent = 0;
  let failed = 0;
  for (const sub of subs) {
    const result = await sendEmail({
      to: sub.email,
      subject: post.title,
      html: wrapBroadcast(body, sub.unsubscribe_token),
      replyTo: 'connect@paisareality.com',
      headers: unsubscribeHeaders(sub.unsubscribe_token),
    });
    if (result.ok) sent++; else failed++;
    await execute(
      'INSERT INTO email_logs (to_email, subject, kind, resend_id, status, error) VALUES ($1, $2, $3, $4, $5, $6)',
      [sub.email, post.title, 'weekly_wrap', result.id || null, result.ok ? 'sent' : 'failed', result.error || null],
    ).catch(() => {});
  }
  return NextResponse.json({ success: true, slug: post.slug, sent, failed, total: subs.length });
}
