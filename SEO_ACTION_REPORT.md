# Paisa Reality — SEO Action Report

_Date: 30 June 2026_

## What I changed in the code (live in your repo)

Your site already had a strong SEO base (per-page metadata, sitemap covering city/state/scheme/blog/bank pages, robots, FAQ + breadcrumb schema, OG images). I built on top of it rather than rebuilding.

**1. New reusable structured-data library — `src/lib/schema.ts`**
Truthful JSON-LD builders you can drop into any page: `calculatorSchema`, `howToSchema`, `faqSchema`, `breadcrumbSchema`, `articleSchema`, `financialProductSchema`, `datasetSchema`. These power Google rich results (How-to steps, FAQ accordions, app cards, breadcrumb trails).

**2. Richer sitewide schema — `src/app/layout.tsx`**
Enriched the Organization and WebSite JSON-LD with description, `areaServed: India`, `knowsLanguage: [en-IN, hi-IN]`, publisher, and alternate name. Helps Google build your Knowledge Panel and brand entity.

**3. Income Tax calculator refreshed for the current year — `calculators/income-tax`**
Title/description now target **FY 2026-27 (AY 2027-28)** plus FY 2025-26 — year-freshness is one of the biggest CTR levers for Indian tax queries. Added WebApplication + HowTo schema.

**4. SIP and EMI calculators upgraded** — stronger titles, expanded keywords, and WebApplication + HowTo schema (top-traffic tools, now eligible for How-to rich results).

**5. Thin pages set to noindex** — added `noindex` layouts for `login`, `signup`, `forgot-password`, `reset-password`, `unsubscribe`. Keeps low-value pages out of the index and focuses crawl budget on money pages.

**6. Hindi hreflang** — homepage now declares reciprocal `hi-IN` → `/hi` alternates, so Google serves the right language version to Hindi searchers (a large, under-tapped audience).

All changes pass `npx tsc --noEmit` (type-check clean).

---

## Where your traffic will actually come from (priority order)

Massive, legit traffic for a site like this comes mostly from **programmatic long-tail + freshness**, not head terms. "gold rate today" and "income tax calculator" are huge but brutally competitive. The realistic wins:

1. **City/rate long-tail** — "gold rate in <city> today", "petrol price in <city>" across your 50+ cities. You already generate these; keep prices updating daily (freshness = ranking) and make sure every city page interlinks to nearby cities.
2. **Scheme pages** — "<scheme name> eligibility / apply / last date". High intent, lower competition. Expand scheme coverage and keep `updated_at` fresh.
3. **Bank-specific rates** — "<bank> FD rates 2026", "<bank> home loan interest rate". Add `financialProductSchema` to these.
4. **Calculator how-tos & comparisons** — "old vs new tax regime which is better", "SIP vs lumpsum", "prepay home loan vs invest". You have the tools; add 600-900 word explainer content under each.

---

## Off-page actions only you can do (these drive the "massive" part)

Code can make pages *eligible* to rank; these get them *ranked*:

1. **Google Search Console** — submit `https://paisareality.com/sitemap.xml`, then watch Coverage + Performance weekly. Fix any "Discovered, not indexed" pages.
2. **Bing Webmaster Tools** — same sitemap; ~5-10% extra free traffic most Indian sites ignore.
3. **Publishing cadence** — 2-3 genuinely useful articles/week on money topics (tax saving, scheme deadlines, rate changes). Consistency compounds.
4. **Backlinks** — get listed in Indian finance directories, answer finance questions on Quora/Reddit with a link where relevant, and pitch a free-tool roundup to finance bloggers. Even 10-20 quality links move the needle.
5. **EEAT** — add real author bios, an "About / editorial policy" page, and "last reviewed" dates on calculators and money articles. Google weighs trust heavily on finance (YMYL) topics.
6. **Core Web Vitals** — check PageSpeed Insights for the homepage and a city page; defer non-critical ad scripts so LCP stays under 2.5s on mobile.

---

## Suggested next code tasks (say the word and I'll do them)

- Add `financialProductSchema` to all bank-rate pages and `datasetSchema` to gold/silver/petrol/diesel hubs.
- Roll the `calculatorSchema` + `howToSchema` pattern across the remaining calculators (fd, ppf, nps, home-loan, hra, gratuity, inflation).
- Add 600-900 word SEO content blocks + FAQs under each calculator and rate hub.
- Build comparison landing pages ("old vs new regime", "SIP vs FD", "FD vs RD") — strong long-tail intent.
- Expand city coverage in `src/lib/cities.ts` to capture more tier-2/3 city searches.

> Note: your OneDrive sync truncated two files mid-save during this session; I rewrote them via the shell and verified on disk. If the editor ever shows a file as fine but the build breaks, suspect a sync truncation and re-save.
