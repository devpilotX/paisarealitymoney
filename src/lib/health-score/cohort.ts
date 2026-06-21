/**
 * Cohort keys and percentile maths for "you vs people like you". Pure; no React/DB.
 * Raw financials never appear here - only band keys and percentile numbers.
 * Relative imports so the ts-node test harness can load it.
 */
import type { PillarName } from '../score-config';

export type CityTier = 'metro' | 'tier1' | 'tier2' | 'tier3';
export interface Quartiles { p25: number; p50: number; p75: number }
export type PillarPercentiles = Record<PillarName, Quartiles>;

/** Age band: <25, 25-30, 31-40, 41-50, 51+. */
export function ageBand(age: number): string {
  if (age < 25) return '<25';
  if (age <= 30) return '25-30';
  if (age <= 40) return '31-40';
  if (age <= 50) return '41-50';
  return '51+';
}

/** Income band on ANNUAL income: <5L, 5-10L, 10-25L, 25L+. */
export function incomeBand(annualIncome: number): string {
  if (annualIncome < 500000) return '<5L';
  if (annualIncome < 1000000) return '5-10L';
  if (annualIncome < 2500000) return '10-25L';
  return '25L+';
}

/** Build the cohort key: 'age:<band>|city:<tier>|income:<band>'. */
export function cohortKey(age: number, tier: CityTier, annualIncome: number): string {
  return `age:${ageBand(age)}|city:${tier}|income:${incomeBand(annualIncome)}`;
}

const TIER_HUMAN: Record<CityTier, string> = { metro: 'metros', tier1: 'tier-1 cities', tier2: 'tier-2 cities', tier3: 'tier-3 towns' };

/** Human description of a cohort, e.g. "25-30 year-olds in metros earning 5-10L". */
export function cohortDescription(age: number, tier: CityTier, annualIncome: number): string {
  return `${ageBand(age)} year-olds in ${TIER_HUMAN[tier]} earning ${incomeBand(annualIncome)}`;
}

/**
 * Estimate the percentile (1..99) at which `value` sits, given the cohort's p25/p50/p75.
 * Piecewise-linear between the quartiles; linearly extrapolated (and clamped) at the edges.
 */
export function percentileRank(value: number, q: Quartiles): number {
  const { p25, p50, p75 } = q;
  if (p25 === p75) return 50; // degenerate cohort
  let pct: number;
  if (value <= p25) pct = 25 + (value - p25) * (25 / ((p50 - p25) || 1));
  else if (value >= p75) pct = 75 + (value - p75) * (25 / ((p75 - p50) || 1));
  else if (value <= p50) pct = 25 + ((value - p25) / ((p50 - p25) || 1)) * 25;
  else pct = 50 + ((value - p50) / ((p75 - p50) || 1)) * 25;
  return Math.round(Math.min(99, Math.max(1, pct)));
}

/** Educational one-liner: "Your savings rate beats 58% of 25-30 year-olds in metros ...". */
export function benchmarkSentence(metricLabel: string, beatsPct: number, cohortHuman: string): string {
  return `Your ${metricLabel} beats ${beatsPct}% of ${cohortHuman}.`;
}
