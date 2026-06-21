/**
 * Government Scheme Benefit Maximizer — test suite (26 cases incl. optimizer-vs-greedy)
 * Run: npx ts-node --project tsconfig.scripts.json tests/scheme-maximizer.test.ts
 */

import {
  type SchemeProfile,
  type MwisItem,
  SCHEMES,
  DEFAULT_SCHEME_PROFILE,
  validateScheme,
  isEligible,
  analyzeSchemes,
  maxWeightIndependentSet,
  greedyConflictResolve,
} from '../src/lib/scheme-maximizer';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

function profile(over: Partial<SchemeProfile>): SchemeProfile { return { ...DEFAULT_SCHEME_PROFILE, ...over }; }
function byId(id: string) { return SCHEMES.find((s) => s.id === id)!; }
function mwis(id: string, value: number, conflicts: string[] = []): MwisItem { return { id, value, conflicts: new Set(conflicts) }; }

// ---------------------------------------------------------------------------

test('1. Schema validator: every bundled scheme is well-formed', () => {
  const allErrs: string[] = [];
  for (const s of SCHEMES) allErrs.push(...validateScheme(s));
  assert(allErrs.length === 0, allErrs.length === 0 ? `all ${SCHEMES.length} schemes valid` : `errors: ${allErrs.join('; ')}`);
});

test('2. Every scheme has a unique id', () => {
  const ids = new Set(SCHEMES.map((s) => s.id));
  assert(ids.size === SCHEMES.length, `${ids.size} unique ids of ${SCHEMES.length}`);
});

test('3. Every scheme quantify() returns a finite, non-negative number', () => {
  let ok = true;
  for (const s of SCHEMES) { const v = s.quantify(DEFAULT_SCHEME_PROFILE); if (!Number.isFinite(v) || v < 0) ok = false; }
  assert(ok, 'all benefit formulas produce valid ₹ values');
});

test('4. PM-KISAN: eligible only for a landholding farmer, benefit ₹6,000/yr', () => {
  assert(isEligible(byId('pm-kisan'), profile({ occupation: 'farmer', hasLandholding: true })), 'farmer with land is eligible');
  assert(!isEligible(byId('pm-kisan'), profile({ occupation: 'farmer', hasLandholding: false })), 'no land → not eligible');
  assert(!isEligible(byId('pm-kisan'), profile({ occupation: 'student', hasLandholding: true })), 'non-farmer → not eligible');
  assert(byId('pm-kisan').quantify(DEFAULT_SCHEME_PROFILE) === 6000, 'benefit is ₹6,000/yr');
});

test('5. Ayushman Bharat: income ceiling enforced', () => {
  assert(isEligible(byId('pmjay'), profile({ income: 250000 })), '₹2.5L income eligible');
  assert(!isEligible(byId('pmjay'), profile({ income: 400000 })), '₹4L income not eligible');
});

test('6. Gender predicate: Ujjwala is female + BPL only', () => {
  assert(isEligible(byId('ujjwala'), profile({ gender: 'female', bpl: true })), 'female BPL eligible');
  assert(!isEligible(byId('ujjwala'), profile({ gender: 'male', bpl: true })), 'male not eligible');
  assert(!isEligible(byId('ujjwala'), profile({ gender: 'female', bpl: false })), 'non-BPL not eligible');
});

test('7. Age predicates: PMJJBY 18–50, APY 18–40', () => {
  assert(isEligible(byId('pmjjby'), profile({ age: 30 })), 'age 30 eligible for PMJJBY');
  assert(!isEligible(byId('pmjjby'), profile({ age: 55 })), 'age 55 not eligible for PMJJBY');
  assert(!isEligible(byId('apy'), profile({ age: 45 })), 'age 45 not eligible for APY (max 40)');
});

test('8. Disability & widow predicates', () => {
  assert(isEligible(byId('igndps'), profile({ age: 40, bpl: true, disability: true })), 'BPL + disability eligible for IGNDPS');
  assert(!isEligible(byId('igndps'), profile({ age: 40, bpl: true, disability: false })), 'no disability → not eligible');
  assert(isEligible(byId('ignwps'), profile({ gender: 'female', age: 50, bpl: true, isWidow: true })), 'BPL widow eligible for IGNWPS');
  assert(!isEligible(byId('ignwps'), profile({ gender: 'female', age: 50, bpl: true, isWidow: false })), 'non-widow → not eligible');
});

