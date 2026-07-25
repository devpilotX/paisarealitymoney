# seo/ROADMAP.md

## Shipped

### Batch 1 — hubs and internal links (deployed 2026-07-25 21:40 IST)
Merged as `6747853` (PR #2). Downtime 22 s. Restart count unchanged at 14
(no `EADDRINUSE`). Live gates: sitemap **772**, `/schemes` **351** crawlable
scheme links, `/state` **36**, `/category` **14**. Structural diff vs the
pre-deploy baseline: 11 of 11 UI markers unchanged, only the two declared
changes present. Zero new runtime errors.

Expected effect and honest timing: this fixes *discovery and link equity*, not
ranking directly. 343 scheme pages went from sitemap-only discovery to being
linked from their own hub. Google must recrawl before anything moves. Realistic
window to see impression change in Search Console: **2–6 weeks**, and the
mechanism is more pages becoming eligible to rank at all, not existing pages
jumping positions.

---

### Batches 2 and 3 — metadata quality across all 772 pages (deployed 2026-07-26, live source `bce4adc`)
Deployed from the standing build worktree so the live `.next` was never mid-build:
build in `/opt/paisareality-build`, patch the two files that record the absolute
build path, then `mv` the directory in and restart. Restart count 14 to 16 over
two deploys, no `EADDRINUSE`, zero new entries in the pm2 error log.

Verified by crawling all 772 sitemap URLs before and after, same script both
times (`node scripts/seo-audit.mjs`):

| | before | after |
|---|---|---|
| titles over 60 chars | 297 | 14 |
| longest title | 120 | 79 |
| descriptions over 155 | 314 | 15 |
| descriptions cut mid-sentence with an ellipsis | 253 | 0 |
| pages with no `og:image` | 717 | 0 |
| non-200 responses | 0 | 0 |
| missing canonical, missing H1, duplicate H1, no JSON-LD, image without alt | 0 | 0 |

The 14 remaining long titles are scheme and scholarship names that exceed 60
chars on their own, plus two editorial newsletter titles at 68 and 69. The 15
remaining long descriptions are hand-written database values between 156 and
160, inside the range Google actually displays. Both are honest floors, not
defects: shortening either would mean inventing an abbreviation or rewriting
copy that was tuned for CTR.

Still thin and worth real content when there is time: `/guides` at 245 words and
`/pricing` at 284.

---

## Detail on the shipped metadata work

### Batch 3 — findings from a full live crawl of all 772 sitemap URLs (2026-07-26)
Crawled every URL in the sitemap over HTTPS and checked status, title, meta
description, canonical, robots, H1 count, JSON-LD, og tags, image alt text and
word count. The technical baseline came back clean: **0** non-200, **0** redirect
hops, **0** missing or duplicate titles, **0** missing descriptions, **0** missing
or mismatched canonicals, **0** accidental noindex, **0** pages without an H1,
**0** pages with several H1s, **0** pages without JSON-LD, **0** images without
alt text, **0** uncompressed responses.

Everything found was metadata quality, and all of it is now fixed:

| finding | before | after |
|---|---|---|
| pages with no `og:image` at all | 717 of 772 | 0 |
| titles over 60 on hand-written pages | 24 | 0 |
| descriptions over 155 on hand-written pages | 18 | 0 |
| `/bank-rates/[slug]` titles over 60 | 18 of 51 | 0 |
| root error boundary (`global-error.tsx`) | missing | added |

`og:image` was the biggest miss: `app/opengraph-image` only auto-attached to the
home page and the category hubs, so 717 pages shared no social card. It is now
set explicitly in `pageMetadata`, which every page routes through.

The two long `/state/[slug]` titles and the 18 `/bank-rates/[slug]` titles now
use `fitTitle`, the same fit-the-suffix approach as the record builders. The
unknown-scholarship fallback returns `noindex` instead of a placeholder
description, matching the schemes route.

New guard: `tests/seo-static-metadata.test.ts` walks all 106 page and layout
files, extracts every literal title and description from their metadata blocks,
and fails if any exceeds 60 or 155 chars or drops under 70. That is what stops
this class of regression coming back.

Known and deliberately not changed: `/guides` (245 words) and `/pricing` (284
words) are thin, and two newsletter titles run 68 to 69 chars. Those are
editorial content, fixable in the admin panel without a deploy.

### Batch 2 detail — length-aware metadata templates
Fixes the *fallback* templates for pages with no hand-written override. Does not
touch the 39 scheme and 31 scholarship overrides, so nothing already approved
changes. New `buildRecordTitle` / `buildRecordDescription` in `src/lib/seo.ts`,
wired into `/schemes/[slug]` and `/scholarships/[slug]`.

Measured against the seed sources, not estimated (re-verified 2026-07-25 23:55):

| | before | after |
|---|---|---|
| scheme titles over 60 | 242 of 312 | 10 |
| longest scheme title | 108 | 78 |
| scheme titles carrying a qualifier, not just the year | 91 of 312 | 207 |
| scheme descriptions truncated mid-sentence | 253 | 0 |
| scholarship titles over 60 | 31 of 31 | 2 |
| longest scholarship title | 120 | 79 |

Fitting is not the whole goal. Reviewing the real output showed 205 of 312
titles landing on a bare name plus year, so the suffix ladder now descends by
information value (`Eligibility & Apply Online` → `Eligibility & Apply` →
`How to Apply` → `Eligibility` → year) and apply wording is used only where
`apply_url` exists. Bare-year titles fell 205 → 84 without pushing a single
extra page over 60.

The 12 remaining long titles are names that alone exceed 60 characters
(`National Pension Scheme for Traders and Self-Employed (Laghu Vyapari
Maandhan)` is 78). Abbreviating them would mean inventing a name, so they stay
intact. "Apply Online" is claimed only where `apply_url` exists (0 false claims).

Gates: `npm run typecheck` exit 0, `npm test` 16 suites (new
`tests/seo-metadata.test.ts`, 28 assertions), `npm run build` exit 0 with
368/368 pages. Shipped on 2026-07-26 in the deploy described above. It is
code-only: no reseed, no migration. Scheme
and scholarship pages are SSG, so this is inert until a rebuild on the VPS. It
is code-only: no reseed, no migration.

---

## Infrastructure debt (logged, not built)

### Atomic releases via symlink switch
Swapping `.next` directories in place is a workaround. It has three flaws we
hit or nearly hit tonight:
1. A build in the live directory can be served before review (this happened;
   recovered).
2. `.next/required-server-files.json` and `required-server-files.js` record the
   absolute build path in `appDir`, `config.outputFileTracingRoot` and
   `config.turbopack.root`. Moving the directory requires patching all three,
   which we now do by hand.
3. There is a real, if short, window where `.next` does not match the running
   process.

Correct long-term shape:
```
/opt/releases/<sha>/          # full checkout + node_modules + .next
/opt/paisareality-current ->  # symlink, switched atomically
```
Build in the release dir (so the recorded absolute path is already correct and
never needs patching), then `ln -sfn` the symlink and reload. Rollback is a
symlink flip — instant, no rebuild, no copy. **Do not build this reactively
mid-SEO-work.** Schedule it as its own change.

### Standing build location
`/opt/paisareality-build` is a permanent `git worktree` on the deploy branch,
owned by `mcpagent`. Keep it. `/opt` is not writable by `mcpagent`, so the
directory itself had to be created with `sudo mkdir` + `chown`.

### Host contention
Shared 4-core box. `quantsys.backtest.runstudy` holds a full core for hours at
a time. Always build with `nice -n 19 ionice -c3`, detached via `nohup`, and
poll the log. A build that takes 22 s locally took 65 s of compile plus queueing
here. RAM is not the constraint (23 GiB total, ~20 GiB free).

### Port map on this host — check before binding anything
| port | process |
|---|---|
| 3000 | **paisareality** (next-server v16.2.10, `/opt/paisareality`) ← nginx upstream |
| 3001 | node (PID 1488) |
| 3006 | devpilotx-business (next-server v15.5.20) |
| 3010 | docker-proxy |
| 8100 | node (PID 1471, localhost only) |

3900 was used for verification. The two Next servers never collided — different
ports. The Jul 24 `EADDRINUSE :::3000` was paisareality colliding with its own
outgoing instance during a PM2 restart, which the stop → poll → start sequence
now prevents.

---

## Next, in priority order

### 1. Scheme + scholarship title/meta rewrite (O4) — strings need approval
The ~60 pages already ranking in the top 15. Pure metadata, deliverable through
the **admin panel** with no deploy: `meta_title`/`meta_description` are DB
columns with override priority, already in use on 39 of 351 schemes and 31 of
62 scholarships.

Formula must be **qualifier-led, not amount-led** — see steering §9.
`benefit_amount_max` is populated on only 70/351, is semantically mixed
(₹1,400 to ₹20 crore), has no unit column, and is NULL on 9 of the 10
highest-impression pages. Build on the 100%-coverage fields instead:
`benefit_summary`, `category`, `level`, `states`.

### 2. Fix the remaining O1 punch list
`/bank-rates` (was unknown to Google — now linked and resubmitted), `/about`
(discovered, not indexed — likely thin; needs real E-E-A-T content on a YMYL
site), one newsletter post. Re-inspect after the recrawl.

### 3. Re-pull Search Console 2026-07-28
Confirmation only, not a gate. Settles whether the 2026-07-20..22 decline
(998 → 349 → 85 → 33) was processing lag. `dataState: final` returned
byte-identical rows to `all`, so that test was inconclusive.

### 4. [ADMIN] data population — unblocks two dead SEO plays
- `schemes.deadline`: **0/351**. Blocks every "last date" query, and
  `e grantz scholarship 2026 last date` ranks #1 with 0 clicks.
- `scholarships.deadline` / `opens_on`: **0/62**.
- `schemes.benefit_amount_max`: 281/351 missing, and there is no unit column —
  adding one would make amount-led titles viable.

### 5. Formal decision: reverse the `/hi` noindex (hindi-unlock)
Deferred by agreement until after this deploy. Evidence for reopening it is now
strong: regional-language results dominate the SERPs we care about (Malayalam
for `aswasakiranam`, Hindi for `palanhar yojana`, Marathi for `lek ladki`), and
`schemes.name_hi` is populated on **351/351**. Raise as a data-backed decision,
not a code change.

### 6. Mobile-vs-desktop split on scheme pages
Desktop 2,489 impressions at position 24.9 and 0.4% CTR; mobile 1,598 at
position 14.2 and 1.4% CTR. Mobile ranks ~10 positions better and converts
3.5× better. Worth investigating as its own question.
