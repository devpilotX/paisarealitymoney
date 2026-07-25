# seo/BASELINE-schemes.md

Structural fingerprint of the **live** `/schemes` page captured immediately
**before** the `seo/hubs-and-internal-links` deploy. This is the evidence that
the UI-frozen constraint held: everything below must be unchanged afterwards
except the two lines explicitly marked as intended changes.

- Captured: 2026-07-25, from `https://paisareality.com/schemes`
- Production commit at capture: `dde6a757c33d87ae1eb39b8a68363228ed6f3abf` (main)
- Source file: `/tmp/seo-baseline/schemes-before.html` (transient — this
  document is the durable copy)
- `sha256`: `edcf795c5a331fe7718eb3dcf76bb5478d07b749bb0d763085238b7c23c74751`
- Bytes: **57,563**

## Document structure

| metric | baseline value | expected after deploy |
|---|---|---|
| `<title>` | `Government Scheme Finder: Check Schemes You Qualify For` | unchanged |
| `<h1>` count | 1 | unchanged (1) |
| `<h2>` count | 5 | **6** — one added: "All 351 Government Schemes A–Z" |
| `<h3>` count | 6 | **20** — `InternalLinks` renders one `<h3>` per section heading |
| unique `/schemes/…` links | **8** | **351** — the whole point of the change |
| unique `/category/…` links | 14 | unchanged (14) |
| `application/ld+json` blocks | 6 | unchanged (6) |
| `container-main` occurrences | 2 | unchanged (2) — proves the wrapper moved, not duplicated |

The `container-main` count is the key UI-safety assertion. The interactive
finder was extracted into a client component that returns a fragment, with the
`container-main py-6` wrapper moved up to the new server parent. If that count
changes, the wrapper was duplicated or dropped and the layout shifted.

## Section markers — each must still be present exactly this many times

| marker | baseline count | expected after |
|---|---|---|
| `Government Scheme Finder` | 2 | 2 |
| `Browse Schemes by Category` | 1 | 1 |
| `Popular Scheme Pages` | 1 | 1 |
| `About Government Schemes in India` | 1 | 1 |
| `Frequently Asked Questions` | 1 | 1 |
| `Scheme Benefit Maximizer` | 1 | 1 |
| `myscheme.gov.in` | 1 | 1 |
| `How does the scheme finder work` | 1 | 1 |
| `over 200 central and state` | 1 | **0** — intended: replaced by the live DB count (351) |

## The only two intended visible changes

1. A new `<section>` at the very bottom of the page, below the FAQ, headed
   "All 351 Government Schemes A–Z", containing the crawlable directory
   rendered with the existing `InternalLinks` component.
2. The FAQ answer "over 200 central and state government schemes" becomes the
   real count interpolated from the database.

Everything else in the table above must match exactly. Anything else that moves
is a regression and a rollback trigger.
