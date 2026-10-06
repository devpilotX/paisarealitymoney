# Paisa Reality

Free financial information platform for India. Live daily prices, 350+ government schemes, financial calculators, advanced Smart Tools, bank rate comparisons, and a Money Health Score.

Live: https://paisareality.com

## What it does

- Daily Prices: gold, silver, petrol, diesel, and LPG across 50+ Indian cities, with per-city pages and visible "data verified as of" provenance on every price surface.
- Smart Tools: 10 advanced calculators including the Real Return Checker (XIRR-based mis-selling exposer for endowment/money-back/"double your money" pitches), retirement corpus and withdrawal optimizer, prepay vs invest, multi-loan debt optimizer, tax regime optimizer, budget optimizer, tax-loss harvesting, gold planner, scheme benefit maximizer, and salary optimizer.
- Basic Calculators: EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA, and inflation.
- Government Schemes: a profile-based finder that matches users with eligible central and state schemes, plus a detailed page for every scheme with eligibility, benefits, how to apply, and official links.
- Bank Rate Comparison: fixed deposit, savings, home loan, and personal loan rates across many banks.
- Money Health Score: a single score out of 900 across eight financial pillars, with guidance to improve it.
- Guides: plain-language comparison articles for everyday money decisions, including old vs new tax regime, SIP vs FD, PPF vs NPS, FD vs RD, and 22K vs 24K gold.
- Price Alerts: logged-in users set one-shot gold/silver targets per city; the daily cron emails them when a target is hit (15 active alerts per account; the site is free while payments are switched off).
- Interest Rates hub: quarterly small savings rates (PPF, SSY, SCSS, NSC, KVP, post office deposits), RBI policy rates, and the EPF rate with tax notes, at `/interest-rates`.
- Daily articles: every morning an n8n workflow picks a trending money topic, has Kiro research it on official sources and write it, checks every quoted fact on its source page, has Nemotron review it, publishes it at `/newsletter/<slug>` with sources and schema.org markup, pings IndexNow and reports to Telegram. See [Daily articles](#daily-articles).
- Newsletter: the article archive plus the weekly price post.
- Admin Dashboard: content and site management, served only on the admin subdomain and protected by a password plus a Google Authenticator code (TOTP).
- Data integrity: fuel/LPG baselines carry an as-of date and source, admins can override any price via `/api/admin/prices/overrides` without a deploy, and the daily cron emails the admin if data goes stale or an update fails. Methodology is public at `/methodology`, editorial standards at `/editorial-policy`.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) and React 18 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL |
| Auth | JWT and bcrypt |
| Payments | Razorpay (switched off: `NEXT_PUBLIC_PAYMENTS_ENABLED`) |
| Email | SMTP via nodemailer (Hostinger mail) |
| PDF | @react-pdf/renderer |
| Content | marked and sanitize-html |
| Caching | lru-cache |
| Ads | Google AdSense |

## Getting started

```bash
git clone https://github.com/devpilotX/paisarealitymoney.git
cd paisarealitymoney
npm install
cp .env.example .env   # fill in your own values
npm run dev            # http://localhost:3000
```

## Environment variables

