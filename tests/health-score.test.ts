/**
 * Financial Health Score — engine unit tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/health-score.test.ts
 */

import {
  computeScore, savingsPillar, emergencyPillar, debtPillar, retirementPillar,
  investingPillar, insurancePillar, taxPillar, hygienePillar,
  interpolate, clamp, safeDiv, yearsWorked, pointsRecoverable, bandFor,
  type ScoreInput,
} from '../src/lib/health-score/score';
import { WEIGHTS, PILLAR_NAMES, SAVINGS_ANCHORS } from '../src/lib/score-config';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

/** All-neutral base: savings 0, emergency 0, debt 0(no-debt->100), retirement 0, etc. */
function base(): ScoreInput {
  return {
    monthlyIncome: 100000, monthlyExpense: 100000, liquidSavings: 0, monthlyDebtPayment: 0,
    hasCcRevolving: false, monthlyInvested: 0, assetClasses: [], termCover: 0, healthCover: 0,
    dependents: 0, age: 45, retirementAge: 60, currentCorpus: 0, requiredCorpus: 100000,
    actualTax: 100000, optimalTax: 100000, tracksSpending: true, missedEmi6mo: false, hasWrittenBudget: true,
  };
}

// ---------------------------------------------------------------------------

test('1. helpers: clamp, safeDiv, interpolate, yearsWorked, pointsRecoverable', () => {
  assert(clamp(150) === 100 && clamp(-5) === 0 && clamp(50) === 50, 'clamp bounds');
  assert(safeDiv(10, 2) === 5 && safeDiv(10, 0, -1) === -1, 'safeDiv with fallback');
  assert(interpolate(0.15, SAVINGS_ANCHORS) === 55, 'interpolate mid-segment 0.15 -> 55');
  assert(yearsWorked(25) === 0 && yearsWorked(45) === 20 && yearsWorked(20) === 0, 'yearsWorked from age');
  assert(pointsRecoverable('savings', 50) === 45, 'pointsRecoverable = 6*0.15*50 = 45');
});

test('2. SAVINGS anchors + clamps', () => {
  const s = (exp: number): number => savingsPillar({ ...base(), monthlyIncome: 100000, monthlyExpense: exp }).score;
  assert(s(100000) === 0, 's=0 -> 0');
  assert(s(90000) === 40, 's=0.10 -> 40');
  assert(s(80000) === 70, 's=0.20 -> 70');
  assert(s(70000) === 90, 's=0.30 -> 90');
  assert(s(60000) === 100, 's=0.40 -> 100');
  assert(s(120000) === 0, 'negative savings clamps to 0');
  assert(s(40000) === 100, 's=0.60 clamps to 100');
});

test('3. EMERGENCY anchors + cap', () => {
  const e = (liq: number): number => emergencyPillar({ ...base(), monthlyExpense: 10000, liquidSavings: liq }).score;
  assert(e(0) === 0 && e(10000) === 25 && e(30000) === 60 && e(60000) === 100, 'months 0/1/3/6 -> 0/25/60/100');
  assert(e(120000) === 100, '12 months caps at 100');
});

test('4. DEBT anchors, no-debt, penalties, floor', () => {
  const d = (pay: number): number => debtPillar({ ...base(), monthlyIncome: 100000, monthlyDebtPayment: pay }).score;
  assert(d(10000) === 100 && d(20000) === 80 && d(30000) === 55 && d(40000) === 30 && d(50000) === 0, 'DTI .1/.2/.3/.4/.5 -> 100/80/55/30/0');
  assert(debtPillar({ ...base(), monthlyDebtPayment: 0 }).score === 100, 'no debt -> 100');
  assert(debtPillar({ ...base(), monthlyIncome: 100000, monthlyDebtPayment: 20000, hasCcRevolving: true }).score === 50, 'cc revolving -30 (80->50)');
  assert(debtPillar({ ...base(), monthlyIncome: 100000, monthlyDebtPayment: 20000, hasCcRevolving: true, loanMaxRate: 20 }).score === 35, 'high-rate -15 (80->35)');
  assert(debtPillar({ ...base(), monthlyIncome: 100000, monthlyDebtPayment: 50000, hasCcRevolving: true }).score === 0, 'floors at 0');
});

