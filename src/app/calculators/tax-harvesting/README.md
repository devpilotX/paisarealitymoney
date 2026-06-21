# Equity Tax-Loss & Gain Harvesting Optimizer

A 100% client-side tool that tells you exactly which holdings to sell (and how much) before
year-end to legally minimise capital-gains tax — using the ₹1.25L LTCG exemption and India's loss
set-off rules.

- **Tool page:** `/calculators/tax-harvesting`
- **Engine (pure functions):** `src/lib/tax-harvesting.ts`
- **Tests:** `tests/tax-harvesting.test.ts`
- **UI:** `TaxHarvestingClient.tsx`

> **Rules last verified on: 2025-06-21** (FY 2025-26 / AY 2026-27).

---

## What it computes

1. **Classification** — each lot is STCG / LTCG (equity, 12-month boundary) or debt, with the
   unrealized gain/loss and days-to-long-term.
2. **Optimal set-off + tax** — applies the ₹1.25L exemption to LTCG, LTCL to taxable LTCG, then STCL
   to the highest-rate gains first (debt slab → equity STCG 20% → taxable LTCG 12.5%), plus 4% cess.
3. **Loss harvesting** — recommends selling all loss lots and shows the tax saved by offsetting gains.
4. **Gain harvesting** — fills the remaining ₹1.25L exemption headroom with long-term gains
   (partial quantities), tax-free, and reports the **cost-basis step-up benefit** (future tax saved).
5. **Carry-forward** — unused STCL/LTCL carried forward (8 years).
6. **Near-boundary tips** — flags short-term gains close to 12 months ("wait N days").

---

## Tax rules modelled (FY 2025-26)

| | Rate |
|--|--|
| Equity LTCG (Sec 112A, > 12 months) | 12.5% above ₹1,25,000/yr exemption |
| Equity STCG (Sec 111A, ≤ 12 months) | 20% |
| Debt MF (bought ≥ 01-Apr-2023) | slab rate |
| Cess | 4% on tax |

**Set-off:** STCL offsets STCG **and** LTCG; LTCL offsets **only** LTCG; carry-forward 8 years.
The 12-month anniversary itself is still short-term (long-term requires holding *more than* 12
months).

---

## Why the set-off order is optimal

A rupee of flexible short-term loss saves the most tax against the highest-taxed rupee of gain, so
STCL is applied to debt (slab) → equity STCG (20%) → taxable LTCG (12.5%), after LTCL has been used
on taxable LTCG (its only possible target) and after the ₹1.25L exemption has sheltered LTCG. This
greedy ordering is **verified against a brute-force search** over all loss allocations on small
portfolios.

---

## Validation (see test suite — 26 cases, 46 assertions)

- 12-month boundary classification (anniversary = short-term; next day = long-term).
- **Greedy set-off == brute-force minimum tax** across 5 portfolios (equity/debt/loss mixes, varying
  slabs).
- Exemption never exceeded; LTCL never touches STCG; STCL prefers higher-rate buckets.
- Gain-harvesting fills exactly to the exemption headroom (partial lots) and stays tax-free; realized
  LTCG shrinks the headroom; basis step-up benefit computed.
- Edge cases: only losses (carry forward), gains under ₹1.25L (fully free), debt at slab,
  near-boundary "wait" tip, harvest-loss action for every loss lot.

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/tax-harvesting.test.ts
```

---

## Privacy & compliance

- **No login, no paywall, no server calls.** Portfolio data never leaves the browser. Works offline.
- **Educational estimate, not advice.** Not a buy/sell recommendation (SEBI IA Regulations). India
  has **no formal wash-sale rule**, so immediate re-buy is legal; the tool still flags prudence.

## Known limitations / TODO

- Surcharge on very high incomes is not applied (cess is).
- Broker-level FIFO lot matching may change which units are deemed sold; the tool treats each input
  lot independently.
- STT, brokerage and bid-ask spread (the real cost of harvesting) are not netted off.
- Section 94(7)/94(8) bonus-stripping/dividend-stripping anti-avoidance rules are out of scope.
