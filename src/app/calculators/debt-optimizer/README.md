# Multi-Loan Debt Repayment Optimizer

A 100% client-side, **deterministic, tax-aware** optimizer that finds the order to clear multiple
loans on a fixed budget so you pay the least interest in the least time.

- **Tool page:** `/calculators/debt-optimizer`
- **Engine (pure functions):** `src/lib/debt-optimizer.ts`
- **Tests:** `tests/debt-optimizer.test.ts`
- **UI:** `DebtOptimizerClient.tsx`, `src/components/PayoffTimelineChart.tsx`

> **Rules last verified on: 2025-06-21** (FY 2025-26 / AY 2026-27).

---

## Strategies compared

All use the same budget and the **debt-rollover** method: pay every minimum, then cascade the
surplus (plus the freed-up minimums of cleared loans) into the top-priority loan.

| Strategy | Priority order | Optimises |
|----------|----------------|-----------|
| **Avalanche** | Highest **nominal** rate first | Total interest (no-tax) |
| **Snowball** | Smallest **balance** first | Behavioural momentum |
| **Tax-aware** *(recommended)* | Highest **effective post-tax** rate first | **After-tax** interest |
| **Minimums** | — (baseline) | Shows interest saved |

---

## Tax rules modelled (effective rate)

| Loan type | Old regime | New regime |
|-----------|-----------|-----------|
| Home | `rate × (1 − shieldFraction × slab)`, Section 24(b), ₹2L/yr cap | nominal |
| Education | `rate × (1 − slab)`, Section 80E, full interest, ~8 yrs | nominal |
| Personal / car / credit-card | nominal | nominal |

`shieldFraction = min(annualInterest, ₹2L) / annualInterest`, estimated at the current balance.
Education 80E is modelled as active over the payoff window (8-year limit noted as a caveat).

### Interest accrual
- **Credit cards** compound **daily**: monthly factor `= (1 + rate/365)^(365/12) − 1`.
- All other loans accrue at `rate / 12` per month.

---

## Key modelling choices (labelled assumptions)

- **Rollover simulation** month-by-month; minimums paid first, surplus cascades by priority.
- **Prepayment penalty** applies to *extra* (above-minimum) payments: a ₹X allocation reduces
  principal by `X × (1 − penalty)` and books `X × penalty` as a penalty cost.
- **Minimums-only** baseline uses budget = sum of minimums (no surplus) to measure interest saved.
- **Target-date solver** binary-searches the minimum budget that clears all debt by a chosen month
  (payoff months are monotone in budget).
- **Budget shortfall** (budget < sum of minimums) is detected and warned; balances then grow.
- Deterministic and pure ⇒ identical inputs give identical output; a 100-year guard prevents
  infinite loops on unservinceable debt.

---

## Validation (see test suite — 24 cases, 46 assertions)

- **Single-loan payoff matches the EMI amortization to the rupee.**
- **Avalanche ≤ Snowball total interest** in a no-tax world (interest optimality).
- With no shields, **tax-aware == avalanche**.
- **Tax-aware beats naive avalanche on after-tax interest** in a crafted case (10% home vs 9%
  personal: tax-aware clears the personal loan first and pays less after tax).
- Effective-rate rules for home / education / personal / car; new regime removes all shields.
- Credit-card daily compounding costs more than a monthly loan at the same rate.
- 0% loan is deprioritised; budget shortfall warns; payoff months monotone in budget; target
  solver returns a near-minimal feasible budget (or null when impossible).

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/debt-optimizer.test.ts
```

---

## Privacy & compliance

- **No login, no paywall, no server calls.** All optimisation runs in the browser; loan and income
  details are never transmitted. Works offline after first load.
- **Educational estimate, not advice.** A visible disclaimer states this.

## Known limitations / TODO

- Assumes budget and minimum payments stay constant over the payoff.
- The 80E 8-year limit is modelled as active over the payoff window (not back-dated to the loan's
  origination); the ₹2L home cap uses the current-balance interest estimate for ranking.
- Greedy highest-effective-first is the standard near-optimal heuristic; it does not brute-force
  every permutation (which is unnecessary for the rollover objective).
- Tax on any invested freed-up cash is out of scope (use the Prepay vs Invest tool for that).
