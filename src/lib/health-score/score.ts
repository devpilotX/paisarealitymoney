/**
 * Financial Health Score. pure scoring engine.
 * No React, no database, no network. Deterministic: same input -> same output.
 * Tax slabs / required-corpus are NEVER computed here; `requiredCorpus`, `actualTax` and
 * `optimalTax` are passed in from the Retirement / Salary / Multi-Year Tax engines.
 *
 * Educational information only - not financial advice. Every action is phrased as a next step.
 */

import {
  PILLAR_NAMES, WEIGHTS, BANDS, PILLAR_META,
  SAVINGS_ANCHORS, EMERGENCY_ANCHORS, DEBT_ANCHORS, RETIREMENT_ANCHORS,
  INVEST_RATE_ANCHORS, DIVERSIFICATION_ANCHORS, TERM_COVER_ANCHORS, TAX_ANCHORS,
  DEBT_PENALTY_CC_REVOLVING, DEBT_PENALTY_HIGH_RATE, HIGH_LOAN_RATE_THRESHOLD,
  CASH_IDLE_PENALTY, CASH_IDLE_THRESHOLD, HEALTH_COVER_FULL,
  HYGIENE_PENALTIES, CIBIL_THRESHOLD, AGE_SCALE_YEARS, CAREER_START_AGE,
  SCORE_MIN, SCORE_RANGE,
  type Anchor, type PillarName,
} from '../score-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoreInput {
  monthlyIncome: number;
  monthlyExpense: number;
  liquidSavings: number;
  monthlyDebtPayment: number;
  hasCcRevolving: boolean;
  loanMaxRate?: number;
  monthlyInvested: number;
  assetClasses: string[]; // 'equity','debt','gold','cash','realestate'
  termCover?: number;
  healthCover?: number;
  dependents: number;
  age: number;
  retirementAge: number;
  currentCorpus: number;
  requiredCorpus: number; // from the Retirement engine
  actualTax: number; // from the Salary/Tax engine
  optimalTax: number; // from the Salary/Tax engine
  tracksSpending: boolean;
  missedEmi6mo: boolean;
  cibil?: number;
  hasWrittenBudget: boolean;
}

export interface TopAction { label: string; link: string; pointsRecoverable: number }
export interface PillarResult { score: number; reason: string; topAction: TopAction }
export interface ScoreResult {
  totalScore: number;
  band: string;
  pillars: Record<PillarName, PillarResult>;
  topActions: TopAction[];
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

/** Clamp `v` into the inclusive range [lo, hi]. */
export function clamp(v: number, lo = 0, hi = 100): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Safe division; returns `fallback` when the denominator is 0 or non-finite. */
export function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  return denominator > 0 && Number.isFinite(denominator) ? numerator / denominator : fallback;
}

/**
 * Piecewise-linear interpolation over anchors sorted ascending by `x`, clamped to the
 * end anchors outside the domain and to [0,100] on output.
 */
export function interpolate(x: number, anchors: readonly Anchor[]): number {
  if (anchors.length === 0) return 0;
  const first = anchors[0]!;
  const last = anchors[anchors.length - 1]!;
  if (x <= first.x) return clamp(first.y);
  if (x >= last.x) return clamp(last.y);
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]!;
    const b = anchors[i + 1]!;
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return clamp(a.y + t * (b.y - a.y));
    }
  }
  return clamp(last.y);
}

/** Years worked, derived from age (career assumed to start at CAREER_START_AGE). */
export function yearsWorked(age: number): number {
  return Math.max(0, age - CAREER_START_AGE);
}

/**
 * Final-score points recoverable by taking a pillar from `score` to 100.
 * weightedAvg gain = weight*(100-score); each weightedAvg point = SCORE_RANGE/100 = 6 final points.
 */
export function pointsRecoverable(name: PillarName, score: number): number {
  return Math.round((SCORE_RANGE / 100) * WEIGHTS[name] * (100 - score));
}

function makeAction(name: PillarName, score: number): TopAction {
  const meta = PILLAR_META[name];
  return { label: meta.label, link: meta.link, pointsRecoverable: pointsRecoverable(name, score) };
}

function pillar(name: PillarName, score: number, reason: string): PillarResult {
  const s = clamp(Math.round(score));
  return { score: s, reason, topAction: makeAction(name, s) };
}

const pct = (v: number): string => `${Math.round(v * 100)}%`;

