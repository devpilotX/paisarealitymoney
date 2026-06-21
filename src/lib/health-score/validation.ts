/**
 * Zod validation for ScoreInput. Pure (no React/DB/network). Shared by client and server so
 * the same shape is enforced everywhere. Relative import of ScoreInput for the ts-node harness.
 */
import { z } from 'zod';
import type { ScoreInput } from './score';

const money = z.number().finite().min(0).max(1e11);
const ASSET_CLASSES = ['equity', 'debt', 'gold', 'cash', 'realestate'] as const;

/** Schema for the Financial Health Score input. */
export const scoreInputSchema = z.object({
  monthlyIncome: money,
  monthlyExpense: money,
  liquidSavings: money,
  monthlyDebtPayment: money,
  hasCcRevolving: z.boolean(),
  loanMaxRate: z.number().finite().min(0).max(100).optional(),
  monthlyInvested: money,
  assetClasses: z.array(z.enum(ASSET_CLASSES)).max(5),
  termCover: money.optional(),
  healthCover: money.optional(),
  dependents: z.number().int().min(0).max(20),
  age: z.number().int().min(0).max(120),
  retirementAge: z.number().int().min(1).max(120),
  currentCorpus: money,
  requiredCorpus: money,
  actualTax: money,
  optimalTax: money,
  tracksSpending: z.boolean(),
  missedEmi6mo: z.boolean(),
  cibil: z.number().int().min(300).max(900).optional(),
  hasWrittenBudget: z.boolean(),
});

// Compile-time guarantee the schema output matches the engine's input type.
type SchemaOut = z.infer<typeof scoreInputSchema>;
type _Check = SchemaOut extends ScoreInput ? true : never;
const _assert: _Check = true;
void _assert;

/** Parse unknown input; returns the typed value or a flat error message. */
export function parseScoreInput(data: unknown): { ok: true; value: ScoreInput } | { ok: false; message: string } {
  const r = scoreInputSchema.safeParse(data);
  if (r.success) return { ok: true, value: r.data };
  const first = r.error.issues[0];
  return { ok: false, message: first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid input.' };
}
