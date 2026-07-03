import { Resend } from 'resend';

const FROM_EMAIL = 'Paisa Reality <noreply@paisareality.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'connect@paisareality.com';
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');
  return new Resend(apiKey);
}

function emailLayout(content: string, preheader = ''): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';
  const footLink = (href: string, label: string): string =>
    `<a href="${APP_URL}${href}" style="color:#007A78;text-decoration:none;font-size:12px;font-weight:600;">${label}</a>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Inter,system-ui,-apple-system,sans-serif;">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
<tr><td style="background:linear-gradient(135deg,#007A78 0%,#005a58 100%);background-color:#007A78;padding:26px 28px;text-align:center;">
<span style="display:inline-block;background:#ffffff;color:#007A78;font-size:15px;font-weight:800;border-radius:8px;padding:5px 10px;letter-spacing:0.3px;">&#8377;</span>
<h1 style="color:#ffffff;font-size:23px;margin:10px 0 0;font-weight:800;letter-spacing:-0.3px;">Paisa Reality</h1>
<p style="color:#b8e5e3;font-size:12.5px;margin:6px 0 0;letter-spacing:0.4px;">INDIA&rsquo;S ONE-STOP MONEY HUB</p>
</td></tr>
<tr><td style="padding:32px 28px;">${content}</td></tr>
<tr><td style="background:#f9fafb;padding:20px 28px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0 0 10px;">
${footLink('/gold-rate', 'Gold Rate')} &nbsp;&middot;&nbsp; ${footLink('/interest-rates', 'Interest Rates')} &nbsp;&middot;&nbsp; ${footLink('/calculators', 'Calculators')} &nbsp;&middot;&nbsp; ${footLink('/schemes', 'Schemes')} &nbsp;&middot;&nbsp; ${footLink('/score', 'Health Score')}
</p>
<p style="font-size:12px;color:#6b7280;margin:0;">Paisa Reality &middot; <a href="${APP_URL}" style="color:#6b7280;">paisareality.com</a></p>
<p style="font-size:11px;color:#9ca3af;margin:6px 0 0;line-height:1.5;">Free financial information for India. Not investment advice &mdash; verify with official sources before acting.<br>You received this email because of your account or activity on our website.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function btn(href: string, label: string): string {
  return `<div style="text-align:center;padding:24px 0;"><a href="${href}" style="background:#007A78;color:#ffffff;padding:12px 32px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${label}</a></div>`;
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] ?? c));
}

export function getAppUrl(): string { return APP_URL; }

export async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const resend = getResendClient();
    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });
    if (res.error) { console.error('Email error:', res.error); return { ok: false, error: res.error.message }; }
    return { ok: true, id: res.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const html = emailLayout(`
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Welcome, ${escapeHtml(name)}!</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Your Paisa Reality account is set up. Here is what you can use right away:</p>
    <ul style="font-size:15px;color:#374151;line-height:2;padding-left:20px;margin:0 0 16px;">
      <li>Daily gold, silver, petrol, diesel, and LPG prices for 50+ cities</li>
      <li>10 Smart Tools that run Monte Carlo simulations in your browser</li>
      <li>11 financial calculators (EMI, SIP, FD, tax, and more)</li>
      <li>Government scheme finder matched to your profile</li>
      <li>Bank rate comparison across 50+ banks</li>
      <li>Free price alerts: an email when gold or silver hits your target</li>
      <li>Money Health Score out of 900</li>
    </ul>
    ${btn(`${APP_URL}/dashboard`, 'Go to Dashboard')}
    <p style="font-size:13px;color:#6b7280;margin:0;">If you did not create this account, you can safely ignore this email.</p>
  `);
  const r = await sendEmail({ to, subject: 'Welcome to Paisa Reality', html });
  return r.ok;
}

export async function sendLoginAlertEmail(to: string, name: string): Promise<boolean> {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = emailLayout(`
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">New login to your account</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, someone just logged into your Paisa Reality account.</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:0 0 16px;">
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
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Reset your password</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">You asked to reset your Paisa Reality password. Click below to set a new one:</p>
    ${btn(resetLink, 'Reset Password')}
    <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">This link is valid for 1 hour.</p>
    <p style="font-size:13px;color:#6b7280;margin:0;">Did not request this? Just ignore this email. Your password stays the same.</p>
  `);
  const r = await sendEmail({ to, subject: 'Reset Your Paisa Reality Password', html });
  return r.ok;
}

export async function sendContactNotification(name: string, email: string, message: string): Promise<boolean> {
  const html = emailLayout(`
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">New contact message</h2>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:0 0 16px;">
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
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Verify your email</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, one quick step. Confirm your email by clicking below:</p>
    ${btn(link, 'Verify Email')}
    <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">This link is valid for 24 hours.</p>
    <p style="font-size:13px;color:#6b7280;margin:0;">Did not create an account? You can safely ignore this.</p>
  `);
  const r = await sendEmail({ to, subject: 'Verify your Paisa Reality email', html, replyTo: 'support@paisareality.com' });
  return r.ok;
}

export async function sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
  const html = emailLayout(`
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Password changed</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, your Paisa Reality password was just changed.</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">If you did this, you are all set. If not, reset your password right now:</p>
    ${btn(`${APP_URL}/forgot-password`, 'Reset Password')}
  `);
  const r = await sendEmail({ to, subject: 'Your Paisa Reality password was changed', html, replyTo: 'support@paisareality.com' });
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
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Price alert: ${escapeHtml(details.commodityLabel)} in ${escapeHtml(details.cityName)}</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey ${escapeHtml(name)}, the price you were watching has ${verb} your target.</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:0 0 16px;">
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
    <h2 style="font-size:20px;color:#111827;margin:0 0 12px;">${escapeHtml(subject)}</h2>
    <ul style="font-size:14px;color:#374151;line-height:1.6;padding-left:20px;margin:0 0 16px;">${items}</ul>
    <p style="font-size:13px;color:#6b7280;margin:0;">Sent automatically by the Paisa Reality price cron.</p>
  `);
  const r = await sendEmail({ to: ADMIN_EMAIL, subject: `[Paisa Reality Alert] ${subject}`, html });
  return r.ok;
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
