import nodemailer, { type Transporter } from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || '';
const FROM_EMAIL = process.env.MAIL_FROM || `Paisa Reality <${SMTP_USER || 'noreply@paisareality.com'}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'connect@paisareality.com';
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

let transporter: Transporter | null = null;

/** One pooled SMTP connection per server process (Hostinger mail by default). */
function getTransport(): Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !SMTP_USER || !pass) throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set.');
  const port = Number.parseInt(process.env.SMTP_PORT || '465', 10);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 is implicit TLS; 587 upgrades with STARTTLS
    auth: { user: SMTP_USER, pass },
    pool: true,
    maxConnections: 2,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
  return transporter;
}

/** Plain-text alternative, so the message is not HTML-only (spam filters score that). */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/tr|\/div)[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&zwnj;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;|&rsquo;/g, "'")
    .replace(/&middot;/g, '·').replace(/&mdash;/g, '-').replace(/&#8377;/g, '₹')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

export function emailLayout(content: string, preheader = ''): string {
  // Plain, table-based layout that renders the same in Gmail, Outlook and phone mail apps.
  // Colours match the site: white card, navy ink, one navy button.
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';
  const footLink = (href: string, label: string): string =>
    `<a href="${APP_URL}${href}" style="color:#4B5563;text-decoration:underline;font-size:13px;">${label}</a>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Paisa Reality</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Inter,'Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif;color:#111827;">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="padding:0 4px 16px;">
<a href="${APP_URL}" style="text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:22px;color:#1C3A5E;">Paisa<span style="color:#A62822;">Reality</span></a>
</td></tr>
<tr><td style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:32px 32px 28px;font-size:15px;line-height:1.6;color:#111827;">${content}</td></tr>
<tr><td style="padding:20px 4px 0;text-align:left;">
<p style="margin:0 0 10px;">${footLink('/gold-rate', 'Gold rate')} &nbsp; ${footLink('/schemes', 'Schemes')} &nbsp; ${footLink('/scholarships', 'Scholarships')} &nbsp; ${footLink('/dashboard', 'Your account')}</p>
<p style="font-size:12px;color:#6B7280;margin:0;line-height:1.6;">Paisa Reality is an information service, not a financial adviser. Check figures with the official source before you act. You are receiving this because of your account or a request you made on paisareality.com.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function btn(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:#1C3A5E;border-radius:8px;"><a href="${href}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;">${label}</a></td></tr></table>`;
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] ?? c));
}

export function getAppUrl(): string { return APP_URL; }

export async function sendEmail({ to, subject, html, replyTo, headers }: { to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> }): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const info = await getTransport().sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: htmlToText(html),
      ...(replyTo ? { replyTo } : {}),
      ...(headers ? { headers } : {}),
    });
    if (info.rejected && info.rejected.length > 0) {
      return { ok: false, error: `Rejected by server: ${info.rejected.join(', ')}` };
    }
    return { ok: true, id: info.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">Welcome, ${escapeHtml(name)}!</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Your Paisa Reality account is ready. It lets the site remember things for you:</p>
    <ul style="font-size:15px;color:#374151;line-height:1.9;padding-left:20px;margin:0 0 16px;">
      <li>Price alerts: an email when gold or silver in your city reaches the price you set</li>
      <li>Saved schemes and an application tracker for everything you apply for</li>
      <li>Your Money Health Score history, so you can see it change over time</li>
    </ul>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Everything else on the site, from daily prices to the scheme, scholarship and grant finders, works with or without signing in.</p>
    ${btn(`${APP_URL}/dashboard`, 'Open your dashboard')}
    <p style="font-size:13px;color:#6b7280;margin:0;">If you did not create this account, you can safely ignore this email.</p>
  `);
  const r = await sendEmail({ to, subject: 'Welcome to Paisa Reality', html });
  return r.ok;
}

export async function sendLoginAlertEmail(to: string, name: string): Promise<boolean> {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">New login to your account</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, someone just logged into your Paisa Reality account.</p>
    <div style="background:#F7F8FA;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="font-size:14px;color:#374151;margin:0;"><strong>Time:</strong> ${now} IST</p>
    </div>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">If this was you, all good. If not, reset your password right away.</p>
    ${btn(`${APP_URL}/dashboard`, 'View Account')}
  `);
  const r = await sendEmail({ to, subject: 'New login to your Paisa Reality account', html });
  return r.ok;
}

