-- Migration 005: Email templates
-- Run with: psql "$DATABASE_URL" -f scripts/migrations/005_email_templates.sql
-- Idempotent: re-running refreshes existing rows.

CREATE TABLE IF NOT EXISTS email_templates (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key        text   NOT NULL,
    name       text   NOT NULL,
    subject    text   NOT NULL,
    html_body  text   NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT email_templates_key_unique UNIQUE (key)
);

INSERT INTO email_templates (key, name, subject, html_body) VALUES
('welcome', 'Welcome Email', 'Welcome to Paisa Reality', '<h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Welcome, {{name}}!</h2><p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Your Paisa Reality account is set up. Here is what you can use right away:</p><ul style="font-size:15px;color:#374151;line-height:2;padding-left:20px;margin:0 0 16px;"><li>Daily gold, silver, petrol, diesel, and LPG prices for 50+ cities</li><li>9 Smart Tools that run Monte Carlo simulations in your browser</li><li>11 financial calculators (EMI, SIP, FD, tax, and more)</li><li>Government scheme finder matched to your profile</li><li>Bank rate comparison across 50+ banks</li><li>Money Health Score out of 900</li></ul>{{button:Go to Dashboard:{{dashboard_url}}}}<p style="font-size:13px;color:#6b7280;margin:0;">If you did not create this account, you can safely ignore this email.</p>'),
('verification', 'Email Verification', 'Verify your Paisa Reality email', '<h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Verify your email</h2><p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey {{name}}, one quick step. Confirm your email by clicking below:</p>{{button:Verify Email:{{verify_url}}}}<p style="font-size:13px;color:#6b7280;margin:0 0 8px;">This link is valid for 24 hours.</p><p style="font-size:13px;color:#6b7280;margin:0;">Did not create an account? You can safely ignore this.</p>'),
('password_reset', 'Password Reset', 'Reset Your Paisa Reality Password', '<h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Reset your password</h2><p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">You asked to reset your Paisa Reality password. Click below to set a new one:</p>{{button:Reset Password:{{reset_url}}}}<p style="font-size:13px;color:#6b7280;margin:0 0 8px;">This link is valid for 1 hour.</p><p style="font-size:13px;color:#6b7280;margin:0;">Did not request this? Just ignore this email. Your password stays the same.</p>'),
('password_changed', 'Password Changed', 'Your Paisa Reality password was changed', '<h2 style="font-size:20px;color:#111827;margin:0 0 12px;">Password changed</h2><p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Hey {{name}}, your Paisa Reality password was just changed.</p><p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">If you did this, you are all set. If not, reset your password right now:</p>{{button:Reset Password:{{reset_page_url}}}}'),
('contact_notification', 'Contact Notification', 'Contact: {{sender_name}}', '<h2 style="font-size:20px;color:#111827;margin:0 0 12px;">New contact message</h2><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:0 0 16px;"><p style="font-size:14px;color:#374151;margin:0 0 8px;"><strong>From:</strong> {{sender_name}}</p><p style="font-size:14px;color:#374151;margin:0 0 8px;"><strong>Email:</strong> {{sender_email}}</p><p style="font-size:14px;color:#374151;margin:0;"><strong>Message:</strong></p><p style="font-size:14px;color:#374151;margin:8px 0 0;white-space:pre-wrap;">{{message}}</p></div>{{button:Open Admin:{{admin_url}}}}'),
('newsletter_confirmation', 'Newsletter Confirmation', 'Subscribed to Paisa Reality', '<h2 style="color:#007A78;">You are subscribed!</h2><p>Thanks for subscribing to the Paisa Reality newsletter. You will get updates on prices, new tools, and practical financial tips.</p><p style="font-size:12px;color:#6b7280;margin-top:24px;"><a href="{{unsubscribe_url}}">Unsubscribe</a></p>')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  updated_at = now();