test('5. RETIREMENT anchors + age-scaling', () => {
  const r = (cur: number): number => retirementPillar({ ...base(), age: 45, requiredCorpus: 100000, currentCorpus: cur }).score;
  assert(r(20000) === 0 && r(50000) === 40 && r(80000) === 70 && r(100000) === 90 && r(120000) === 100, 'ratio .2/.5/.8/1.0/1.2 (scale 1)');
  assert(retirementPillar({ ...base(), requiredCorpus: 0 }).score === 100, 'no required corpus -> 100');
  // age 35 -> scale 0.5 -> r 0.5 becomes adjusted 1.0 -> 90 (young not over-penalised)
  assert(retirementPillar({ ...base(), age: 35, requiredCorpus: 100000, currentCorpus: 50000 }).score === 90, 'age-scale lifts a young saver');
});

test('6. INVESTING rate-half, diversification-half, cash-idle penalty', () => {
  const noCash = { ...base(), liquidSavings: 0, currentCorpus: 100000 };
  assert(investingPillar({ ...noCash, monthlyIncome: 100000, monthlyInvested: 0, assetClasses: [] }).score === 0, 'rate 0 + 0 classes -> 0');
  assert(investingPillar({ ...noCash, monthlyIncome: 100000, monthlyInvested: 10000, assetClasses: ['equity', 'gold'] }).score === 60, 'rate .10(60) + 2 classes(60) -> 60');
  assert(investingPillar({ ...noCash, monthlyIncome: 100000, monthlyInvested: 20000, assetClasses: ['equity', 'gold', 'debt', 'cash'] }).score === 100, 'rate .20(100) + 4 classes(100) -> 100');
  // cash idle: liquid 80k / (80k + 20k) = 0.8 > 0.7 -> div -20; rate .10(60), 2 classes(60-20=40) -> avg 50
  assert(investingPillar({ ...base(), monthlyIncome: 100000, monthlyInvested: 10000, assetClasses: ['equity', 'gold'], liquidSavings: 80000, currentCorpus: 20000 }).score === 50, 'cash-idle penalty applies');
});

test('7. INSURANCE halves + dependents reweight', () => {
  const i2 = { ...base(), monthlyIncome: 100000, dependents: 2 }; // annual income 1.2M
  assert(insurancePillar({ ...i2, termCover: 12000000, healthCover: 500000 }).score === 100, '10x term + 5L health -> 100');
  assert(insurancePillar({ ...i2, termCover: 0, healthCover: 0 }).score === 0, 'no cover -> 0');
  assert(insurancePillar({ ...i2, termCover: 6000000, healthCover: 300000 }).score === 55, '5x term(60) + <5L health(50) -> 55');
  // no dependents -> health half only (term ignored)
  assert(insurancePillar({ ...base(), monthlyIncome: 100000, dependents: 0, termCover: 0, healthCover: 300000 }).score === 50, 'dependents 0 -> health-only 50');
});

test('8. TAX anchors + zero-tax', () => {
  const t = (opt: number): number => taxPillar({ ...base(), actualTax: 100000, optimalTax: opt }).score;
  assert(t(50000) === 20 && t(70000) === 50 && t(85000) === 75 && t(95000) === 100, 'e .5/.7/.85/.95 -> 20/50/75/100');
  assert(taxPillar({ ...base(), actualTax: 0 }).score === 100, 'no tax due -> 100');
});

test('9. HYGIENE base + each penalty + floor + unknown cibil', () => {
  assert(hygienePillar(base()).score === 100, 'all-good -> 100');
  assert(hygienePillar({ ...base(), hasCcRevolving: true }).score === 70, 'cc -30');
  assert(hygienePillar({ ...base(), missedEmi6mo: true }).score === 80, 'missed EMI -20');
  assert(hygienePillar({ ...base(), tracksSpending: false }).score === 80, 'no tracking -20');
  assert(hygienePillar({ ...base(), cibil: 650 }).score === 85, 'low cibil -15');
  assert(hygienePillar({ ...base(), hasWrittenBudget: false }).score === 90, 'no budget -10');
  assert(hygienePillar({ ...base(), cibil: undefined }).score === 100, 'unknown cibil not penalised');
  assert(hygienePillar({ ...base(), hasCcRevolving: true, missedEmi6mo: true, tracksSpending: false, cibil: 600, hasWrittenBudget: false }).score === 5, 'all penalties -> 5 (floored sum)');
});

