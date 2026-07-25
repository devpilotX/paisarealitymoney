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
- Price Alerts: logged-in users set one-shot gold/silver targets per city; the daily cron emails them when a target is hit (free plan 3 active alerts, premium 15).
- Interest Rates hub: quarterly small savings rates (PPF, SSY, SCSS, NSC, KVP, post office deposits), RBI policy rates, and the EPF rate with tax notes, at `/interest-rates`.
- Newsletter: simple personal finance articles and price updates.
- Admin Dashboard: content and site management, served only on the admin subdomain and protected by JWT auth.
- Data integrity: fuel/LPG baselines carry an as-of date and source, admins can override any price via `/api/admin/prices/overrides` without a deploy, and the daily cron emails the admin if data goes stale or an update fails. Methodology is public at `/methodology`, editorial standards at `/editorial-policy`.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) and React 18 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL |
| Auth | JWT and bcrypt |
| Payments | Razorpay |
| Email | Resend |
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
| `JWT_SECRET` | Secret for signing admin and auth tokens |
| `AUTH_SECRET` | Secret for user session handling |
| `CRON_SECRET` | Shared secret to protect cron endpoints |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `RESEND_WEBHOOK_SECRET` | Verifies Resend webhook calls |
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
| `node scripts/seo-audit.mjs` | Crawl the live sitemap and report metadata problems (add `--limit N` for a sample) |
| `npm run db:migrate-pg` | Create PostgreSQL tables for the Money Health Score |
| `npm run db:migrate-price-integrity` | Add fuel/LPG provenance columns, price_overrides, and system_meta tables |
| `npm run db:migrate-alerts` | Create the price_alerts table |
| `npm run db:seed-cities` | Seed cities |
| `npm run db:seed-prices` | Seed price history |
| `npm run db:seed-schemes` | Seed the base set of government schemes |
| `npm run db:seed-schemes-expansion` | Add and refresh government schemes (additive and idempotent, safe to re-run) |
| `npm run db:seed-schemes-expansion-2` | Second additive scheme expansion batch (idempotent) |
| `npm run db:seed-banks` | Seed banks and rates |
| `npm run db:seed-banks-expansion` | Add more banks and rates (additive) |
| `npm run db:seed-all` | Run the cities, prices, schemes, and banks seeds in sequence |

The scheme seed uses `INSERT ... ON CONFLICT (slug) DO UPDATE`, so it only adds new schemes and refreshes existing ones. It never deletes data.

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

The admin dashboard is served only on the admin subdomain (`admin.paisareality.com`). On the main domain, any `/admin` request returns 404. Admin authentication reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment; if the password is not set, login fails closed.

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

**2. Razorpay premium.** Requires live keys. A `rzp_test_` key produces a working
checkout that collects nothing, which is reported as a startup blocker.

**3. Self-hosted ad manager.** Create creatives at `/admin/ads` with a schedule and
priority; `AdSlot` serves the highest-priority active creative and falls back to
AdSense when there is none. Impressions and clicks are recorded per creative.

Configuration is audited by `src/lib/monetization.ts`, reported by
`src/instrumentation.ts`, and covered by `tests/monetization.test.ts`.

## SEO

- Dynamic `sitemap.xml` covering all public pages, including every scheme page
- `robots.txt` that allows public pages and disallows admin, dashboard, and API paths
- Per-page metadata: title, description, canonical, OpenGraph, and Twitter cards, all built through `pageMetadata` in `src/lib/seo.ts` so every page carries a social card
- Length-aware metadata for database-driven pages: `buildRecordTitle` and `buildRecordDescription` fit the suffix to the 60 and 155 character limits Google displays, falling back to the bare record name rather than clipping it, and only claiming "Apply Online" when the record actually has an application URL. `fitTitle` does the same for the bank and state hubs.
- Two guards run in `npm test`: `tests/seo-metadata.test.ts` pins the title ladder rung by rung, and `tests/seo-static-metadata.test.ts` walks every page and layout file and fails on any hand-written title over 60 chars or description outside 70 to 155.
- `node scripts/seo-audit.mjs` crawls every URL in the live sitemap and reports status, title and description lengths, canonical, robots, H1 count, JSON-LD, `og:image`, image alt text and word count. Run it before and after a deploy and diff the two reports to prove a change helped.
- JSON-LD: WebSite, Organization, BreadcrumbList, FAQPage, and GovernmentService for scheme pages, plus Article, FinancialProduct, Dataset, WebApplication, and HowTo built from reusable helpers in `src/lib/schema.ts`
- Visible FAQ sections with structured data on tool, calculator, scheme, and guide pages
- Thin auth pages (login, signup, password reset, unsubscribe) marked `noindex` to focus crawl budget on content pages

## Deployment

Production runs the app with PM2 behind Nginx, with Cloudflare in front.

Build in the standing worktree at `/opt/paisareality-build` rather than in the live
directory, so the running site never serves a half-written `.next`. The live
directory holds the `main` branch, so the build worktree checks the commit out
detached.

```bash
# 1. build the release, off the critical path (shared 4-core box)
cd /opt/paisareality-build
git fetch origin && git checkout --detach <sha>
nohup sh -c 'NODE_OPTIONS=--max-old-space-size=4096 nice -n 19 ionice -c3 \
  npm run build > build.log 2>&1; echo EXIT=$? >> build.log' &
# poll build.log for EXIT=0. Roughly 100 s, and it emits every page from the live DB.

# 2. the build records its own absolute path in two files, so rewrite them
sed -i 's#/opt/paisareality-build#/opt/paisareality#g' \
  .next/required-server-files.js .next/required-server-files.json
grep -rl /opt/paisareality-build .next   # must return nothing

# 3. record a rollback point, update the source, swap the build in
cd /opt/paisareality
git rev-parse HEAD > /tmp/paisa_rollback_$(date +%s).txt
git pull --ff-only origin main
mv .next .next.prev-$(date +%s)
mv /opt/paisareality-build/.next .next

# 4. restart, then verify
pm2 restart paisareality --update-env && pm2 save
pm2 logs paisareality --lines 50 | grep monetization
```

Downtime is the restart only, a few seconds. To roll back, move a `.next.prev-*`
directory back into place and restart; no rebuild needed.

Run database migrations or the additive seeds only when a release needs them.
Scheme and scholarship pages are statically generated, so changing a `meta_title`
in the database requires a reseed **and** a rebuild before it shows up. Nginx config
for the main domain and the admin subdomain lives in `deploy/nginx/`.

## Disclaimer

Paisa Reality is an informational website, not a financial advisor. Verify details with official sources before making any financial decision.

## License

Proprietary. All rights reserved.