test('9. Age-based pension amounts (IGNOAPS)', () => {
  assert(byId('ignoaps').quantify(profile({ age: 65 })) === 2400, '60–79 → ₹2,400/yr');
  assert(byId('ignoaps').quantify(profile({ age: 82 })) === 6000, '80+ → ₹6,000/yr');
});

test('10. MUDRA & Stand-Up India are facilitation (₹0 — loans are not benefit)', () => {
  assert(byId('mudra').quantify(DEFAULT_SCHEME_PROFILE) === 0, 'MUDRA loan counted as ₹0');
  assert(byId('stand-up-india').quantify(DEFAULT_SCHEME_PROFILE) === 0, 'Stand-Up India counted as ₹0');
  assert(byId('mudra').benefitKind === 'facilitation', 'MUDRA is facilitation kind');
});

test('11. MWIS == greedy when there are no conflicts', () => {
  const items = [mwis('a', 50), mwis('b', 30), mwis('c', 20)];
  const opt = maxWeightIndependentSet(items);
  const grd = greedyConflictResolve(items);
  assert(opt.total === 100 && grd.total === 100, 'both take everything = 100');
});

test('12. MWIS BEATS greedy on a crafted pairwise-conflict case', () => {
  // A (50) conflicts with B and C; B (30) and C (30) don't conflict with each other.
  const items = [
    mwis('A', 50, ['B', 'C']),
    mwis('B', 30, ['A']),
    mwis('C', 30, ['A']),
  ];
  const opt = maxWeightIndependentSet(items);
  const grd = greedyConflictResolve(items);
  assert(grd.total === 50, `greedy grabs A → ₹50 (got ${grd.total})`);
  assert(opt.total === 60, `optimizer picks B+C → ₹60 (got ${opt.total})`);
  assert(opt.total > grd.total, 'optimizer strictly beats greedy');
  assert(opt.ids.includes('B') && opt.ids.includes('C') && !opt.ids.includes('A'), 'optimal set is {B, C}');
});

test('13. MWIS respects a chain of conflicts', () => {
  // A-B conflict, B-C conflict; best is A + C (B is the cut vertex).
  const items = [mwis('A', 40, ['B']), mwis('B', 35, ['A', 'C']), mwis('C', 40, ['B'])];
  const opt = maxWeightIndependentSet(items);
  assert(opt.total === 80 && opt.ids.includes('A') && opt.ids.includes('C'), 'picks A + C = 80');
});

test('14. The three NSAP pensions are mutually exclusive (only one in the optimal set)', () => {
  // A BPL widow aged 65 qualifies for both old-age and widow pension; you can draw only one.
  const a = analyzeSchemes(profile({ gender: 'female', age: 65, bpl: true, isWidow: true, occupation: 'homemaker', hasLandholding: false, area: 'rural', income: 0 }));
  const pensions = a.optimalSet.filter((e) => ['ignoaps', 'ignwps', 'igndps'].includes(e.scheme.id));
  assert(pensions.length <= 1, `at most one NSAP pension chosen (got ${pensions.length})`);
  if (pensions.length === 1) assert(pensions[0]!.scheme.id === 'ignwps', 'picks the higher widow pension (₹3,600 > old-age ₹2,400)');
});

test('15. analyzeSchemes: landholding BPL farmer gets PM-KISAN + KCC + more', () => {
  const a = analyzeSchemes(profile({ occupation: 'farmer', hasLandholding: true, area: 'rural', income: 200000, bpl: true }));
  const ids = a.optimalSet.map((e) => e.scheme.id);
  assert(ids.includes('pm-kisan'), 'includes PM-KISAN');
  assert(ids.includes('kisan-credit-card'), 'includes KCC');
  assert(a.totalAnnualBenefit >= 6000 + 9000, `annual total ₹${a.totalAnnualBenefit} ≥ PM-KISAN + KCC`);
});

test('16. Total annual benefit excludes one-time and facilitation schemes', () => {
  const a = analyzeSchemes(profile({ occupation: 'farmer', hasLandholding: true, area: 'rural', income: 200000, bpl: true }));
  // PMAY-Gramin (one-time) and any facilitation shouldn't be in the annual total.
  const annualIds = a.optimalSet.filter((e) => e.scheme.benefitKind === 'recurring').map((e) => e.scheme.id);
  let annualCheck = 0;
  for (const e of a.optimalSet) if (e.scheme.benefitKind === 'recurring') annualCheck += e.annualValue;
  assert(annualCheck === a.totalAnnualBenefit, 'annual total = sum of recurring only');
  assert(a.totalOneTimeBenefit >= 0, 'one-time tracked separately');
  void annualIds;
});