// ---------------------------------------------------------------------------
// Pillar scorers (each pure; each returns { score, reason, topAction })
// ---------------------------------------------------------------------------

/** 1. Savings rate. */
export function savingsPillar(i: ScoreInput): PillarResult {
  const s = safeDiv(i.monthlyIncome - i.monthlyExpense, i.monthlyIncome, 0);
  const score = interpolate(s, SAVINGS_ANCHORS);
  return pillar('savings', score, `You save about ${pct(s)} of your income. A 20%+ rate builds wealth steadily.`);
}

/** 2. Emergency fund in months of expenses. */
export function emergencyPillar(i: ScoreInput): PillarResult {
  if (i.monthlyExpense <= 0) {
    return pillar('emergency', 100, 'No recurring expenses recorded, so your liquid savings already cover them.');
  }
  const months = safeDiv(i.liquidSavings, i.monthlyExpense, 0);
  const score = interpolate(months, EMERGENCY_ANCHORS);
  return pillar('emergency', score, `Your liquid savings cover about ${months.toFixed(1)} months of expenses. Aim for 6.`);
}

/** 3. Debt-to-income, with revolving-credit and high-rate penalties. */
export function debtPillar(i: ScoreInput): PillarResult {
  if (i.monthlyDebtPayment <= 0 && !i.hasCcRevolving) {
    return pillar('debt', 100, 'You have no recurring debt payments - excellent.');
  }
  const dti = safeDiv(i.monthlyDebtPayment, i.monthlyIncome, 1); // no income + debt => worst case
  let score = interpolate(dti, DEBT_ANCHORS);
  if (i.hasCcRevolving) score -= DEBT_PENALTY_CC_REVOLVING;
  if (i.loanMaxRate !== undefined && i.loanMaxRate > HIGH_LOAN_RATE_THRESHOLD) score -= DEBT_PENALTY_HIGH_RATE;
  const reason = i.hasCcRevolving
    ? `EMIs are about ${pct(dti)} of income and you carry revolving credit-card debt, the costliest kind.`
    : `Your EMIs are about ${pct(dti)} of income. Below 30% is comfortable.`;
  return pillar('debt', clamp(score), reason);
}

/**
 * 4. Retirement progress, age-scaled.
 * Assumption: we DIVIDE the corpus ratio by the expected progress fraction
 * (min(1, yearsWorked/AGE_SCALE_YEARS)) - equivalent to lowering the target for younger
 * workers - so a just-started saver is not over-penalised. Conservative guard: with 0 years
 * worked the bar is only cleared by an already-positive corpus.
 */
export function retirementPillar(i: ScoreInput): PillarResult {
  if (i.requiredCorpus <= 0) {
    return pillar('retirement', 100, 'No additional corpus is required for your retirement target.');
  }
  const r = safeDiv(i.currentCorpus, i.requiredCorpus, 0);
  const scale = Math.min(1, safeDiv(yearsWorked(i.age), AGE_SCALE_YEARS, 0));
  const adjusted = scale <= 0 ? (r > 0 ? Number.POSITIVE_INFINITY : 0) : r / scale;
  const score = interpolate(adjusted, RETIREMENT_ANCHORS);
  return pillar('retirement', score, `You hold about ${pct(r)} of your required retirement corpus, judged against your years invested.`);
}

/** 5. Investing: average of contribution rate and diversification (minus idle-cash penalty). */
export function investingPillar(i: ScoreInput): PillarResult {
  const rate = safeDiv(i.monthlyInvested, i.monthlyIncome, 0);
  const rateScore = interpolate(rate, INVEST_RATE_ANCHORS);

  const count = i.assetClasses.length;
  let divScore = count < 1 ? 0 : interpolate(count, DIVERSIFICATION_ANCHORS);
  // Assumption: per-class amounts are not supplied, so "idle in cash" is proxied by
  // liquidSavings / (liquidSavings + currentCorpus) > CASH_IDLE_THRESHOLD.
  const cashFraction = safeDiv(i.liquidSavings, i.liquidSavings + i.currentCorpus, 0);
  if (cashFraction > CASH_IDLE_THRESHOLD) divScore -= CASH_IDLE_PENALTY;
  divScore = clamp(divScore);

  const score = (rateScore + divScore) / 2;
  return pillar('investing', score, `You invest about ${pct(rate)} of income across ${count} asset class${count === 1 ? '' : 'es'}.`);
}

/**
 * 6. Insurance: average of term-cover and health-cover halves.
 * If there are no dependents, the term half is neutralised and only the health half counts.
 */
