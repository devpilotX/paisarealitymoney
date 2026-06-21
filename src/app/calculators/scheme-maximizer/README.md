# Government Scheme Benefit Maximizer

A 100% client-side tool that finds the central government schemes a user is eligible for, **quantifies
the total rupee benefit per year**, resolves overlaps into the optimal combination, and shows how to
claim each. It is the advanced, quantified upgrade of the DB-backed scheme finder at `/schemes`
(which still powers the listing and SEO pages).

- **Tool page:** `/calculators/scheme-maximizer`
- **Engine + dataset (pure functions):** `src/lib/scheme-maximizer.ts`
- **Tests:** `tests/scheme-maximizer.test.ts`
- **UI:** `SchemeMaximizerClient.tsx`

> **Dataset version: 2025-06-21.** Each scheme also carries its own `lastVerified` date.

---

## Why this is more than a finder

| | `/schemes` finder (DB) | This Maximizer |
|--|--|--|
| Eligibility | match score | structured predicates (any/all/threshold) |
| ₹ benefit | `Σ benefit_amount_max` (mixes a ₹10L loan cap, ₹5L cover, ₹6k cash) | per-scheme **quantified annual ₹** on a consistent basis |
| Overlaps | none | **max-weight independent set** conflict resolution |
| Near-misses | none | "change one thing" diagnostics |
| Data | MySQL (needs env) | bundled, versioned, validator-checked |

---

## Dataset schema (per scheme)

`id, name, category, level, benefitType, benefitKind ('recurring'|'one-time'|'facilitation'),
predicates {minAge,maxAge,gender,maxIncome,occupations,categories,area,requiresBPL,
requiresDisability,requiresLandholding,requiresGirlChildUnder10,requiresWidow},
quantify(profile)→₹, valuationNote, howToApply, applyLink, source, lastVerified, conflictsWith[]`

A `validateScheme()` function (unit-tested over the whole dataset) enforces that every scheme has a
name, a `quantify` function, a source, a `lastVerified` date, a valid `applyLink` and a valuation note.

## Quantification methodology (the honest part)

- **Cash / pension / subsidy / scholarship:** face annual value (e.g. PM-KISAN ₹6,000/yr).
- **Insurance:** equivalent private premium you'd otherwise pay (PMSBY ≈ ₹500/yr, not the ₹2L cover).
- **Interest-subvention:** the interest you save (KCC ≈ ₹9,000/yr on ₹3L).
- **Loans (MUDRA, Stand-Up India):** **₹0** — the principal is repaid, so it is access, not benefit.
- **One-time** benefits (PMAY subsidy, toolkit, maternity cash) are reported separately from the
  recurring annual total.

## Conflict resolution

Conflicts are pairwise (`conflictsWith`). The optimal set is the **maximum-weight independent set**
of the eligible-scheme conflict graph (exact recursive search; profiles are eligible for a small
number of schemes). Real co-occurring conflict: the three NSAP pensions (old-age / widow /
disability) are mutually exclusive, so only the highest-value one is counted.

---

## Validation (see test suite — 26 cases, 50 assertions)

- **Schema validator passes for every bundled scheme**; all ids unique; every `quantify()` returns a
  finite, non-negative ₹.
- Predicate eligibility verified per representative scheme (PM-KISAN farmer+land, Ayushman income
  ceiling, gender/age/BPL/disability/widow predicates).
- Benefit math (PM-KISAN ₹6,000; age-based pension amounts; loans = ₹0).
- **Conflict optimizer beats greedy** on a crafted case (A=₹50 conflicts with B=₹30 & C=₹30 → MWIS
  picks B+C=₹60 > greedy's ₹50); chain conflicts handled; NSAP pensions mutually exclusive.
- Near-miss only when exactly one predicate fails; totals exclude one-time & facilitation; enrolled
  schemes removed from the "new benefit" total; eligible list ranked by ₹.

Run the tests:

```bash
npx ts-node --project tsconfig.scripts.json tests/scheme-maximizer.test.ts
```

---

## Privacy & compliance

- **No login, no server calls.** Eligibility runs in the browser against the bundled dataset; profile
  data is never transmitted. Works offline after load.
- **Educational estimate, not legal advice.** Final eligibility and amounts are the implementing
  authority's call; every card links to the official source with a "last verified" date.

## Maintenance / TODO

- Add `Scheme` objects to the `SCHEMES` array; the validator + tests guard correctness.
- Highest-impact **central** schemes are covered first; **state** schemes are the next expansion
  (add `level: 'state'` + `predicates` gated on `state`, and surface "state not yet covered").
- Insurance/subvention valuations are deliberately conservative; revisit against official
  notifications periodically and bump `lastVerified` + `DATASET_VERSION`.
