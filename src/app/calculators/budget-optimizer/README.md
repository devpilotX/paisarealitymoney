# Smart Cash Flow & Budget Optimizer

A 100% client-side budgeting tool that goes beyond a static 50/30/20 split: it adapts the
needs/wants/savings mix to your income and city, finds the surplus to redirect, flags overspending,
sizes your emergency fund, and checks goal feasibility — with a deficit-recovery plan.

- **Tool page:** `/calculators/budget-optimizer`
- **Engine (pure functions):** `src/lib/budget-optimizer.ts`
- **Tests:** `tests/budget-optimizer.test.ts`
- **UI:** `BudgetOptimizerClient.tsx`

> **Rules / benchmarks last verified on: 2025-06-21.**

---

## What it computes

1. **After-tax income** — entered directly, or estimated from CTC (tax via the shared engine +
   ~12% EPF on 40% basic). Irregular earners are budgeted on a conservative 85% floor.
2. **Adaptive split** — needs/wants/savings that flexes with income tier and city tier and always
   sums to 100%.
3. **Surplus** — income − needs − wants (capacity to save), plus the extra freed by trimming
   overspends to benchmark.
4. **Overspend flags** — each category vs a benchmark share of income (housing benchmark by city).
5. **Emergency fund** — 4 / 6 / 9 months of expenses for stable / normal / unstable income; gap and
   months-to-fill.
6. **Goals** — required monthly contribution, feasibility vs surplus, and months-to-goal.
7. **Status + action plan** — deficit / tight / healthy / excellent, with a prioritised to-do list.

---

## Benchmarks (% of after-tax income)

| | Metro | Tier-2 | Tier-3 |
|--|--|--|--|
| Housing (rent) | 30% | 25% | 20% |

Groceries 10% · Utilities 5% · Transport 8% · Insurance 4% · EMIs 10% · Dining 6% ·
Entertainment 4% · Shopping 5% · Subscriptions 2% · Misc 5%.

### Adaptive split by monthly income
<₹40k → 60/25/15 · ₹40–75k → 55/27/18 · ₹75–150k → 50/30/20 · ₹150–300k → 45/30/25 · >₹300k → 40/28/32.
Metro shifts ~5 points from savings to needs; tier-3 the reverse. Result is clamped and renormalised
to 100%.

---

## Validation (see test suite — 24 cases, 59 assertions)

- **Adaptive split always sums to 100%**; needs falls and savings rises with income; metro > tier-3 needs.
- **Recommended allocations sum exactly to income**; no category is ever negative.
- Monthly surplus = income − needs − wants; overspend flags fire vs benchmark; **surplus found =
  sum of overspends**; housing benchmark scales with city tier.
- Emergency-fund target = expenses × months (by stability); months-to-fill uses the surplus.
- Goal required monthly = remaining / deadline; feasibility vs surplus with shortfall reported.
- Deficit detected when expenses > income (with recovery action); CTC → take-home is positive and
  below gross/12; irregular income floored to 85%.

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/budget-optimizer.test.ts
```

---

## Privacy & compliance

- **No login, no paywall, no server calls.** Everything runs in the browser; income and spend data
  are never transmitted. Works offline after first load.
- **Educational estimate, not advice.** Benchmarks are guidelines; a visible disclaimer states this.

## Known limitations / TODO

- Benchmarks are general heuristics, not personalised to family size or local cost of living.
- The CTC → take-home estimate is approximate (assumes EPF on 40% basic and a standard tax position).
- Goal feasibility compares each goal's required monthly against the whole surplus rather than
  solving a joint allocation across competing goals and the emergency fund.
