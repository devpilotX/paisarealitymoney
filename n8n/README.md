# Paisa Reality automation workflows for n8n

Importable n8n workflows that automate the recurring jobs for Paisa Reality:
the daily price and alert run, uptime monitoring, the weekly newsletter,
scholarship deadline digests, new-message alerts, and a stale-data watchdog.

Every workflow is a self-contained JSON file. Import each one, attach the
credentials, set the environment variables, then activate.

## Files

| File | What it does | Trigger |
|------|--------------|---------|
| `01-daily-prices-cron.json` | Calls `/api/cron/prices`, which updates prices and sends price alerts, scholarship reminders, and stale-data admin alerts. | Daily |
| `02-uptime-monitor.json` | Fetches the homepage and emails the admin if it is not HTTP 200. | Every 15 minutes |
| `03-weekly-newsletter.json` | Builds a digest of the latest posts and prices and emails all subscribers via Resend. | Weekly (Mon) |
| `04-scholarship-deadline-digest.json` | Emails the admin a list of scholarships closing within 14 days. | Weekly (Mon) |
| `05-new-contact-message-alert.json` | Polls for new contact messages and emails the admin. | Every 10 minutes |
| `06-stale-data-watchdog.json` | Checks the latest gold price date and alerts the admin if data is stale. | Daily |

## How to import

1. In n8n, open **Workflows → Import from File** (top-right menu).
2. Select one JSON file from this folder. The workflow opens on the canvas.
3. Open each red-badged node and pick the matching credential (see below).
4. Set the environment variables (see below), then toggle the workflow **Active**.
5. Repeat for each file.

## Credentials to create in n8n (once)

- **Postgres** (name it `Paisa Reality Postgres`): host, port `5432`, database, user,
  password, and SSL as your provider requires. Used by workflows 03, 04, 05, 06.
- **Header Auth for Resend** (name it `Resend API`): set header **Name** = `Authorization`,
  **Value** = `Bearer YOUR_RESEND_API_KEY`. Used by the HTTP Request nodes that send email
  in workflows 02, 03, 04, 05, 06.

The workflows reference credentials by name, so creating them with the names above
lets the imported nodes bind automatically. If a node shows "no credential", just
select the one you created.

## Environment variables to set on the n8n instance

Set these under **Settings → Variables** (n8n Cloud) or as process env vars
(self-hosted), so the workflows do not hardcode secrets:

| Variable | Example | Used by |
|----------|---------|---------|
| `APP_URL` | `https://paisareality.com` | 01, 02 |
| `CRON_SECRET` | same value as the site's `CRON_SECRET` | 01 |
| `ADMIN_EMAIL` | `connect@paisareality.com` | 02, 04, 05, 06 |
| `FROM_EMAIL` | `updates@paisareality.com` (a verified Resend sender) | 02, 03, 04, 05, 06 |

Self-hosted n8n must allow expression access to env vars (do not set
`N8N_BLOCK_ENV_ACCESS_IN_NODE=true`). Otherwise replace `{{ $env.X }}` in the nodes
with the literal values.

## Timezone

Schedules use cron expressions in the n8n instance timezone. Set the instance to
`Asia/Kolkata` (Settings, or `GENERIC_TIMEZONE=Asia/Kolkata`) so the times below are IST.
If your instance runs in UTC, the provided expressions are chosen to land at a sensible
IST time (about 07:30 IST for the daily jobs). Adjust the minute/hour fields to taste.

## Notes

- The site endpoints are resilient: the daily cron is safe to run repeatedly and never
  double-sends an alert (it marks each as sent).
- Nothing here writes to the database except through the site's own APIs; the Postgres
  nodes only run read-only SELECTs, except none perform writes.
- These are safe to run alongside any existing system cron; if you switch fully to n8n,
  you can remove the server crontab entry for the price update.