Set these in `.env`. Only the variable names are listed here. Never commit real values.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_URL` | Base application URL |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used by the client |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password (login fails closed if unset) |
| `ADMIN_TOTP_SECRET` | Base32 secret for the admin's authenticator app. When set, login also needs the 6-digit code |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `true` brings back the pricing page, upgrade buttons and checkout. Unset means everything is free (build-time value) |
| `JWT_SECRET` | Secret for signing admin and auth tokens |
| `AUTH_SECRET` | Secret for user session handling |
| `CRON_SECRET` | Shared secret to protect cron endpoints |
| `SMTP_HOST`, `SMTP_PORT` | Mail server for every email the site sends (Hostinger: `smtp.hostinger.com`, `465`) |
| `SMTP_USER`, `SMTP_PASSWORD` | Mailbox login, also the sender address (`noreply@paisareality.com`) |
| `RAZORPAY_KEY_ID` | Razorpay key id. **Revenue critical:** a `rzp_test_` key collects no real money |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies Razorpay webhook calls |
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement id |
| `NEXT_PUBLIC_ADSENSE_PUB_ID` | AdSense publisher id, numeric part only. **Revenue critical:** no ad loads without it |
| `NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT` | Default ad unit id. Blank disables every `<AdBanner>` placement |
| `NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT` | In-article ad unit id. Blank disables in-article placements |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification token |

Every `NEXT_PUBLIC_*` value is inlined at **build time**, so changing one needs a
rebuild, not just a restart. See [Monetization](#monetization) before assuming ads
are running.

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Run every unit test suite (DB-free, also runs in CI) |
| `node scripts/smoke.mjs <url>` | End-to-end check of a running server: pages, accounts, CSRF, payments webhook, admin |
| `node scripts/indexnow.mjs` | Submit sitemap URLs to Bing and Yandex through IndexNow |
| `node scripts/seo-audit.mjs` | Crawl the live sitemap and report metadata problems (add `--limit N` for a sample, `--origin http://localhost:3100` to audit a local build) |
| `node scripts/link-audit.mjs` | Check every internal link on every sitemap page (same `--limit` and `--origin` flags) |
| `npm run db:migrate-pg` | Create PostgreSQL tables for the Money Health Score |
| `npm run db:migrate-price-integrity` | Add fuel/LPG provenance columns, price_overrides, and system_meta tables |
| `npm run db:migrate-alerts` | Create the price_alerts table |
| `npm run db:seed-cities` | Seed cities |
| `npm run db:seed-prices` | Seed price history |
| `npm run db:seed-schemes` | Seed the base set of government schemes |
| `npm run db:seed-schemes-expansion` | Add and refresh government schemes (additive and idempotent, safe to re-run) |
| `npm run db:seed-schemes-expansion-2` | Second additive scheme expansion batch (idempotent) |
| `npm run db:seed-banks` | Seed banks and rates (same as `db:seed-banks-expansion`) |
| `npm run db:seed-banks-expansion` | Add more banks and rates (additive) |
| `npm run db:migrate-dedupe-schemes` | Deactivate duplicate scheme slugs listed in `src/lib/scheme-redirects.json` (never deletes; the old URLs 301 to the canonical slug) |
| `npm run db:setup` | Build an empty database: every table, then cities, schemes, scholarships and banks (no synthetic prices) |
| `npm run db:seed-all` | Local development only: the same seeds plus synthetic price history |

The scheme seeds use `INSERT ... ON CONFLICT (slug)`, so they only add new schemes and refresh existing ones. They never delete data. `last_verified` comes from the dataset (`DATASET_VERIFIED_ON`, or a per-record `verified_on`), not from the day the seed runs.

`db:seed-prices` writes synthetic price history for local development. It refuses to run against a database that already has prices unless `ALLOW_SYNTHETIC_PRICES=1` is set, so never set that on production. Real prices come from the daily cron.

## Project structure

```
src/
  app/                 App Router pages and API routes
    schemes/           Scheme finder and per-scheme pages
    calculators/       Basic calculators and Smart Tools
    score/             Money Health Score
    gold-rate/, silver-rate/, petrol-price/, diesel-price/, lpg-price/
    bank-rates/        Bank rate comparison
    guides/            Plain-language money comparison guides
    newsletter/        Newsletter
    admin/             Admin dashboard (admin subdomain only)
    api/               API routes
  components/          Shared UI components
  lib/                 Business logic, database access, and engines
middleware.ts          Host based routing for the admin subdomain
scripts/               Database migrations and seeds
deploy/                Deployment configuration (Nginx)
```

## Admin

The admin dashboard is served only on the admin subdomain (`admin.paisareality.com`). On the main domain, any `/admin` request returns 404. On the admin subdomain, public files (favicon, manifest) are served and public pages redirect to the main site.

Login needs `ADMIN_EMAIL`, `ADMIN_PASSWORD` and, when `ADMIN_TOTP_SECRET` is set, the current 6-digit code from Google Authenticator (RFC 6238, 30 s, one step of clock drift allowed, a code is accepted once). If the password is not set, login fails closed. Sessions last 12 hours; a session issued before 2FA was switched on is refused.