test('10. WEIGHTS sum to exactly 1.0', () => {
  const sum = PILLAR_NAMES.reduce((s, n) => s + WEIGHTS[n], 0);
  assert(sum === 1, `weights sum = ${sum}`);
});

test('11. bandFor boundaries', () => {
  assert(bandFor(549) === 'At Risk' && bandFor(550) === 'Needs Work', '549/550 boundary');
  assert(bandFor(649) === 'Needs Work' && bandFor(650) === 'Fair', '649/650 boundary');
  assert(bandFor(824) === 'Good' && bandFor(825) === 'Excellent', '824/825 boundary');
  assert(bandFor(300) === 'At Risk' && bandFor(900) === 'Excellent', 'endpoints');
});

test('12. finalScore monotonic on unambiguously-positive inputs', () => {
  const mid: ScoreInput = {
    ...base(), monthlyExpense: 70000, liquidSavings: 100000, monthlyDebtPayment: 20000,
    monthlyInvested: 5000, assetClasses: ['equity'], termCover: 2000000, healthCover: 200000,
    dependents: 2, requiredCorpus: 1000000, currentCorpus: 300000, actualTax: 100000, optimalTax: 80000,
  };
  const t0 = computeScore(mid).totalScore;
  let mono = true;
  // monthlyInvested up
  if (computeScore({ ...mid, monthlyInvested: 15000 }).totalScore < t0) mono = false;
  // currentCorpus up
  if (computeScore({ ...mid, currentCorpus: 600000 }).totalScore < t0) mono = false;
  // termCover up
  if (computeScore({ ...mid, termCover: 6000000 }).totalScore < t0) mono = false;
  // healthCover up
  if (computeScore({ ...mid, healthCover: 600000 }).totalScore < t0) mono = false;
  // add an asset class
  if (computeScore({ ...mid, assetClasses: ['equity', 'gold'] }).totalScore < t0) mono = false;
  assert(mono, 'raising any positive input never lowers the total');
});

test('13. worked example reproduces ~737', () => {
  const i: ScoreInput = {
    ...base(),
    monthlyIncome: 60000, monthlyExpense: 45000, liquidSavings: 90000, monthlyDebtPayment: 12000,
    hasCcRevolving: false, monthlyInvested: 6000, assetClasses: ['equity', 'gold'], termCover: 0,
    healthCover: 500000, dependents: 0, age: 45, retirementAge: 60, currentCorpus: 66000,
    requiredCorpus: 100000, actualTax: 100000, optimalTax: 95000, tracksSpending: true, hasWrittenBudget: true,
  };
  const total = computeScore(i).totalScore;
  assert(total >= 735 && total <= 739, `worked example total = ${total} (~737)`);
});

test('14. computeScore bounds, band consistency, top-3 actions', () => {
  const r = computeScore(base());
  assert(r.totalScore >= 300 && r.totalScore <= 900, `total ${r.totalScore} in [300,900]`);
  assert(r.band === bandFor(r.totalScore), 'band matches total');
  assert(r.topActions.length <= 3, 'top actions capped at 3');
  for (let k = 1; k < r.topActions.length; k++) {
    assert(r.topActions[k - 1]!.pointsRecoverable >= r.topActions[k]!.pointsRecoverable, 'actions sorted desc by recoverable');
  }
  // all-max -> 900 Excellent
  const max: ScoreInput = {
    monthlyIncome: 100000, monthlyExpense: 50000, liquidSavings: 300000, monthlyDebtPayment: 0,
    hasCcRevolving: false, monthlyInvested: 20000, assetClasses: ['equity', 'debt', 'gold', 'cash'],
    termCover: 12000000, healthCover: 500000, dependents: 2, age: 50, retirementAge: 60,
    currentCorpus: 2000000, requiredCorpus: 100000, actualTax: 100000, optimalTax: 100000,
    tracksSpending: true, missedEmi6mo: false, cibil: 800, hasWrittenBudget: true,
  };
  assert(computeScore(max).totalScore === 900 && computeScore(max).band === 'Excellent', 'all-max -> 900 Excellent');
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
