/**
 * Financial Health Score. tunable configuration.
 * Weights, anchor tables, penalties, bands and per-pillar action metadata live here so the
 * scoring can be retuned without touching the logic in /lib/health-score. No React, no DB.
 */

/** The eight scored pillars. */
export type PillarName =
  | 'savings' | 'emergency' | 'debt' | 'retirement'
  | 'investing' | 'insurance' | 'tax' | 'hygiene';

/** Fixed iteration order for deterministic output. */
export const PILLAR_NAMES: readonly PillarName[] = [
  'savings', 'emergency', 'debt', 'retirement', 'investing', 'insurance', 'tax', 'hygiene',
];

/** Pillar weights. MUST sum to 1.0 (asserted in tests). */
export const WEIGHTS: Record<PillarName, number> = {
  savings: 0.15, emergency: 0.15, debt: 0.15, retirement: 0.15,
  investing: 0.15, insurance: 0.10, tax: 0.10, hygiene: 0.05,
};

/** A piecewise-linear interpolation anchor: at input `x`, the score is `y` (0..100). */
export interface Anchor { readonly x: number; readonly y: number }

/** Savings rate s = (income - expense) / income. */
export const SAVINGS_ANCHORS: readonly Anchor[] = [
  { x: 0, y: 0 }, { x: 0.10, y: 40 }, { x: 0.20, y: 70 }, { x: 0.30, y: 90 }, { x: 0.40, y: 100 },
];

/** Emergency fund in months = liquidSavings / monthlyExpense (capped above 6). */
export const EMERGENCY_ANCHORS: readonly Anchor[] = [
  { x: 0, y: 0 }, { x: 1, y: 25 }, { x: 3, y: 60 }, { x: 6, y: 100 },
];

/** Debt-to-income = monthlyDebtPayment / income (ascending x; score falls as DTI rises). */
export const DEBT_ANCHORS: readonly Anchor[] = [
  { x: 0.10, y: 100 }, { x: 0.20, y: 80 }, { x: 0.30, y: 55 }, { x: 0.40, y: 30 }, { x: 0.50, y: 0 },
];

/** Retirement progress = (age-scaled) currentCorpus / requiredCorpus. */
export const RETIREMENT_ANCHORS: readonly Anchor[] = [
  { x: 0.2, y: 0 }, { x: 0.5, y: 40 }, { x: 0.8, y: 70 }, { x: 1.0, y: 90 }, { x: 1.2, y: 100 },
];

/** Investing rate = monthlyInvested / income. */
export const INVEST_RATE_ANCHORS: readonly Anchor[] = [
  { x: 0, y: 0 }, { x: 0.10, y: 60 }, { x: 0.20, y: 100 },
];

/** Diversification by COUNT of asset classes (count 0 is special-cased to 0 in logic). */
export const DIVERSIFICATION_ANCHORS: readonly Anchor[] = [
  { x: 1, y: 30 }, { x: 2, y: 60 }, { x: 3, y: 85 }, { x: 4, y: 100 },
];

/** Term cover as a multiple of ANNUAL income. */
export const TERM_COVER_ANCHORS: readonly Anchor[] = [
  { x: 0, y: 0 }, { x: 5, y: 60 }, { x: 10, y: 100 },
];

/** Tax efficiency e = optimalTax / actualTax. */
export const TAX_ANCHORS: readonly Anchor[] = [
  { x: 0.5, y: 20 }, { x: 0.7, y: 50 }, { x: 0.85, y: 75 }, { x: 0.95, y: 100 },
];

/** Debt-pillar penalties (subtracted after interpolation, then floored at 0). */
export const DEBT_PENALTY_CC_REVOLVING = 30;
export const DEBT_PENALTY_HIGH_RATE = 15;
export const HIGH_LOAN_RATE_THRESHOLD = 18; // % p.a.

/** Investing-pillar "idle cash" penalty on the diversification half. */
export const CASH_IDLE_PENALTY = 20;
export const CASH_IDLE_THRESHOLD = 0.70; // fraction (cash) / (cash + invested corpus)

/** Insurance: health cover (₹) needed for full marks. */
export const HEALTH_COVER_FULL = 500000;

/** Hygiene penalties (start at 100, subtract, floor at 0). */
export const HYGIENE_PENALTIES = {
  ccRevolving: 30, missedEmi: 20, noTracking: 20, lowCibil: 15, noBudget: 10,
} as const;
export const CIBIL_THRESHOLD = 700;

/**
 * Age-scaling of the retirement target. A worker is expected to ramp to a full corpus over
 * `AGE_SCALE_YEARS`; `yearsWorked = max(0, age - CAREER_START_AGE)`.
 * CAREER_START_AGE = 25 matches the brief's "25-year-old just starting" example.
 */
export const AGE_SCALE_YEARS = 20;
export const CAREER_START_AGE = 25;

/** Final-score mapping: finalScore = SCORE_MIN + (weightedAvg/100) * SCORE_RANGE. */
export const SCORE_MIN = 300;
export const SCORE_RANGE = 600;

/** Score band. */
export interface Band { readonly min: number; readonly max: number; readonly label: string }
export const BANDS: readonly Band[] = [
  { min: 300, max: 549, label: 'At Risk' },
  { min: 550, max: 649, label: 'Needs Work' },
  { min: 650, max: 749, label: 'Fair' },
  { min: 750, max: 824, label: 'Good' },
  { min: 825, max: 900, label: 'Excellent' },
];

/** Human-friendly pillar labels (shared by UI + OG image). */
export const PILLAR_LABEL: Record<PillarName, string> = {
  savings: 'Savings rate', emergency: 'Emergency fund', debt: 'Debt', retirement: 'Retirement',
  investing: 'Investing', insurance: 'Insurance', tax: 'Tax efficiency', hygiene: 'Money habits',
};

/** Band -> colour (shared by gauge, OG image and public page). */
export const BAND_COLOR: Record<string, string> = {
  'At Risk': '#dc2626', 'Needs Work': '#ea580c', 'Fair': '#d97706', 'Good': '#16a34a', 'Excellent': '#15803d',
};

/** Educational next-step metadata per pillar (no product recommendations). */
export const PILLAR_META: Record<PillarName, { label: string; link: string }> = {
  savings: { label: 'See where your money goes and lift your savings rate', link: '/calculators/budget-optimizer' },
  emergency: { label: 'Plan an emergency fund of ~6 months of expenses', link: '/calculators/budget-optimizer' },
  debt: { label: 'Find the cheapest order to clear your loans', link: '/calculators/debt-optimizer' },
  retirement: { label: 'Check the corpus and SIP you need to retire', link: '/calculators/retirement-optimizer' },
  investing: { label: 'Explore a diversified, regular SIP plan', link: '/calculators/sip' },
  insurance: { label: 'Learn how much term and health cover fits your situation', link: '/calculators' },
  tax: { label: 'Compare tax regimes and plan deductions legally', link: '/calculators/lifecycle-tax-optimizer' },
  hygiene: { label: 'Build habits: track spending and keep a written budget', link: '/calculators/budget-optimizer' },
};