export async function sendPasswordReset(to: string, resetToken: string): Promise<boolean> {
  const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">Reset your password</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">You asked to reset your Paisa Reality password. Click below to set a new one:</p>
    ${btn(resetLink, 'Choose a new password')}
    <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">This link is valid for 1 hour.</p>
    <p style="font-size:13px;color:#6b7280;margin:0;">Did not request this? Just ignore this email. Your password stays the same.</p>
  `);
  const r = await sendEmail({ to, subject: 'Reset your Paisa Reality password', html });
  return r.ok;
}

export async function sendContactNotification(name: string, email: string, message: string): Promise<boolean> {
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">New contact message</h2>
    <div style="background:#F7F8FA;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="font-size:14px;color:#374151;margin:0 0 8px;"><strong>From:</strong> ${escapeHtml(name)}</p>
      <p style="font-size:14px;color:#374151;margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="font-size:14px;color:#374151;margin:0;"><strong>Message:</strong></p>
      <p style="font-size:14px;color:#374151;margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>
    ${btn(`${APP_URL}/admin`, 'Open Admin')}
  `);
  const r = await sendEmail({ to: ADMIN_EMAIL, subject: `Contact: ${name}`, html, replyTo: email });
  return r.ok;
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
  const link = `${APP_URL}/api/auth/verify-email?token=${token}`;
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">Verify your email</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, one quick step. Confirm your email by clicking below:</p>
    ${btn(link, 'Verify Email')}
    <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">This link is valid for 24 hours.</p>
    <p style="font-size:13px;color:#6b7280;margin:0;">Did not create an account? You can safely ignore this.</p>
  `);
  const r = await sendEmail({ to, subject: 'Verify your Paisa Reality email', html, replyTo: 'connect@paisareality.com' });
  return r.ok;
}

export async function sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">Password changed</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, your Paisa Reality password was just changed.</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">If you did this, you are all set. If not, reset your password right now:</p>
    ${btn(`${APP_URL}/forgot-password`, 'Reset Password')}
  `);
  const r = await sendEmail({ to, subject: 'Your Paisa Reality password was changed', html, replyTo: 'connect@paisareality.com' });
  return r.ok;
}

/** One-shot price alert: the target a user set has been hit. */
export async function sendPriceAlertEmail(
  to: string,
  name: string,
  details: { commodityLabel: string; cityName: string; direction: 'below' | 'above'; targetPrice: number; currentPrice: number }
): Promise<boolean> {
  const fmt = (v: number): string => `Rs ${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const verb = details.direction === 'below' ? 'dropped to' : 'risen to';
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">Price alert: ${escapeHtml(details.commodityLabel)} in ${escapeHtml(details.cityName)}</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, the price you were watching has ${verb} your target.</p>
    <div style="background:#F7F8FA;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="font-size:14px;color:#374151;margin:0 0 8px;"><strong>Current price:</strong> ${fmt(details.currentPrice)}</p>
      <p style="font-size:14px;color:#374151;margin:0;"><strong>Your target:</strong> ${details.direction === 'below' ? 'at or below' : 'at or above'} ${fmt(details.targetPrice)}</p>
    </div>
    <p style="font-size:13px;color:#6b7280;margin:0 0 16px;">Local jeweller rates can differ slightly. Verify the day's rate before you buy or sell. This alert has now been used up; set a new one anytime from your dashboard.</p>
    ${btn(`${APP_URL}/dashboard/alerts`, 'Manage Alerts')}
  `);
  const r = await sendEmail({ to, subject: `Price alert hit: ${details.commodityLabel} in ${details.cityName}`, html });
  return r.ok;
}

/** Operational alert to the site admin (cron failures, stale data). */
export async function sendAdminAlert(subject: string, lines: string[]): Promise<boolean> {
  const items = lines.map((l) => `<li style="margin:0 0 6px;">${escapeHtml(l)}</li>`).join('');
  const html = emailLayout(`
    <h2 style="font-size:20px;line-height:1.3;color:#111827;margin:0 0 12px;font-weight:600;">${escapeHtml(subject)}</h2>
    <ul style="font-size:14px;color:#374151;line-height:1.6;padding-left:20px;margin:0 0 16px;">${items}</ul>
    <p style="font-size:13px;color:#6b7280;margin:0;">Sent automatically by the Paisa Reality price cron.</p>
  `);
  const r = await sendEmail({ to: ADMIN_EMAIL, subject: `[Paisa Reality Alert] ${subject}`, html });
  return r.ok;
}

/** List-Unsubscribe headers for newsletter mail. Gmail and Yahoo require one-click unsubscribe for bulk senders. */
export function unsubscribeHeaders(unsubscribeToken: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${APP_URL}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}>, <mailto:connect@paisareality.com?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/** Wrap HTML body with email layout + unsubscribe footer for newsletter broadcasts */
export function wrapBroadcast(bodyHtml: string, unsubscribeToken: string): string {
  const unsub = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
  return emailLayout(`${bodyHtml}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
      <a href="${unsub}" style="font-size:12px;color:#6b7280;text-decoration:underline;">Unsubscribe from this newsletter</a>
    </div>`);
}

/** Load template from DB, substitute vars, send. Falls back to null if DB fails (caller uses in-code template). */
export async function renderTemplate(key: string, vars: Record<string, string>): Promise<{ subject: string; html: string } | null> {
  try {
    const { query } = await import('@/lib/db');
    const rows = await query<{ subject: string; html_body: string }>('SELECT subject, html_body FROM email_templates WHERE key = $1 LIMIT 1', [key]);
    if (!rows[0]) return null;
    const sub = substituteVars(rows[0].subject, vars);
    let body = substituteVars(rows[0].html_body, vars);
    // Handle {{button:label:url}} syntax
    body = body.replace(/\{\{button:([^:}]+):([^}]+)\}\}/g, (_m, label, url) => btn(url, label));
    return { subject: sub, html: emailLayout(body) };
  } catch {
    return null;
  }
}

function substituteVars(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? '');
}

export default { sendEmail, sendWelcomeEmail, sendLoginAlertEmail, sendPasswordReset, sendContactNotification, sendVerificationEmail, sendPasswordChangedEmail, wrapBroadcast, getAppUrl, escapeHtml, renderTemplate };
