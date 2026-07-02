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
| `RAZORPAY_KEY_ID` | Razorpay key id |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies Razorpay webhook calls |
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement id |
| `NEXT_PUBLIC_ADSENSE_PUB_ID` | Google AdSense publisher id |
| `NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT` | Default AdSense slot id |
| `NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT` | In-article AdSense slot id |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification token |

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Run every unit test suite (DB-free, also runs in CI) |
| `npm run db:migrate-pg` | Create PostgreSQL tables for the Money Health Score |
| `npm run db:migrate-price-integrity` | Add fuel/LPG provenance columns, price_overrides, and system_meta tables |
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

## SEO

- Dynamic `sitemap.xml` covering all public pages, including every scheme page
- `robots.txt` that allows public pages and disallows admin, dashboard, and API paths
- Per-page metadata: title, description, canonical, OpenGraph, and Twitter cards
- JSON-LD: WebSite, Organization, BreadcrumbList, FAQPage, and GovernmentService for scheme pages, plus Article, FinancialProduct, Dataset, WebApplication, and HowTo built from reusable helpers in `src/lib/schema.ts`
- Visible FAQ sections with structured data on tool, calculator, scheme, and guide pages
- Thin auth pages (login, signup, password reset, unsubscribe) marked `noindex` to focus crawl budget on content pages

## Deployment

Production runs the app with PM2 behind Nginx, with Cloudflare in front.

1. On the server, pull the latest code: `git pull origin main`
2. Install dependencies: `npm install`
3. Run database migrations or the additive scheme seed only when needed. The price-integrity release requires a one-time `npm run db:migrate-price-integrity` before restart.
4. Build: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`
5. Restart the process: `pm2 restart paisareality --update-env && pm2 save`
6. Nginx config for the main domain and the admin subdomain lives in `deploy/nginx/`

## Disclaimer

Paisa Reality is an informational website, not a financial advisor. Verify details with official sources before making any financial decision.

## License

Proprietary. All rights reserved.
