# Multi-Year Tax Regime & Investment Optimizer

A 100% client-side optimizer that goes beyond a one-year old-vs-new comparison: it projects your
tax under **both regimes for every year** to your horizon, picks the cheaper each year (salaried)
or the better fixed regime (business), sums the **NPV of lifetime tax**, finds the **crossover
year**, and recommends a year-by-year tax-saving investment mix.

- **Tool page:** `/calculators/lifecycle-tax-optimizer`
- **Engine (pure functions):** `src/lib/lifecycle-tax-optimizer.ts`
- **Tests:** `tests/lifecycle-tax-optimizer.test.ts`
- **UI:** `LifecycleTaxOptimizerClient.tsx`, reuses `src/components/PayoffTimelineChart.tsx`

> **Rules last verified on: 2025-06-21** (FY 2025-26 / AY 2026-27).

---

## Tax constants modelled (per-year overridable via `constantsByYear`)

| | New regime | Old regime |
|--|-----------|-----------|
| Slabs | 0-4L 0%, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%, 20-24L 25%, >24L 30% | 0-2.5L 0%, 2.5-5L 5%, 5-10L 20%, >10L 30% (senior/super-senior vary) |
| Standard deduction | ₹75,000 | ₹50,000 |
| 87A rebate | taxable ≤ ₹12L ⇒ ₹0 | taxable ≤ ₹5L ⇒ ₹0 |
| Deductions | only employer NPS 80CCD(2) | 80C ₹1.5L, 80CCD(1B) ₹50k, 80D, HRA, 24(b) ₹2L, 80CCD(2) |
| Surcharge | 10/15/25% (capped 25%) | 10/15/25/37% |
| Cess | 4% | 4% |

Surcharge uses **marginal relief**. Single-year mode reproduces the standalone
`/calculators/income-tax` page to the rupee.

---

## Key modelling choices (labelled assumptions)

- **Multi-period loop** to the horizon; income grows at the CTC growth rate; HRA assumes Basic =
  40% of CTC and an HRA component of 50% of Basic; home-loan interest uses a 20-year declining
  amortization starting in the chosen year; 80D steps up at a chosen year.
- **Strategies:** always-new, always-old, and optimal. **Salaried** switch the cheaper regime each
  year; **business** are locked to the single regime with the lower lifetime NPV (cannot switch).
- **NPV** discounts each year's tax at the chosen discount rate. By construction the optimal NPV is
  ≤ both static strategies.
- **Investment mix:** in old-regime years, fill 80C / 80CCD(1B) / 80D up to caps, bounded by the
  lock-in appetite; in new-regime years those lock-ins give no benefit so are not recommended.
- **Crossover year:** the first year the old regime's tax drops below the new regime's.

---

## Validation (see test suite — 24 cases, 47 assertions)

- **Single-year new & old regime tax matches the standalone calculator to the rupee** across many
  incomes (e.g. new @ ₹18L = ₹150,800; old @ ₹15L with 80C+80D = ₹202,800).
- ₹12.75L pays ₹0 under the new regime (87A); ₹5L taxable pays ₹0 under the old.
- **NPV equals the discounted sum** of each year's chosen tax; NPV < nominal when discount > 0.
- **Optimal ≤ both static** strategies (salaried); **business locks to one regime**.
- Crossover detected correctly; low income never crosses; surcharge applies above ₹50L; senior
  citizens pay less; per-year constant overrides affect only that year; employer NPS cuts tax in
  both regimes.

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/lifecycle-tax-optimizer.test.ts
```

---

## Privacy & compliance

- **No login, no paywall, no server calls.** The entire projection runs in the browser; salary and
  deduction details are never transmitted. Works offline after first load.
- **Educational estimate, not tax advice.** A visible disclaimer states this; verify with a
  qualified Chartered Accountant before filing.

## Known limitations / TODO

- Assumes current rules persist across all years unless overridden; real Budgets change slabs/caps.
- HRA and home-loan interest are simplified (Basic = 40% of CTC; 20-year loan amortization).
- The investment-mix recommendation is a per-year greedy fill, not a full multi-year dynamic program
  over lock-in liquidity states; lock-ins are bounded by the appetite input.
- Capital gains on tax-saver investments and the 80C/ELSS vs PPF return differences are out of scope
  (use the Retirement and Prepay-vs-Invest tools for wealth projections).