To create or replace the authenticator secret on the server (it signs every admin out):

```bash
SECRET=$(node -e "const c=require('crypto').randomBytes(20);const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let b=0,v=0,o='';for(const x of c){v=(v<<8)|x;b+=8;while(b>=5){o+=A[(v>>>(b-5))&31];b-=5}}console.log(o)")
sudo sed -i '/^ADMIN_TOTP_SECRET=/d' /etc/paisareality/paisareality.env
echo "ADMIN_TOTP_SECRET=$SECRET" | sudo tee -a /etc/paisareality/paisareality.env >/dev/null
sudo -u paisa pm2 restart paisareality --update-env
```

Then add it in Google Authenticator: "+" > "Enter a setup key", account `admin@paisareality`, key `$SECRET`, type "Time based".

In the dashboard:

- Articles: create, edit, unpublish and delete. Editing a title keeps the URL; the URL changes only when the slug field is edited. Saving refreshes the live page, the newsletter list and the sitemap at once. Each article has an editable sources list that is shown under it and marked up as schema.org citations.
- Ads (`/ads`): image, video or HTML creatives per placement, with priority, a start and end time in your local time, live/scheduled/ended status, impressions, clicks and CTR. Placements are only the ones a page actually renders, URLs must be https, and the highest-priority live creative wins; with none, the slot falls back to AdSense.

## Daily articles

Workflow `deploy/n8n/workflows/09-daily-article.json` (built by `node deploy/n8n/build-daily-article.mjs`; CI fails if the two differ) runs at 08:30 IST:

1. Skips the day if a daily article is already out, so a manual re-run never posts twice.
2. Reads Google Trends India, three Google News searches, RBI, SEBI, PIB, the Income Tax Department, ET Wealth, Mint and Business Standard, and keeps recent money stories that are not already covered.
3. Calls the writer service (`deploy/writer`, `paisareality-writer.service` on 127.0.0.1:5690, user `kirowriter`). It runs Kiro CLI headless with the `paisa-writer` agent, which can only fetch web pages, using the best model available (`claude-opus-5.5`, falling back to `claude-opus-5` and `claude-sonnet-5.5`). The brief (`deploy/writer/brief.md`) and the `human-prose` and `deep-research` skills are in the prompt.
4. Checks the draft three ways and sends any problem back for up to two rewrites: the site's publishing rules (`src/lib/article-core.ts`), the human-prose detector at `--strict`, and a fetch of every source to confirm that each quoted fact is really on that page (HTML and PDF). Nothing is published with an unverified claim.
5. Sends the article and its evidence to `nvidia/nemotron-3-ultra-550b-a55b:free` on OpenRouter for an independent fact-check. Any serious point goes back to Kiro for one more revision, and the full checks run again.
6. Publishes through `POST /api/cron/articles` (Bearer `CRON_SECRET`), which enforces the same rules and refuses a topic covered in the last 30 days, then submits the URL to IndexNow and posts a report to Telegram. A day with no safe topic is reported to Telegram instead.

Keys live only in n8n credentials. To rotate the Kiro key every 15 days or month: n8n > Credentials > "Kiro API key" > Value, paste the new `ksk_...` key, Save. The OpenRouter key is the "OpenRouter API key" credential (value `Bearer sk-or-...`). A rejected key is reported to Telegram by name.

Install or update the writer with `sudo bash deploy/vps/setup-writer.sh` from a release directory.

## Monetization

Three independent revenue paths. Each one can be fully wired in code and still
earn nothing if its configuration is missing, so the server audits all three at
startup and prints a `[monetization]` report. Check it with
`pm2 logs paisareality --lines 50 | grep monetization` after any deploy.

**1. Google AdSense.** `<AdBanner>` sits in 110 placements across 60 pages, and
`AdSlot` prefers a house creative when one is active. Two things must be true for
an ad to appear:

- `NEXT_PUBLIC_ADSENSE_PUB_ID` set, which loads the AdSense library. Auto ads need
  nothing more than this, and are switched on in the AdSense dashboard.