export function insurancePillar(i: ScoreInput): PillarResult {
  const annualIncome = i.monthlyIncome * 12;
  const termMultiple = safeDiv(i.termCover ?? 0, annualIncome, 0);
  const termScore = interpolate(termMultiple, TERM_COVER_ANCHORS);

  const cover = i.healthCover ?? 0;
  const healthScore = cover <= 0 ? 0 : cover < HEALTH_COVER_FULL ? 50 : 100;

  const score = i.dependents === 0 ? healthScore : (termScore + healthScore) / 2;
  const reason = i.dependents === 0
    ? `With no dependents, health cover matters most - yours is ${cover <= 0 ? 'missing' : cover < HEALTH_COVER_FULL ? 'below Rs 5 lakh' : 'Rs 5 lakh or more'}.`
    : `Term cover is about ${termMultiple.toFixed(1)}x your annual income; health cover is ${cover <= 0 ? 'missing' : cover < HEALTH_COVER_FULL ? 'below Rs 5 lakh' : 'Rs 5 lakh+'}.`;
  return pillar('insurance', score, reason);
}

/** 7. Tax efficiency = optimalTax / actualTax (100 when no tax is due). */
export function taxPillar(i: ScoreInput): PillarResult {
  if (i.actualTax <= 0) {
    return pillar('tax', 100, 'You owe no tax, so there is nothing to optimise.');
  }
  const e = safeDiv(i.optimalTax, i.actualTax, 1);
  const score = interpolate(e, TAX_ANCHORS);
  return pillar('tax', score, `Optimising could bring your tax to about ${pct(e)} of what you currently pay.`);
}

/** 8. Hygiene: behavioural deductions from a base of 100. */
export function hygienePillar(i: ScoreInput): PillarResult {
  let score = 100;
  const flags: string[] = [];
  if (i.hasCcRevolving) { score -= HYGIENE_PENALTIES.ccRevolving; flags.push('revolving card debt'); }
  if (i.missedEmi6mo) { score -= HYGIENE_PENALTIES.missedEmi; flags.push('a missed EMI in 6 months'); }
  if (!i.tracksSpending) { score -= HYGIENE_PENALTIES.noTracking; flags.push('no spend tracking'); }
  // Assumption: an unknown CIBIL is not penalised (we cannot assert it is below the threshold).
  if (i.cibil !== undefined && i.cibil < CIBIL_THRESHOLD) { score -= HYGIENE_PENALTIES.lowCibil; flags.push('a sub-700 credit score'); }
  if (!i.hasWrittenBudget) { score -= HYGIENE_PENALTIES.noBudget; flags.push('no written budget'); }
  const reason = flags.length === 0 ? 'Strong money habits across the board.' : `Watch-outs: ${flags.join(', ')}.`;
  return pillar('hygiene', clamp(score), reason);
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** The band label for a final score (300..900). */
export function bandFor(totalScore: number): string {
  for (const b of BANDS) if (totalScore >= b.min && totalScore <= b.max) return b.label;
  return totalScore < BANDS[0]!.min ? BANDS[0]!.label : BANDS[BANDS.length - 1]!.label;
}

const SCORERS: Record<PillarName, (i: ScoreInput) => PillarResult> = {
  savings: savingsPillar, emergency: emergencyPillar, debt: debtPillar, retirement: retirementPillar,
  investing: investingPillar, insurance: insurancePillar, tax: taxPillar, hygiene: hygienePillar,
};

/**
 * Compute the Financial Health Score. Pure and deterministic.
 * @param input fully-supplied profile (required-corpus and tax figures come from other engines).
 * @returns total score (300..900), band, all eight pillar results, and the top-3 actions
 *          ranked by recoverable final-score points.
 */
export function computeScore(input: ScoreInput): ScoreResult {
  const pillars = {} as Record<PillarName, PillarResult>;
  let weightedAvg = 0;
  for (const name of PILLAR_NAMES) {
    const result = SCORERS[name](input);
    pillars[name] = result;
    weightedAvg += result.score * WEIGHTS[name];
  }
  const totalScore = Math.round(SCORE_MIN + (weightedAvg / 100) * SCORE_RANGE);
  const topActions = PILLAR_NAMES
    .map((n) => pillars[n].topAction)
    .sort((a, b) => b.pointsRecoverable - a.pointsRecoverable)
    .slice(0, 3);
  return { totalScore, band: bandFor(totalScore), pillars, topActions };
}
