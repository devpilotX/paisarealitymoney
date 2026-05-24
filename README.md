# 💸 Paisa Reality — paisareality.com

> India's one-stop money hub. Daily prices, government schemes, financial calculators, and bank rate comparisons — all free.

🔗 **Live:** [paisareality.com](https://paisareality.com) · 🇮🇳 Hindi mirror at `/hi`

---

## 🧭 What it is

Free, ad-supported financial information platform for India. Four pillars:

- 📊 **Daily Prices** — gold, silver, petrol, diesel, LPG across 50+ Indian cities
- 🏛️ **Government Schemes** — profile-based matcher (form → eligible active schemes)
- 🧮 **Financial Calculators** — EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA, inflation
- 🏦 **Bank Rate Comparison** — FD, savings, home loan, personal loan rates across 50+ banks

Plus: bilingual content (English + Hindi), markdown blog, admin CMS, paid pricing tier via Razorpay, user dashboard, PDF reports for schemes & calculator outputs.

## 🧱 Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router, RSC) + React 18 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 + custom design tokens |
| Database | MySQL (`mysql2`) |
| Auth | `jsonwebtoken` (JWT) + `bcrypt` |
| Payments | **Razorpay** (Indian PG) |
| Email | **Resend** (transactional) |
| PDF | `@react-pdf/renderer` (scheme + calculator reports) |
| Content | `marked` + `sanitize-html` (markdown blog) |
| Caching | `lru-cache` (price + scheme caches) |
| SEO | Dynamic `sitemap.ts` + `robots.ts` + JSON-LD WebSite/Organization |
| Monetization | Google AdSense via `<AdBanner />` / `<InArticleAd />` |

## 🚀 Quickstart

```bash
git clone https://github.com/devpilotX/paisarealitymoney.git
cd paisarealitymoney
npm install
cp .env.example .env       # MySQL DB_*, JWT_SECRET, RAZORPAY_*, RESEND_API_KEY, SITE_URL, …
npm run db:seed-all        # cities, prices, schemes, banks
npm run dev                # http://localhost:3000
```

**Other scripts:** `npm run typecheck` (strict tsc), `npm run build && npm start`, individual seeds (`db:seed-cities`, `db:seed-prices`, `db:seed-schemes`, `db:seed-banks`).

## 🗂️ Project layout

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage (4 pillars + popular schemes + FAQ)
│   ├── layout.tsx, globals.css, error.tsx, not-found.tsx
│   ├── sitemap.ts, robots.ts     # Dynamic SEO
│   ├── gold-rate, silver-rate, petrol-price, diesel-price, lpg-price/
│   ├── schemes/                  # Listing, finder form, detail pages
│   ├── calculators/              # EMI, SIP, FD, PPF, IT, home loan, …
│   ├── bank-rates/               # FD/savings/loan comparison
│   ├── blog/                     # Markdown-authored articles
│   ├── category/, state/         # SEO landing pages
│   ├── dashboard/                # Authed user dashboard
│   ├── admin/                    # CMS
│   ├── login/, signup/, pricing/, contact/, about/
│   ├── privacy/, terms/, disclaimer/
│   ├── hi/                       # Hindi mirror
│   └── api/
│       ├── auth/, prices/, match/, payment/, admin/, scraper/, cron/
├── components/                   # AdBanner, FAQ, calculators, forms, charts
└── lib/
    ├── db.ts                     # MySQL pool
    ├── auth.ts, admin-auth.ts    # JWT + admin guard
    ├── matcher.ts                # Scheme eligibility engine
    ├── price-providers.ts        # External price source adapters
    ├── razorpay.ts, email.ts     # Razorpay + Resend wrappers
    ├── blog.ts                   # Markdown render + sanitize
    ├── cache.ts                  # LRU caches
    ├── cities.ts, constants.ts
    ├── rate-limit.ts, sanitize.ts, analytics.ts, scraper-prices.ts
scripts/                          # ts-node seeds: cities, prices, schemes, banks
```

## 🔒 Hardening

- JWT auth with bcrypt-hashed credentials + separate admin guard
- Per-IP rate limiting on auth/match/payment/scraper routes
- `sanitize-html` on all user/admin-authored markdown
- Razorpay signature verification on payment callback
- `force-dynamic` on price-sensitive pages
- Structured metadata, JSON-LD WebSite + Organization, dynamic sitemap

## 🛣️ Roadmap

- [ ] Price alerts (email + push)
- [ ] User-favourited schemes + Resend digests
- [ ] More regional mirrors (Tamil, Telugu, Marathi)
- [ ] OpenAPI public endpoints for prices

## 📜 Disclaimer

Paisa Reality is an **informational site**, not a financial advisor. Verify with official sources before acting.

---

## 👤 Author

**Dipanshu Kumar** — independent AI engineer.
📧 [connect.dipanshukumar@gmail.com](mailto:connect.dipanshukumar@gmail.com)
🌐 [paisareality.com](https://paisareality.com) · [value.codes](https://value.codes) · [algo.devpilotx.com](https://algo.devpilotx.com)
🐙 [@devpilotX](https://github.com/devpilotX)

## 📄 License

Proprietary — all rights reserved.
