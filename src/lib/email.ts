import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured in environment variables.');
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = 'Paisa Reality <noreply@paisareality.com>';

async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (response.error) {
      console.error('Email send error:', response.error);
      return {
        success: false,
        error: response.error.message || 'Failed to send email.',
      };
    }

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    console.error(`Email send failed: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  const subject = 'Welcome to Paisa Reality';
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #007A78;">
        <h1 style="color: #007A78; font-size: 24px; margin: 0;">Paisa Reality</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2 style="font-size: 20px;">Welcome, ${escapeHtml(name)}!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Thank you for creating your account on Paisa Reality. You now have access to:</p>
        <ul style="font-size: 16px; line-height: 1.8;">
          <li>Daily gold, silver, petrol, and diesel prices for your city</li>
          <li>Government scheme finder to check your eligibility for 1,000+ schemes</li>
          <li>Financial calculators for EMI, SIP, FD, tax, and more</li>
          <li>Bank rate comparison across 50+ Indian banks</li>
        </ul>
        <p style="font-size: 16px; line-height: 1.6;">All information is sourced from official government websites and updated daily.</p>
        <div style="text-align: center; padding: 20px 0;">
          <a href="https://paisareality.com/schemes" style="background-color: #007A78; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">Find Government Schemes</a>
        </div>
      </div>
      <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; font-size: 14px; color: #666;">
        <p>This email was sent by Paisa Reality. If you did not create this account, please ignore this email.</p>
        <p>Paisa Reality - India's one-stop money hub</p>
      </div>
    </body>
    </html>
  `;
  const text = `Welcome to Paisa Reality, ${name}! You now have access to daily prices, government scheme finder, financial calculators, and bank rate comparisons. Visit https://paisareality.com to get started.`;
  return sendEmail({ to, subject, html, text });
}

export async function sendSchemeAlert(
  to: string,
  name: string,
  schemes: Array<{ name: string; slug: string; benefit: string }>
): Promise<EmailResult> {
  const subject = `${schemes.length} New Government Schemes Match Your Profile`;
  const schemeListHtml = schemes
    .map(
      (scheme) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
          <a href="https://paisareality.com/schemes/${escapeHtml(scheme.slug)}" style="color: #007A78; text-decoration: none; font-weight: 600;">${escapeHtml(scheme.name)}</a>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">${escapeHtml(scheme.benefit)}</p>
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #007A78;">
        <h1 style="color: #007A78; font-size: 24px; margin: 0;">Paisa Reality</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2 style="font-size: 20px;">Hello ${escapeHtml(name)},</h2>
        <p style="font-size: 16px; line-height: 1.6;">We found ${schemes.length} government scheme${schemes.length > 1 ? 's' : ''} that match your profile:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          ${schemeListHtml}
        </table>
        <div style="text-align: center; padding: 20px 0;">
          <a href="https://paisareality.com/schemes" style="background-color: #007A78; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">View All Matching Schemes</a>
        </div>
      </div>
      <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; font-size: 14px; color: #666;">
        <p>You are receiving this because you enabled scheme alerts on Paisa Reality.</p>
        <p><a href="https://paisareality.com/dashboard" style="color: #007A78;">Manage your alert preferences</a></p>
      </div>
    </body>
    </html>
  `;
  const text = `Hello ${name}, we found ${schemes.length} government schemes matching your profile. Visit https://paisareality.com/schemes to see details.`;
  return sendEmail({ to, subject, html, text });
}

export async function sendPasswordReset(to: string, resetToken: string): Promise<EmailResult> {
  const subject = 'Reset Your Paisa Reality Password';
  const resetLink = `https://paisareality.com/reset-password?token=${resetToken}`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #007A78;">
        <h1 style="color: #007A78; font-size: 24px; margin: 0;">Paisa Reality</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2 style="font-size: 20px;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; padding: 20px 0;">
          <a href="${resetLink}" style="background-color: #007A78; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; font-size: 14px; color: #666;">
        <p>Paisa Reality - India's one-stop money hub</p>
      </div>
    </body>
    </html>
  `;
  const text = `You requested a password reset for your Paisa Reality account. Visit this link to reset your password: ${resetLink}. This link expires in 1 hour.`;
  return sendEmail({ to, subject, html, text });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

export default {
  sendWelcomeEmail,
  sendSchemeAlert,
  sendPasswordReset,
};