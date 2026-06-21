/**
 * Financial Health Score — integration tests (no live DB; dependencies injected).
 * Imports LIBS only (relative paths) — the API route handlers that wrap these are verified by
 * `tsc` + `next build`; here we test the validation contract and the persistence/k-anonymity logic.
 * Run: npx ts-node --project tsconfig.scripts.json tests/health-score-integration.test.ts
 */

import type { PoolClient, QueryResultRow } from 'pg';
import { parseScoreInput } from '../src/lib/health-score/validation';
import { computeScore, type ScoreInput } from '../src/lib/health-score/score';
import { saveScore } from '../src/lib/db/score-repo';
import { getBenchmark, type BenchmarkDeps } from '../src/lib/db/benchmark-repo';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function test(name: string, fn: () => void | Promise<void>): void { console.log(`\n${name}`); void fn(); }

function validInput(): ScoreInput {
  return {
    monthlyIncome: 60000, monthlyExpense: 45000, liquidSavings: 90000, monthlyDebtPayment: 12000,
    hasCcRevolving: false, monthlyInvested: 6000, assetClasses: ['equity', 'gold'], healthCover: 500000,
    termCover: 0, dependents: 0, age: 30, retirementAge: 60, currentCorpus: 500000, requiredCorpus: 5000000,
    actualTax: 50000, optimalTax: 48000, tracksSpending: true, missedEmi6mo: false, cibil: 760, hasWrittenBudget: false,
  };
}

// ---------------------------------------------------------------------------

test('1. validation: malformed input is rejected (the /api/score 400 contract)', () => {
  assert(parseScoreInput({ monthlyIncome: -5 }).ok === false, 'negative income + missing fields -> ok:false');
  assert(parseScoreInput({}).ok === false, 'empty body -> ok:false');
  assert(parseScoreInput({ ...validInput(), assetClasses: ['crypto'] }).ok === false, 'unknown asset class -> ok:false');
  const good = parseScoreInput(validInput());
  assert(good.ok === true, 'valid full input -> ok:true (the 200 path)');
});

test('2. saveScore inserts ONE snapshot + ONE score, never UPDATEs, returns new ids', async () => {
  const calls: string[] = [];
  const fakeClient = {
    query: async (sql: string) => {
      calls.push(sql);
      return { rows: [{ id: /financial_snapshots/i.test(sql) ? 'snap-1' : 'score-1' }] };
    },
  };
  const result = computeScore(validInput());
  const out = await saveScore(
    validInput(), result, { userId: null, anonId: 'anon-123' }, 'onboarding', {},
    { withTransaction: async <T>(fn: (c: PoolClient) => Promise<T>) => fn(fakeClient as unknown as PoolClient) },
  );
  assert(out.snapshotId === 'snap-1' && out.scoreId === 'score-1', 'returns new snapshot + score ids');
  assert(calls.filter((s) => /INSERT INTO financial_snapshots/i.test(s)).length === 1, 'exactly one snapshot INSERT');
  assert(calls.filter((s) => /INSERT INTO scores/i.test(s)).length === 1, 'exactly one score INSERT');
  assert(calls.every((s) => !/\bUPDATE\b/i.test(s)), 'never issues an UPDATE');
});

test('3. saveScore always writes anon_id (for the signup merge)', async () => {
  let snapshotParams: readonly unknown[] = [];
  const fakeClient = {
    query: async (sql: string, params: readonly unknown[]) => {
      if (/financial_snapshots/i.test(sql)) snapshotParams = params;
      return { rows: [{ id: 'x' }] };
    },
  };
  await saveScore(validInput(), computeScore(validInput()), { userId: null, anonId: 'anon-xyz' }, 'onboarding', {},
    { withTransaction: async <T>(fn: (c: PoolClient) => Promise<T>) => fn(fakeClient as unknown as PoolClient) });
  // anon_id is the 2nd column ($2) in the snapshot INSERT.
  assert(snapshotParams[1] === 'anon-xyz', 'anon_id written even when user_id is null');
  assert(snapshotParams[0] === null, 'user_id is null for an anonymous save');
});

test('4. getBenchmark returns null below k-anonymity and enforces the >= 50 SQL guard', async () => {
  let captured: { sql: string; params: readonly unknown[] } | null = null;
  const empty: BenchmarkDeps = {
    query: async <T extends QueryResultRow>(text: string, params: readonly unknown[] = []): Promise<T[]> => { captured = { sql: text, params }; return []; },
  };
  const r = await getBenchmark('age:25-30|city:metro|income:5-10L', empty);
  assert(r === null, 'no qualifying cohort -> null');
  assert(captured !== null && /cohort_size >= \$2/.test((captured as { sql: string }).sql), 'query enforces cohort_size >= $2');
  assert(captured !== null && (captured as { params: readonly unknown[] }).params[1] === 50, 'k-anonymity threshold param is 50');
});

test('5. getBenchmark maps a qualifying cohort row', async () => {
  const row = { cohort_key: 'k', cohort_size: 120, total_percentiles: { p25: 600, p50: 700, p75: 800 }, pillar_percentiles: {} };
  const full: BenchmarkDeps = { query: async <T extends QueryResultRow>(): Promise<T[]> => [row as unknown as T] };
  const r = await getBenchmark('k', full);
  assert(r !== null && r.cohortSize === 120 && r.totalPercentiles.p50 === 700, 'maps cohort size + percentiles');
});

// --- Summary (deferred so async tests above settle) ---
setTimeout(() => {
  console.log(`\n${'='.repeat(48)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed > 0) process.exit(1);
}, 200);
