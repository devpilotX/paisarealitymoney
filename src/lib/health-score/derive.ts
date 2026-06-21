/**
 * Derive the engine-fed ScoreInput fields (requiredCorpus, actualTax, optimalTax) from a compact
 * onboarding form, REUSING the Retirement and Multi-Year Tax engines. Pure; no React/DB.
 * Uses the engines' cheap, deterministic exports so the form can recompute live on every change.
 * Relative imports for the ts-node harness.
 */
import { closedFormRequiredCorpus } from '../retirement-optimizer';
import { newRegimeTax, oldRegimeTax, type OldDeductions } from '../lifecycle-tax-optimizer';
import type { ScoreInput } from './score';

/** The onboarding form = ScoreInput without the three engine-derived fields, plus tax regime. */
export type OnboardingForm = Omit<ScoreInput, 'requiredCorpus' | 'actualTax' | 'optimalTax'> & {
  taxRegime: 'old' | 'new';
};

// Assumptions (conservative, documented): retirement to age 85, 6% inflation, 7% post-retirement
// return. We use the Retirement engine's closed-form PV (not its 10k Monte Carlo) so the form
// stays instant; the heavy simulation lives in the Retirement Optimizer tool itself.
const END_AGE = 85;
const INFLATION_PCT = 6;
const POST_RETIREMENT_RETURN_PCT = 7;

/** Required retirement corpus (today's-rupee target), via the Retirement engine's closed form. */
export function deriveRequiredCorpus(form: OnboardingForm): number {
  const yearsToRet = Math.max(0, form.retirementAge - form.age);
  const retYears = Math.max(1, END_AGE - form.retirementAge);
  const firstYearWithdrawal = form.monthlyExpense * 12 * Math.pow(1 + INFLATION_PCT / 100, yearsToRet);
  return Math.round(closedFormRequiredCorpus(firstYearWithdrawal, INFLATION_PCT, POST_RETIREMENT_RETURN_PCT, retYears));
}

/** Actual vs optimal annual tax via the Multi-Year Tax engine (never re-implements slabs). */
export function deriveTaxes(form: OnboardingForm): { actualTax: number; optimalTax: number } {
  const annualIncome = form.monthlyIncome * 12;
  const newTax = newRegimeTax(annualIncome, 0);
  // Assumption: optimal old-regime case assumes a typical Rs 1.5L 80C + Rs 25k 80D claim.
  const ded: OldDeductions = { ded80C: 150000, ded80CCD1B: 0, ded80D: 25000, hraExemption: 0, homeLoanInterest: 0, otherExemptAllowances: 0 };
  const oldTax = oldRegimeTax(annualIncome, form.age, ded, 0);
  const actualTax = form.taxRegime === 'old' ? oldTax : newTax;
  return { actualTax, optimalTax: Math.min(oldTax, newTax) };
}

/** Build the full ScoreInput from the onboarding form. */
export function deriveScoreInput(form: OnboardingForm): ScoreInput {
  const { taxRegime: _regime, ...rest } = form;
  void _regime;
  const requiredCorpus = deriveRequiredCorpus(form);
  const { actualTax, optimalTax } = deriveTaxes(form);
  return { ...rest, requiredCorpus, actualTax, optimalTax };
}
