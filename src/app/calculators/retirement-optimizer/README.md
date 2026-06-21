# Retirement Corpus & Withdrawal Optimizer

A 100% client-side, Monte Carlo retirement planner for India. It answers three questions from one
simulation: **how much corpus you need**, **the monthly SIP to get there**, and a **safe withdrawal
strategy** — reported as a probability of success, not a single misleading "average" number.

- **Tool page:** `/calculators/retirement-optimizer`
- **Engine (pure functions):** `src/lib/retirement-optimizer.ts`
- **Tests:** `tests/retirement-optimizer.test.ts`
- **UI:** `RetirementOptimizerClient.tsx` (+ Web Worker `retirement.worker.ts`), `src/components/FanChart.tsx`, `src/components/SuccessGauge.tsx`

> **Rules last verified on: 2025-06-21.** Historical return dataset "as of": **2024-03-31** (FY 2023-24 close).

---

## What it computes

1. **Accumulation** — existing corpus + monthly SIP (with annual step-up), compounded by a glide-path
   blend of equity/debt/gold, simulated year by year across 10,000+ paths.
2. **Decumulation** — inflation-indexed annual withdrawals (separate general vs medical inflation),
   net of any part-time income and NPS annuity, until the planning age.
3. **Success probability** — share of paths whose corpus never hits zero before the planning age.
4. **Required corpus** — decumulation-only binary search for the corpus that hits the target success %.
5. **Required SIP** — end-to-end binary search for the SIP that hits the target success %.
6. **Safe withdrawal** — the today's-rupees monthly spend the median projected corpus can sustain.
7. **Sensitivity** — success % under ±1% returns, ±1% inflation, and ±5 years of longevity.

---

## Key modelling choices (all are editable assumptions, never hidden constants)

| Area | Choice | Notes |
|------|--------|-------|
| Returns | **Nominal**, per asset class (equity/debt/gold) | Results also shown in today's rupees (deflated by general inflation). |
| Distribution | **Normal** (editable mean & volatility) by default; optional **bootstrap** of historical years | Bootstrap preserves cross-asset co-movement; normal mode draws assets independently (correlation not modelled). |
| Time step | **Annual**, with an exact intra-year monthly-SIP factor | Reproduces the standard monthly-SIP future-value formula to the rupee. |
| SIP timing | Start-of-month (annuity-due) | |
| Withdrawal timing | Start-of-year, then the remainder grows | Conservative; respects sequence-of-returns risk. |
| Glide path | `100 − age`, `120 − age`, custom-linear to a floor, or fixed | Non-equity split between debt & gold by their starting ratio; equity never falls below the floor. |
| Inflation | Separate **general** (default 6%) and **medical** (default 10%) | Medical share of expenses inflates faster. |
| EPF | Fixed administered rate (no volatility), tax-free at retirement | |
| NPS | 60% tax-free lump sum + 40% compulsory annuity (PFRDA) | Annuity pension treated as fixed-nominal. |
| RNG | Seeded mulberry32, **common random numbers** | Same inputs ⇒ same output; makes success % monotonic in SIP and binary search stable. |
| Single-year return floor | −95% | Prevents `(1+r)^(1/12)` going undefined in extreme tail draws. |

### Default Indian assumptions
Equity 12% / 17% vol · Debt 7% / 4% vol · Gold 8% / 14% vol · general inflation 6% · medical inflation 10% ·
start mix 70/20/10 (equity/debt/gold) · custom-linear glide to a 30% equity floor · 10,000 simulations.

---

## Validation (see test suite — 25 cases, 41 assertions)

- **Deterministic engine == closed-form** stepped-up monthly-SIP future value, **to the rupee**.
- **Monte Carlo mean converges** to the deterministic value (observed within ~0.02% at 20k paths).
- **Success % is monotonic** non-decreasing in SIP (guaranteed by common random numbers + fixed
  per-path RNG consumption).
- **Deterministic decumulation** matches the closed-form growing-annuity present value at the boundary.
- **Inverse solvers** hit their target success probability; required corpus carries a sequence-risk
  buffer above the deterministic minimum.
- Edge cases: FIRE, zero/negative real return, already-sufficient corpus, age-100 horizon,
  post-retirement income, glide-path monotonicity.

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/retirement-optimizer.test.ts
```

---

## Privacy & compliance

- **No login, no paywall, no server calls.** All computation (including every Monte Carlo path) runs in
  the browser; financial inputs are never transmitted. Works offline after first load.
- **Educational estimate, not advice.** Outputs are scenarios/estimates, not predictions or a
  buy/sell recommendation (SEBI Investment Adviser Regulations). A visible disclaimer states this and
  points users to a SEBI-registered adviser.

## Known limitations / TODO

- Normal mode assumes independent asset draws (no correlation matrix); use bootstrap mode for
  historically-correlated co-movement.
- The bundled historical dataset is **approximate and illustrative** — replace with verified
  NSE / CCIL / IBJA series before relying on bootstrap mode.
- NPS annuity is modelled as fixed-nominal (not inflation-indexed), matching most Indian annuity products.
- Taxes on withdrawals are not modelled in v1 (corpus is treated as post-tax / tax-exempt buckets).
