/**
 * Score persistence repository (PostgreSQL).
 * History is the product: every save INSERTs a NEW snapshot + a NEW score row - never an UPDATE.
 * anon_id is ALWAYS written so the signup-time anon->user merge routine can attribute history.
 * Relative imports are used for intra-src deps so the ts-node test harness can load this file.
 */
import { withPgTransaction, pgQuery } from './pg';
import type { ScoreInput, ScoreResult } from '../health-score/score';
import type { PillarName } from '../score-config';
import { PILLAR_NAMES } from '../score-config';

/** Who is saving: a logged-in user, an anonymous visitor, or both during merge. */
export interface Identity { userId: string | null; anonId: string }

/** Where the save came from: the main flow, or a tool pushing an update. */
export type ScoreSource = 'onboarding' | `tool:${string}`;

/** Extra snapshot fields not carried on ScoreInput. */
export interface SnapshotExtras { taxRegime?: 'old' | 'new' }

/** Result of a save: the new score id (used to deep-link the share card). */
export interface SaveScoreResult { scoreId: string; snapshotId: string }

/** Injectable transaction runner (defaults to the real pool); lets tests verify SQL without a live DB. */
export interface SaveDeps { withTransaction: typeof withPgTransaction }

interface ScoreRow { id: string }
interface SnapshotRow { id: string }

/**
 * Persist one immutable snapshot of the raw inputs and one score row referencing it.
 * @param input the raw profile that produced the score.
 * @param result the computed score (total, band, pillars, top actions).
 * @param identity logged-in user id (nullable) and the always-present anon id.
 * @param source provenance tag ('onboarding' or `tool:*`).
 * @param extras snapshot-only fields (tax regime; defaults to 'new').
 * @param deps injectable transaction runner (defaults to the real pool).
 * @returns the new score id (and snapshot id).
 */
export async function saveScore(
  input: ScoreInput,
  result: ScoreResult,
  identity: Identity,
  source: ScoreSource = 'onboarding',
  extras: SnapshotExtras = {},
  deps: SaveDeps = { withTransaction: withPgTransaction },
): Promise<SaveScoreResult> {
  // Assumption: ScoreInput has no tax_regime; default to 'new' (current default regime).
  const taxRegime = extras.taxRegime ?? 'new';
  // Compact per-pillar scores for fast history reads; full reasons are recomputed live.
  const pillarScores: Record<PillarName, number> = {} as Record<PillarName, number>;
  for (const n of PILLAR_NAMES) pillarScores[n] = result.pillars[n].score;

  return deps.withTransaction(async (client) => {
    const snap = await client.query<SnapshotRow>(
      `INSERT INTO financial_snapshots
         (user_id, anon_id, monthly_income, monthly_expense, liquid_savings, monthly_debt_payment,
          has_cc_revolving, monthly_invested, asset_classes, term_cover, health_cover, dependents,
          age, retirement_age, current_corpus, tax_regime, actual_tax, optimal_tax, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        identity.userId, identity.anonId, input.monthlyIncome, input.monthlyExpense, input.liquidSavings,
        input.monthlyDebtPayment, input.hasCcRevolving, input.monthlyInvested, input.assetClasses,
        input.termCover ?? null, input.healthCover ?? null, input.dependents, input.age, input.retirementAge,
        input.currentCorpus, taxRegime, input.actualTax, input.optimalTax, source,
      ],
    );
    const snapshotId = snap.rows[0]!.id;

    const scoreRow = await client.query<ScoreRow>(
      `INSERT INTO scores (user_id, snapshot_id, total_score, band, pillar_scores, top_actions)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [identity.userId, snapshotId, result.totalScore, result.band, JSON.stringify(pillarScores), JSON.stringify(result.topActions)],
    );
    return { scoreId: scoreRow.rows[0]!.id, snapshotId };
  });
}

/** A point in a user's score time series. */
export interface ScoreHistoryPoint {
  date: string; // ISO timestamp
  totalScore: number;
  band: string;
  pillarScores: Record<PillarName, number>;
}

interface HistoryRow { created_at: Date; total_score: number; band: string; pillar_scores: Record<PillarName, number> }

/**
 * The caller's full score history, oldest first (history is the product).
 * @param userId the logged-in user's id.
 */
export async function getScoreHistory(userId: string): Promise<ScoreHistoryPoint[]> {
  const rows = await pgQuery<HistoryRow>(
    `SELECT created_at, total_score, band, pillar_scores
       FROM scores
      WHERE user_id = $1
      ORDER BY created_at ASC`,
    [userId],
  );
  return rows.map((r) => ({
    date: r.created_at.toISOString(),
    totalScore: r.total_score,
    band: r.band,
    pillarScores: r.pillar_scores,
  }));
}

/** A single public-safe score (for the share page / OG image). No rupee amounts, no inputs. */
export interface PublicScore {
  totalScore: number;
  band: string;
  topActions: ScoreResult['topActions'];
  pillarScores: Record<PillarName, number>;
}
interface PublicScoreRow { total_score: number; band: string; top_actions: ScoreResult['topActions']; pillar_scores: Record<PillarName, number> }

/**
 * Fetch one score by id for the public share page. Returns only score, band, generic actions and
 * pillar scores (0-100) - never inputs or rupee amounts.
 * @param scoreId the score row id.
 */
export async function getPublicScoreById(scoreId: string): Promise<PublicScore | null> {
  const rows = await pgQuery<PublicScoreRow>(
    `SELECT total_score, band, top_actions, pillar_scores FROM scores WHERE id = $1 LIMIT 1`,
    [scoreId],
  );
  const row = rows[0];
  return row ? { totalScore: row.total_score, band: row.band, topActions: row.top_actions, pillarScores: row.pillar_scores } : null;
}
