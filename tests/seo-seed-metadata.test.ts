/**
 * Seed metadata length guard.
 * Run: npx ts-node --project tsconfig.scripts.json tests/seo-seed-metadata.test.ts
 *
 * Scheme and scholarship pages prefer a hand-written meta_title/meta_description
 * from the database over the length-aware builders in src/lib/seo.ts. Those
 * overrides live in the seed files under scripts/, so the builders' limits do
 * not protect them. A local crawl on 2026-09-30 found 14 of them 1 to 5 chars
 * over 155. This test reads every literal override in the seed sources and
 * fails if one leaves the 70 to 155 description or 60 title window.
 *
 * DB-free by design: it checks the source text, which is what reaches the DB.
 */

import fs from 'fs';
import path from 'path';
import { TITLE_LIMIT, DESCRIPTION_LIMIT } from '../src/lib/seo';

const DESCRIPTION_MIN = 70;
const SCRIPTS = path.join(process.cwd(), 'scripts');

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; } else { failed++; console.error(`  x ${msg}`); }
}

const sources = fs.readdirSync(SCRIPTS)
  .filter((f) => /^seed-.*\.ts$/.test(f) || /\.sql$/.test(f))
  .map((f) => path.join(SCRIPTS, f));

// SQL:  meta_title = '...'  (with '' as an escaped quote)
// TS:   meta_title: '...'   (with \' as an escaped quote)
const PATTERNS: Array<{ re: RegExp; unescape: (s: string) => string }> = [
  { re: /\b(meta_title|meta_description)\s*=\s*'((?:[^']|'')*)'/g, unescape: (s) => s.replace(/''/g, "'") },
  { re: /\b(meta_title|meta_description)\s*:\s*'((?:[^'\\]|\\.)*)'/g, unescape: (s) => s.replace(/\\'/g, "'") },
];

let titles = 0;
let descs = 0;
for (const file of sources) {
  const src = fs.readFileSync(file, 'utf8');
  const name = path.basename(file);
  for (const { re, unescape } of PATTERNS) {
    for (const m of src.matchAll(re)) {
      const value = unescape(m[2]).trim();
      if (!value) continue;
      if (m[1] === 'meta_title') {
        titles++;
        assert(value.length <= TITLE_LIMIT, `${name}: meta_title ${value.length} chars > ${TITLE_LIMIT} -> "${value}"`);
      } else {
        descs++;
        assert(value.length <= DESCRIPTION_LIMIT, `${name}: meta_description ${value.length} chars > ${DESCRIPTION_LIMIT} -> "${value}"`);
        assert(value.length >= DESCRIPTION_MIN, `${name}: meta_description only ${value.length} chars -> "${value}"`);
      }
    }
  }
}

console.log(`\nseed metadata guard over ${sources.length} files: ${titles} titles, ${descs} descriptions`);
assert(titles > 0 && descs > 0, 'found no overrides at all, so the patterns no longer match the seed format');
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
