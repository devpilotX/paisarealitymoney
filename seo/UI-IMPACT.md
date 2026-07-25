# seo/UI-IMPACT.md

Every visible change proposed in this run. The owner reads this **before**
Stage 3 implementation. The approved UI is frozen: additive only, in the
existing design language, reusing existing components.

Batch 1 — "hubs and crawlable directories" (findings E + F + apply-online fix).

---

## Summary

| # | Change | Visible? | Component reused | New visual pattern? |
|---|---|---|---|---|
| 1 | Scheme directory below the finder on `/schemes` | **Yes** | `InternalLinks` | No |
| 2 | New `/state` hub page (currently 404) | **Yes** (new page) | `InternalLinks`, `Breadcrumb` | No |
| 3 | New `/category` hub page (currently 404) | **Yes** (new page) | `InternalLinks`, `Breadcrumb` | No |
| 4 | `/schemes` FAQ: "over 200" → real DB count | **Yes** (text only) | existing `FAQ` | No |
| 5 | Conditional title suffix when `apply_url` is null | **No** — `<title>` only | n/a | No |
| 6 | `/state` + `/category` added to `sitemap.ts` | No | n/a | No |

**Zero changes** to layout, spacing, colour, typography, navigation, header,
footer, or any existing component. Nothing existing is moved, restyled, or
reflowed. No CSS framework, design library, or global style is added.

---

## 1. Scheme directory on `/schemes`

**What it is:** a server-rendered, crawlable list of all active schemes,
grouped into 14 sections by category (Education, Housing, Business, …).

**Which component it reuses:** `src/components/InternalLinks.tsx`, unchanged.
One `<InternalLinks title=… links=… columns={3} />` per category. This is the
component the page **already uses twice** ("Browse Schemes by Category" and
"Popular Scheme Pages"), so the visual language is already established on
this exact page.

**Where it sits:** appended at the **very bottom** of the existing template,
below the FAQ and final ad banner, inside its own `<section>` separated by a
single `border-t border-line` rule (an existing token). Nothing above it moves.
The 6-step interactive `ProfileForm` and `SchemeResults` are untouched.

*Correction from the first draft of this document: I originally planned to
place it above the FAQ. It ships at the very bottom instead — a 351-item list
belongs last, and it keeps the existing block order completely unchanged.*

**Anchor text:** the scheme name only, no description line and never "read
more". This keeps the block compact and the anchors descriptive.

**Why the SEO gain requires visibility:** internal links must be real,
crawlable `<a href>` elements in the served HTML. Googlebot does not complete
a 6-step form, so the 351 scheme pages currently have no internal link path
from their own hub. Measured: `/schemes` serves **8** crawlable `/schemes/`
links for 351 children, while `/scholarships` serves **62 of 62** and enjoys
90% impression coverage versus ~75%. Google's recorded `referringUrls` for the
top scheme pages is `sitemap.xml` only. A hidden or JS-gated list would not
fix this; the links must render server-side.

**Honest note on page length:** this adds a long list to a page that is
currently short. It is the same trade-off `/scholarships` already makes (it
renders all 62 children as cards by default). If you would rather cap it,
say so and I will render the top N per category with a "view all" link to the
new `/category/[slug]` pages instead.

## 2. New `/state` hub — `/state` currently returns 404

**What it is:** a new page listing all 36 states and union territories.

**Reuses:** `Breadcrumb` + `InternalLinks` (columns={3}), matching the
`/scholarships` hub structure. `AdBanner` placement mirrors sibling hubs.

**Where it sits:** a brand-new route. Nothing existing is affected.

**Why visible:** the 36 `/state/[slug]` pages have no hub parent, so no link
equity reaches them from the top of the site. They are already indexed, so
this is **not** an indexation fix — it is link equity and crawl depth, exactly
as you framed it. `/state/kerala` alone serves 177 crawlable scheme links, so
making the state tier reachable also strengthens the whole scheme family.

## 3. New `/category` hub — `/category` currently returns 404

Identical rationale and construction to #2, for the 14 `SCHEME_CATEGORIES`.

## 4. `/schemes` FAQ count correction

Current answer text says "over 200 central and state government schemes".
The real count is **351 active**. Changed to interpolate a live count passed
from the server component, so it cannot drift again.

**Visible:** yes, one sentence of existing FAQ copy. No structural change.
**Why:** factual accuracy on a YMYL site. Understating our own coverage by
40% is both wrong and self-defeating.

## 5. Conditional title suffix — invisible, accuracy fix

`312 of 351` scheme titles currently promise "Apply Online" while only
**36 of 351** have an `apply_url`. The suffix misrepresents 89% of the family.

- `apply_url` present → `{name} - Eligibility, Benefits & Apply Online 2026`
- `apply_url` null → `{name} - Eligibility & Benefits 2026`

This is a trust/accuracy fix, not an optimisation, and it incidentally removes
15 characters from 315 over-long titles. It does **not** pre-empt the full
title formula, which comes in a later batch once you approve the strings.

## 6. Sitemap additions

`/state` and `/category` added to `staticPages`. Expected sitemap total:
**770 → 772**. This count is asserted in Stage 4 verification.

---

## What I am NOT doing in this batch

- Not touching `ProfileForm`, `SchemeResults`, or any results rendering.
- Not adding FAQ blocks anywhere (`FAQ.tsx` already emits FAQPage JSON-LD;
  Google restricted FAQ rich results to gov/health sites in Aug 2023, so it
  earns no rich result here and is not part of any CTR forecast).
- Not rewriting the title/meta formula — separate batch, strings approved first.
- Not touching `/hi`, deferred by agreement.
- Not adding `deadline` anywhere — the column is NULL across all 413 rows.
