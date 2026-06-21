/**
 * Web Worker: runs the heavy Monte Carlo retirement analysis off the main UI thread.
 * Keeps the interface responsive while 10,000+ paths + binary-search solvers run.
 *
 * The worker globals are accessed through a minimal custom-typed view of `self` to avoid
 * conflicts between the DOM and WebWorker lib signatures under the project's tsconfig.
 */
import { analyzeRetirement, type RetirementInputs, type FullAnalysis } from '@/lib/retirement-optimizer';

interface WorkerContext {
  postMessage: (message: FullAnalysis) => void;
  onmessage: ((event: { data: RetirementInputs }) => void) | null;
}

const ctx = self as unknown as WorkerContext;

ctx.onmessage = (event): void => {
  const result = analyzeRetirement(event.data);
  ctx.postMessage(result);
};

export {};
