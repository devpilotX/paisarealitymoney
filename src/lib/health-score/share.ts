/**
 * Pure helpers for the public share card. No React/DB. Relative import for the ts-node harness.
 */
import { PILLAR_NAMES, PILLAR_LABEL, type PillarName } from '../score-config';

/** The user's strongest pillar (highest score; first wins on ties). */
export function topStrengthPillar(scores: Record<PillarName, number>): PillarName {
  let best: PillarName = PILLAR_NAMES[0]!;
  for (const n of PILLAR_NAMES) if ((scores[n] ?? 0) > (scores[best] ?? 0)) best = n;
  return best;
}

/** Strength label, e.g. "Money habits". */
export function strengthLabel(scores: Record<PillarName, number>): string {
  return PILLAR_LABEL[topStrengthPillar(scores)];
}

/** Prefilled share text. */
export function shareText(totalScore: number): string {
  return `My Money Health Score is ${totalScore} out of 900. What's yours?`;
}
