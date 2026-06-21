# Gold Allocation & Cost-Averaging Explainer

A 100% client-side, **NEUTRAL, educational** tool that explains gold's historical role in a
portfolio and helps plan a disciplined SIP/cost-averaging allocation. It does **not** predict prices
and does **not** issue buy/sell signals — every output is framed as a historical pattern or scenario.

- **Tool page:** `/calculators/gold-planner`
- **Engine (pure functions):** `src/lib/gold-planner.ts`
- **Tests:** `tests/gold-planner.test.ts`
- **UI:** `GoldPlannerClient.tsx` (reuses `PayoffTimelineChart`)

> **Rules/data last verified on: 2025-06-21.** Bundled dataset "as of": **2024-03-31**.

---

## Compliance stance (important)

Predicting prices or recommending when to buy/sell gold is **regulated investment advice** requiring
a SEBI licence. This tool is intentionally **educational and historical only**:

- No buy/sell signals, no price targets, no predictions.
- Allocation bands are presented as *commonly-cited educational ranges*, never recommendations.
- A **compliance test** scans every output string for banned phrases (e.g. "buy now", "will rise",
  "guaranteed return", "good time to buy", "price target") across all risk-profile × instrument
  combinations and fails the build if any appear.
- A prominent "historical, not advice, not a prediction" disclaimer appears in the UI.

---

## What it computes

1. **Historical stats** — average annual return, volatility, max drawdown, best/worst year, and
   correlation with the Nifty (low correlation ⇒ diversifier).
2. **Rolling returns & entry-timing spread** — annualised return across every historical window of a
   given length, to illustrate how much the start year mattered (timing is hard).
3. **SIP vs lump-sum backtest** — a historical replay (annual granularity) of investing a fixed
   amount yearly vs all at once, including SGB 2.5% interest.
4. **Instrument comparison** — SGB / Gold ETF / physical / digital with tax and key caveats.
5. **Educational allocation bands** by risk profile (conservative 10–20%, moderate 5–15%,
   aggressive 0–10%).

---

## Tax modelled (FY 2025-26)

| Instrument | Long-term after | LT rate | Short-term |
|--|--|--|--|
| SGB | 12 months | 12.5% | slab (maturity redemption is tax-free) |
| Gold ETF / fund | 12 months | 12.5% | slab |
| Physical gold | 24 months | 12.5% | slab |
| Digital gold | 24 months | 12.5% | slab (NOT SEBI/RBI regulated) |

Long-term gains include 4% cess. SGB also pays 2.5% annual interest (taxable at slab). Verify current
rules before acting.

---

## Validation (see test suite — 24 cases, 43 assertions)

- **All historical stats reproduce** independently from the dataset (avg, volatility, max drawdown,
  Nifty correlation, best/worst year).
- Rolling returns ordered (min ≤ avg ≤ max); entry-timing spread non-negative.
- SIP/lump-sum backtest totals and multiples reproduce; SGB beats an identical ETF backtest (interest).
- Tax math correct per instrument and holding period; zero/negative gain → zero tax.
- Digital gold flagged as not SEBI/RBI regulated; SGB notes 2.5% interest + tax-free maturity.
- **COMPLIANCE: no output string contains a buy/sell signal or price prediction** across all
  profile × instrument combinations; notes use historical/scenario framing; bands carry a neutrality
  caveat; disclaimer says "not advice" and "not a prediction".

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/gold-planner.test.ts
```

---

## Privacy

- **No login, no paywall, no server calls.** Runs entirely in the browser; works offline after load.

## Known limitations / TODO

- The bundled dataset is **approximate and illustrative** (annual returns, ~19 years) — replace with
  verified IBJA/RBI gold and NSE Nifty series before relying on it.
- Backtest uses annual granularity (one purchase per year), not monthly.
- Tax holding-period rules for gold/ETFs have changed recently and may change again — treat as
  "as of" and verify.
- SGB interest is modelled as simple interest on principal for illustration.