- At least one of `NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT` or
  `NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT` set to an ad unit id from the dashboard,
  which is what makes the manual `<ins>` placements render. With both blank,
  `AdBanner` returns `null` everywhere.

Both slot variables were blank from launch until 2026-07-26, so the site served
zero ads for its first two months. Worse, the loader itself used to be gated on a
slot id being present, which meant the bundler eliminated the AdSense script as
dead code and Auto ads could not work either. The gate now depends on the
publisher id alone. `/ads.txt` is already correct and must stay served.

**2. Razorpay premium.** Switched off for now: with `NEXT_PUBLIC_PAYMENTS_ENABLED` unset the
site is entirely free and the audit does not warn about Razorpay. When it is turned back on, it requires live keys. A `rzp_test_` key produces a working
checkout that collects nothing, which is reported as a startup blocker.

**3. Self-hosted ad manager.** Create creatives at `/admin/ads` with a schedule and
priority; `AdSlot` serves the highest-priority active creative and falls back to
AdSense when there is none. Impressions and clicks are recorded per creative.

Configuration is audited by `src/lib/monetization.ts`, reported by
`src/instrumentation.ts`, and covered by `tests/monetization.test.ts`.

## SEO

- Dynamic `sitemap.xml` covering all public pages, including every scheme page
- `robots.txt` that allows public pages and disallows admin, dashboard, and API paths
- `/llms.txt` for language-model crawlers: a plain-text map of the site with scheme, scholarship and bank counts read from the database
- Per-page metadata: title, description, canonical, OpenGraph, and Twitter cards, all built through `pageMetadata` in `src/lib/seo.ts` so every page carries a social card
- Length-aware metadata for database-driven pages: `buildRecordTitle` and `buildRecordDescription` fit the suffix to the 60 and 155 character limits Google displays, falling back to the bare record name rather than clipping it, and only claiming "Apply Online" when the record actually has an application URL. `fitTitle` does the same for the bank and state hubs.
- Two guards run in `npm test`: `tests/seo-metadata.test.ts` pins the title ladder rung by rung, and `tests/seo-static-metadata.test.ts` walks every page and layout file and fails on any hand-written title over 60 chars or description outside 70 to 155.
- `node scripts/seo-audit.mjs` crawls every URL in the live sitemap and reports status, title and description lengths, canonical, robots, H1 count, JSON-LD, `og:image`, image alt text and word count. Run it before and after a deploy and diff the two reports to prove a change helped.
- JSON-LD: WebSite, Organization, BreadcrumbList, FAQPage, and GovernmentService for scheme pages, plus Article, FinancialProduct, Dataset, WebApplication, and HowTo built from reusable helpers in `src/lib/schema.ts`
- Visible FAQ sections with structured data on tool, calculator, scheme, and guide pages
- Thin auth pages (login, signup, password reset, unsubscribe) marked `noindex` to focus crawl budget on content pages

## Deployment

Production is an AWS EC2 instance in Mumbai (t4g.medium, Ubuntu 24.04, arm64), with
Cloudflare in front in Full (strict) SSL mode, nginx, PM2 and PostgreSQL 16 on the
same box. The server is set up once with `deploy/vps/bootstrap.sh` and
`deploy/vps/setup-app.sh`.

| What | Where |
|------|-------|
| Releases, one directory per commit | `/opt/paisareality/releases/<sha>/` |
| Live release (PM2 runs from here) | `/opt/paisareality/current` symlink |
| Settings and secrets (linked in as `.env`) | `/etc/paisareality/paisareality.env`, root:paisa 0640 |
| nginx | `deploy/nginx/`, installed to `/etc/nginx/` |
| TLS | Let's Encrypt for all three hostnames, renewed by `certbot.timer` |
| Price updates | `paisareality-prices.timer`, 06:15, 09:15, 12:15, 15:15, 18:15 IST; log in `/var/log/paisareality/cron.log` |
| Backups | every 6 hours, encrypted, to Google Drive and Telegram (see below) |

To ship a commit from your PC:

