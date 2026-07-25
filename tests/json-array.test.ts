/**
 * Shared jsonb array parser tests.
 * Run: npx ts-node --project tsconfig.scripts.json tests/json-array.test.ts
 *
 * The first case is the one that mattered in production: pg hands back a real
 * JS array, and the old JSON.parse version threw and returned [], which blanked
 * the Documents Required section on hundreds of pages without any error.
 */

import { parseJsonArray } from '../src/lib/json-array';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); }
  else { failed++; console.error(`  FAIL ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

const REAL = ['Aadhaar card', 'Bank account passbook', 'Land ownership records'];

test('a parsed array from pg comes back intact', () => {
  const out = parseJsonArray(REAL);
  assert(out.length === 3, `three items (got ${out.length})`);
  assert(out[0] === 'Aadhaar card', 'order and content preserved');
});

test('a JSON string still works, for older rows and other callers', () => {
  const out = parseJsonArray(JSON.stringify(REAL));
  assert(out.length === 3, `three items (got ${out.length})`);
  assert(out[2] === 'Land ownership records', 'last item preserved');
});

test('empty and missing values yield an empty list, never a throw', () => {
  for (const v of [null, undefined, '', '[]', 'not json', 42, {}, true]) {
    const out = parseJsonArray(v);
    assert(Array.isArray(out) && out.length === 0, `${JSON.stringify(v) ?? 'undefined'} gives []`);
  }
});

test('non-string members are dropped rather than rendered as objects', () => {
  const out = parseJsonArray(['Aadhaar card', 42, null, { a: 1 }, 'Bank passbook']);
  assert(out.length === 2, `only the two strings survive (got ${out.length})`);
  assert(!out.some((i) => typeof i !== 'string'), 'every survivor is a string');
});

test('a JSON object rather than an array yields an empty list', () => {
  assert(parseJsonArray('{"a":1}').length === 0, 'object JSON is not treated as a list');
});

console.log(`\n================================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
