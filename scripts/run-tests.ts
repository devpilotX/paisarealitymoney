/**
 * Run every tests/*.test.ts file in its own ts-node process and report a
 * combined result. All suites are DB-free by design, so this works locally
 * and in CI with no environment setup.
 *
 * Usage: npm test
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const root = join(__dirname, '..');
const testsDir = join(root, 'tests');
const tsNodeBin = require.resolve('ts-node/dist/bin');

const files = readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.ts'))
  .sort();

if (files.length === 0) {
  console.error('No test files found in tests/.');
  process.exit(1);
}

const failedSuites: string[] = [];
const startedAt = Date.now();

for (const file of files) {
  console.log(`\n${'━'.repeat(60)}\n▶ ${file}\n${'━'.repeat(60)}`);
  const result = spawnSync(
    process.execPath,
    [tsNodeBin, '--project', join(root, 'tsconfig.scripts.json'), join(testsDir, file)],
    { stdio: 'inherit', cwd: root }
  );
  if (result.status !== 0) failedSuites.push(file);
}

const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\n${'═'.repeat(60)}`);
if (failedSuites.length === 0) {
  console.log(`✓ All ${files.length} suites passed in ${seconds}s.`);
} else {
  console.error(`✗ ${failedSuites.length} of ${files.length} suites FAILED (${seconds}s):`);
  for (const f of failedSuites) console.error(`   - ${f}`);
  process.exit(1);
}
