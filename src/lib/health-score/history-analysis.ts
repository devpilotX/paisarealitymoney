/**
 * Pure analysis of a user's score history (delta, pillar trends, band crossings).
 * No React, no DB. Config import only (band ordering). Relative import for the ts-node harness.
 */
import { BANDS, type PillarName } from '../score-config';

/** One historical score point (shape mirrors the API/repo, defined locally to stay DB-free). */
export interface HistoryPoint {
  date: string;
  totalScore: number;
  band: string;
  pillarScores: Record<PillarName, number>;
}
export type Direction = 'up' | 'down' | 'flat';

/** Change in total score between the last two snapshots, or null if fewer than two. */
export function scoreDelta(points: readonly HistoryPoint[]): { delta: number; direction: Direction } | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const delta = last.totalScore - prev.totalScore;
  return { delta, direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' };
}

/** Per-pillar up/down/flat vs the previous snapshot; empty if fewer than two. */
export function pillarTrends(points: readonly HistoryPoint[]): Partial<Record<PillarName, Direction>> {
  if (points.length < 2) return {};
  const last = points[points.length - 1]!.pillarScores;
  const prev = points[points.length - 2]!.pillarScores;
  const out: Partial<Record<PillarName, Direction>> = {};
  for (const k of Object.keys(last) as PillarName[]) {
    const d = (last[k] ?? 0) - (prev[k] ?? 0);
    out[k] = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
  }
  return out;
}

function bandRank(band: string): number { return BANDS.findIndex((b) => b.label === band); }

/** Returns the from->to band if the user moved UP a band since the previous snapshot, else null. */
export function bandCrossingUp(points: readonly HistoryPoint[]): { from: string; to: string } | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const lr = bandRank(last.band);
  const pr = bandRank(prev.band);
  return lr > pr && pr >= 0 ? { from: prev.band, to: last.band } : null;
}
