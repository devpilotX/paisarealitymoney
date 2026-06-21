# Home Loan Prepay vs Invest Optimizer

A 100% client-side, **risk-adjusted, after-tax** comparison of prepaying a home loan versus
investing the surplus. It replaces the naive "loan rate vs FD rate" rule with a guaranteed
after-tax prepay return pitted against a 10,000-path Monte Carlo of the investment.

- **Tool page:** `/calculators/prepay-vs-invest`
- **Engine (pure functions):** `src/lib/prepay-vs-invest.ts`
- **Tests:** `tests/prepay-vs-invest.test.ts`
- **UI:** `PrepayVsInvestClient.tsx`, `src/components/DistributionChart.tsx`, reuses `SuccessGauge`

> **Rules last verified on: 2025-06-21** (FY 2025-26 / AY 2026-27).

---

## What it computes

1. **Prepay side (risk-free).** Prepaying ₹1 of principal avoids the loan's interest on it — a
   guaranteed return equal to the loan rate. The **effective after-tax loan rate** adjusts this
   for the Section 24(b) interest shield. The surplus is grown at that guaranteed rate to the
   horizon.
2. **Invest side (risky).** A 10,000-path Monte Carlo grows the surplus at the chosen asset's
   return/volatility, then applies capital-gains tax at the horizon, producing a full
   distribution of after-tax outcomes.
3. **Comparison.** Expected net worth, **probability investing beats prepaying**, the
   **breakeven return** that ties them, and a **CRRA risk-adjusted certainty-equivalent**.
4. **Hybrid split.** Evaluates every split from 100% prepay to 100% invest and reports the one
   that **maximises certainty-equivalent wealth**.
5. **Amortization.** Full schedule with and without prepayment — interest saved, tenure cut,
   EMI to the rupee.

---

## Tax rules modelled (FY 2025-26)

| Item | Rule |
|------|------|
| Section 24(b) | Self-occupied home-loan interest deductible up to **₹2,00,000/yr** — **old regime only**. Disabled under the new regime. |
| Equity LTCG (112A) | **12.5%** on gains above **₹1,25,000/yr** (holding ≥ 12 months). |
| Equity STCG (111A) | **20%** (holding < 12 months). |
| Debt / debt funds | Taxed at the investor's **slab** (post 01-Apr-2023 rules). |
| Hybrid funds | Treated as equity-oriented (≥ 65% equity) for tax. |

### Effective after-tax loan rate
`r_eff = nominal × (1 − avgShieldFraction × marginalRate)`, where `avgShieldFraction` is the
interest-weighted share of interest that falls under the ₹2L cap over the horizon (from the
no-prepay schedule). New regime / not claiming ⇒ `r_eff = nominal`.

---

## Key modelling choices (labelled assumptions)

- **Framing.** The decision is about the SURPLUS: prepay grows it at the guaranteed `r_eff`;
  invest grows it at the risky return. This matches the "breakeven required return" framing and
  keeps the prepay side genuinely risk-free.
- **Timing.** Monthly contributions at start-of-month (annuity-due); annual return draws with an
  exact monthly-SIP factor (so `vol = 0` reproduces the closed-form FV to the rupee).
- **CGT timing.** Applied once at the horizon on total gain over the cost basis; the ₹1.25L
  equity exemption is applied once at redemption (a simplification).
- **Hybrid scaling.** Investing a fraction *f* scales the pre-tax outcome linearly; CGT is
  recomputed on the scaled gain (the fixed ₹1.25L exemption does not scale).
- **CRRA certainty-equivalent.** γ = 0 → mean (risk-neutral); γ = 1 → log; γ > 1 penalises the
  downside. The optimal split maximises CE and is non-increasing in γ.
- **Prepayment penalty.** Reduces the deployed surplus (default 0% — RBI bars penalties on
  floating-rate home loans).
- **Seeded RNG** ⇒ reproducible; success probability is monotonic in the expected return.

---

## Validation (see test suite — 26 cases, 45 assertions)

- **EMI matches the standard reducing-balance formula to the rupee** (₹50L/9%/240mo = ₹44,986).
- Amortization: principal fully repaid; `totalPaid = principal + interest`.
- **`vol = 0` collapses to the deterministic after-tax FV** (exact).
- Probability investing beats prepaying is **monotonic in expected return** and within [0,1].
- CRRA: CE(γ=0) = mean; CE ≤ mean for γ > 0; CE non-increasing in γ.
- **Breakeven** return ties the deterministic after-tax invest value to the prepay value; higher
  loan rate ⇒ higher breakeven.
- **Hybrid** split is a corner (0/1) when risk-neutral and shifts toward prepay as risk aversion
  rises; new-regime has no shield; edge cases (surplus < EMI, penalty) behave correctly.

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/prepay-vs-invest.test.ts
```

---

## Privacy & compliance

- **No login, no paywall, no server calls.** All computation (incl. all 10,000 paths) runs in the
  browser; loan/income/tax inputs are never transmitted. Works offline after first load.
- **Educational estimate, not advice.** Outputs are scenarios/estimates, not predictions or a
  buy/sell recommendation (SEBI Investment Adviser Regulations). A visible disclaimer states this.

## Known limitations / TODO

- The post-payoff reinvestment of freed EMI is not modelled in the headline comparison (the prepay
  benefit is the guaranteed `r_eff` on the surplus); the amortization table shows the tangible
  tenure/interest impact separately.
- Per-instalment holding-period nuances for SIP CGT are simplified to a single redemption.
- Surcharge on very high incomes is offered as a slab option but not auto-derived.
- Asset returns are drawn from a normal distribution; fat tails / correlation are not modelled.