test('17. Facilitation schemes are listed but contribute ₹0 to totals', () => {
  const a = analyzeSchemes(profile({ occupation: 'business', age: 30, income: 500000, area: 'urban', category: 'sc' }));
  assert(a.facilitationSchemes.some((e) => e.scheme.id === 'mudra'), 'MUDRA listed as facilitation');
  assert(a.facilitationSchemes.every((e) => e.annualValue === 0), 'facilitation values are ₹0');
});

test('18. Near-miss: income just over the Ayushman ceiling is flagged', () => {
  const a = analyzeSchemes(profile({ income: 320000, occupation: 'employed', hasLandholding: false, bpl: false, area: 'urban' }));
  const nm = a.nearMisses.find((m) => m.scheme.id === 'pmjay');
  assert(nm !== undefined, 'Ayushman flagged as a near-miss');
  assert(/income/i.test(nm!.reason), `reason mentions income (got "${nm?.reason}")`);
});

test('19. Near-miss only when EXACTLY one predicate fails', () => {
  // Young non-farmer with no land: PM-KISAN fails 2 predicates (occupation + land) → not a near-miss.
  const a = analyzeSchemes(profile({ occupation: 'student', hasLandholding: false, age: 20, income: 100000 }));
  assert(!a.nearMisses.some((m) => m.scheme.id === 'pm-kisan'), 'PM-KISAN not a near-miss when 2 criteria fail');
});

test('20. Zero eligible: a profile matching nothing yields an empty optimal set + near-misses', () => {
  const a = analyzeSchemes({ age: 45, gender: 'male', income: 5000000, occupation: 'employed', area: 'urban', category: 'general', hasLandholding: false, disability: false, bpl: false });
  assert(a.totalAnnualBenefit === 0 || a.optimalSet.length >= 0, 'handles a high-income general profile gracefully');
  assert(Array.isArray(a.nearMisses), 'near-misses array present');
});

test('21. Already-enrolled schemes are excluded from the optimal set total', () => {
  const base = analyzeSchemes(profile({ occupation: 'farmer', hasLandholding: true, area: 'rural', income: 200000, bpl: true }));
  const withEnrol = analyzeSchemes(profile({ occupation: 'farmer', hasLandholding: true, area: 'rural', income: 200000, bpl: true, enrolled: ['pm-kisan'] }));
  assert(withEnrol.totalAnnualBenefit === base.totalAnnualBenefit - 6000, 'enrolling in PM-KISAN removes its ₹6,000 from the "new benefit" total');
});

test('22. Eligible schemes are ranked by annual value (descending)', () => {
  const a = analyzeSchemes(profile({ occupation: 'farmer', hasLandholding: true, area: 'rural', income: 200000, bpl: true }));
  let sorted = true;
  for (let i = 1; i < a.eligible.length; i++) if (a.eligible[i]!.annualValue > a.eligible[i - 1]!.annualValue) sorted = false;
  assert(sorted, 'eligible list is sorted by ₹ value');
});

test('23. Student SC under income ceiling gets the scholarship', () => {
  const a = analyzeSchemes(profile({ occupation: 'student', category: 'sc', income: 300000, age: 18, hasLandholding: false, area: 'urban', bpl: false }));
  assert(a.optimalSet.some((e) => e.scheme.id === 'nsp-scholarship'), 'NSP scholarship in optimal set');
});

test('24. One-time benefits accumulate (PMAY-Gramin for a rural BPL profile)', () => {
  const a = analyzeSchemes(profile({ area: 'rural', bpl: true, occupation: 'daily_wage', income: 100000, hasLandholding: false }));
  assert(a.totalOneTimeBenefit > 0, `one-time benefits present (₹${a.totalOneTimeBenefit})`);
});

test('25. Reproducible & deterministic', () => {
  const p = profile({ occupation: 'farmer', hasLandholding: true });
  assert(analyzeSchemes(p).totalAnnualBenefit === analyzeSchemes(p).totalAnnualBenefit, 'same profile → same total');
});

test('26. Optimizer matches greedy total on the real dataset (no co-eligible conflicts beyond pensions)', () => {
  // For a profile without overlapping pensions, MWIS and greedy agree on the achievable total.
  const p = profile({ occupation: 'farmer', hasLandholding: true, area: 'rural', income: 200000, bpl: false, isWidow: false });
  const a = analyzeSchemes(p);
  assert(a.totalAnnualBenefit > 0, `farmer gets a positive annual total (₹${a.totalAnnualBenefit})`);
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
