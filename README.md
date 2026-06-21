# Paisa Reality — paisareality.com

Free financial information platform for India. Daily prices, government schemes, financial calculators, Smart Tools, bank rate comparisons, and a Money Health Score.

**Live:** [paisareality.com](https://paisareality.com)

---

## What it does

- **Daily Prices** — Gold, silver, petrol, diesel, LPG across 50+ Indian cities. Updated every day.
- **Smart Tools** — 9 advanced financial calculators (retirement optimizer, prepay vs invest, debt optimizer, tax regime optimizer, budget optimizer, tax harvesting, gold planner, scheme maximizer, salary optimizer). Run Monte Carlo simulation and optimization in the browser.
- **Basic Calculators** — EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA, inflation.
- **Government Schemes** — Profile-based matcher. Fill a form, get matched with eligible central and state schemes.
- **Bank Rate Comparison** — FD, savings, home loan, personal loan rates across 50+ banks.
- **Money Health Score** — One number out of 900 across 8 financial pillars. Like a CIBIL score for your whole financial life.
- **Admin Dashboard** — Blog management, price controls, site actions. Protected with JWT auth.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) + React 18 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL (all data: prices, schemes, banks, users, health score) |
| Auth | JWT + bcrypt |
| Payments | Razorpay |
| Email | Resend |
| PDF | @react-pdf/renderer |
| Content | marked + sanitize-html (blog) |
| Caching | lru-cache |
| Ads | Google AdSense |

## Getting started

```bash
git clone https://github.com/devpilotX/paisarealitymoney.git
cd paisarealitymoney
npm install
cp .env.example .env    # fill in your DB credentials, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev             # http://localhost:3000
```

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript strict check |
| `npm run db:seed-all` | Seed PostgreSQL (cities, prices, schemes, banks) |
| `npm run db:migrate-pg` | Create PostgreSQL tables for Health Score |

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage
│   ├── smart-tools/              # Smart Tools hub
│   ├── score/                    # Money Health Score
│   ├── calculators/              # Basic + Smart Tool pages
│   ├── gold-rate/, silver-rate/, petrol-price/, diesel-price/, lpg-price/
│   ├── schemes/                  # Scheme finder
│   ├── bank-rates/               # Rate comparison
│   ├── blog/                     # Markdown blog
│   ├── admin/                    # Admin dashboard
│   ├── about/, contact/, terms/, privacy/, disclaimer/
│   └── api/                      # API routes
├── components/                   # Shared UI components
├── lib/                          # Business logic, DB, engines
middleware.ts                     # Subdomain routing (admin.paisareality.com)
scripts/                          # DB seeds and migrations
```

## Admin dashboard

Access at `/admin` (or `admin.paisareality.com` when DNS is configured).

Set in `.env`:
```
ADMIN_EMAIL=admin@paisareality.com
ADMIN_PASSWORD=your-password
JWT_SECRET=your-secret
```

Features: blog CRUD, price refresh trigger, site overview stats.

## SEO

- Dynamic sitemap.xml (all pages, auto-updates)
- robots.txt
- Per-page metadata (title, description, canonical, OG, Twitter cards)
- JSON-LD (WebSite, Organization, FAQPage, BreadcrumbList)
- FAQ sections with structured data on all tool and calculator pages

## Disclaimer

Paisa Reality is an informational website, not a financial advisor. Verify with official sources before making financial decisions.

## Author

Dipanshu Kumar — [paisareality.com](https://paisareality.com) — [github.com/devpilotX](https://github.com/devpilotX)

## License

Proprietary. All rights reserved.