```powershell
$sha = git rev-parse --short HEAD
git -c core.autocrlf=false archive --format=tar.gz -o "paisareality-$sha.tgz" HEAD
scp -i C:\infra\vps\keys\paisareality.pem "paisareality-$sha.tgz" ubuntu@<server>:/tmp/
ssh -i C:\infra\vps\keys\paisareality.pem ubuntu@<server>
# on the server:
tar -xzf /tmp/paisareality-<sha>.tgz -C /tmp/src deploy/vps/release.sh
sudo install -o paisa /tmp/paisareality-<sha>.tgz /opt/paisareality/
sudo -u paisa bash /tmp/src/deploy/vps/release.sh /opt/paisareality/paisareality-<sha>.tgz <sha>
```

`release.sh` installs dependencies and builds inside the new release directory while
the old one keeps serving. It then flips the symlink, restarts PM2 and checks health.
If the new release does not answer within 60 seconds, it switches back by itself.
Downtime is the restart, about two seconds. To roll back by hand, point `current` at
an older directory in `releases/` and run `pm2 restart paisareality`.

After a deploy, run `node scripts/smoke.mjs https://paisareality.com --admin-host admin.paisareality.com`
(with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set) and `node scripts/indexnow.mjs` to tell
Bing about changed pages.

An empty database is built with `npm run db:setup`, run from the release directory
as the `paisa` user. It creates every table and loads cities, schemes, scholarships
and banks. Real prices arrive with the first run of the price timer. Scheme and
scholarship pages are statically generated, so a `meta_title` change in the database
shows up after the next deploy.

See Backups and disaster recovery below.
## Backups and disaster recovery

Everything needed to carry on from a brand-new VPS goes into one encrypted file:
the site database (users, articles, schemes, prices, alerts, ads, email templates),
n8n's database (workflows and credentials), PostgreSQL roles, `/etc/paisareality`,
`/etc/n8n` with the n8n encryption key, the Let's Encrypt certificates, and the exact
source of the live release. It is AES-256 encrypted with the passphrase in
`/etc/paisareality/backup.key`, which is pinned in the Telegram bot chat and is not
inside the backups.

| What | When | Where it goes |
|------|------|---------------|
| Full backup (`deploy/vps/backup.sh`) | 02:30, 08:30, 14:30, 20:30 IST, and on `/backup` in Telegram | Google Drive folder "Paisa Reality Backups" (30 days kept), last 14 on the server; the 02:30 and manual ones also go to Telegram |
| Restore drill (`deploy/vps/restore-drill.sh`) | Sundays 04:00 | Restores the newest backup into throwaway databases, compares row counts, reports to Telegram |
| Watchdog (`deploy/vps/watchdog.sh`) | every 5 minutes | Telegram, when site, n8n, disk, memory or backup age goes wrong, and when it recovers |

If n8n is down when a backup finishes, the server sends the file to Telegram itself.

To rebuild on a new server, point the DNS records at it, copy the newest backup file
over, and follow the three lines at the top of `deploy/vps/restore.sh`. It installs
everything, restores both databases and the settings, rebuilds the release and starts n8n.

## n8n

`https://n8n.paisareality.com`, set up by `deploy/vps/setup-n8n.sh`. It runs in Docker
on 127.0.0.1:5678 with its data in the local PostgreSQL. Workflows live in
`deploy/n8n/workflows/` and are imported only if missing, so edits made in the editor
are kept.

| Workflow | Does |
|----------|------|
| Alerts: workflow failure to Telegram | error workflow for all the others |
| Backup: upload to Google Drive and Telegram | receives each backup from the server, uploads it, prunes Drive after 30 days |
| Monitor: website uptime every 5 minutes | alerts after two failed checks in a row, hourly while down, and on recovery |
| Bot: daily report and Telegram commands | report at 09:00; `/status`, `/backup`, `/help` from the owner's chat only |
| Alerts: new contact messages and sign-ups | every 10 minutes |
| SEO: submit today's changed pages to IndexNow | 07:05 daily |
| Content: daily verified article | 08:30 daily, see [Daily articles](#daily-articles) |
## Disclaimer

Paisa Reality is an informational website, not a financial advisor. Verify details with official sources before making any financial decision.

## License

Proprietary. All rights reserved.
