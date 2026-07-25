/**
 * Static page metadata length guard.
 * Run: npx ts-node --project tsconfig.scripts.json tests/seo-static-metadata.test.ts
 *
 * A live crawl of all 772 sitemap URLs on 2026-07-26 found 24 titles over 60
 * chars and 18 descriptions over 155 that came from hand-written strings in
 * src/app rather than from the database builders in src/lib/seo.ts. Those were
 * shortened; this test stops them growing back.
 *
 * Only literal strings are checked. Titles built from a template with an
 * interpolated value are the database builders' job and are covered by
 * tests/seo-metadata.test.ts.
 */

import fs from 'fs';
import path from 'path';
import { TITLE_LIMIT, DESCRIPTION_LIMIT } from '../src/lib/seo';

const DESCRIPTION_MIN = 70;
const APP_DIR = path.join(process.cwd(), 'src', 'app');

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; } else { failed++; console.error(`  x ${msg}`); }
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/^(page|layout)\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Extract the balanced-brace object literal starting at the first "{" after idx. */
function blockAt(src: string, idx: number): string {
  const start = src.indexOf('{', idx);
  if (start === -1) return '';
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return src.slice(start);
}

/** Metadata object literals: `export const metadata = {...}` and `pageMetadata({...})`. */
function metadataBlocks(src: string): string[] {
  const blocks: string[] = [];
  const re = /(export\s+const\s+metadata[^=]*=\s*|pageMetadata\(\s*)/g;
  for (let m = re.exec(src); m; m = re.exec(src)) blocks.push(blockAt(src, m.index + m[0].length - 1));
  // `export const metadata = pageMetadata({...})` matches both patterns, so the
  // same object literal appears twice. Check each one once.
  return [...new Set(blocks.filter(Boolean))];
}

/** First literal value for `key` in a block, or null when it is dynamic or absent. */
function literal(block: string, key: string): string | null {
  const re = new RegExp(`(?:^|[{,\\s])${key}:\\s*(['"\`])([\\s\\S]*?)\\1`, 'm');
  const m = block.match(re);
  if (!m) return null;
  const raw = m[2];
  if (m[1] === '`' && raw.includes('${')) return null; // dynamic, handled elsewhere
  return raw.replace(/\\'/g, "'").replace(/\s*\n\s*/g, ' ').trim();
}

const files = walk(APP_DIR);
let titlesChecked = 0;
let descsChecked = 0;
const rel = (f: string) => f.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');

console.log(`\nstatic metadata length guard over ${files.length} page and layout files`);
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const block of metadataBlocks(src)) {
    const title = literal(block, 'title');
    const desc = literal(block, 'description');
    if (title !== null && title.length > 0) {
      titlesChecked++;
      assert(title.length <= TITLE_LIMIT, `${rel(f)}: title is ${title.length} chars, limit ${TITLE_LIMIT} -> "${title}"`);
    }
    if (desc !== null && desc.length > 0) {
      descsChecked++;
      assert(desc.length <= DESCRIPTION_LIMIT, `${rel(f)}: description is ${desc.length} chars, limit ${DESCRIPTION_LIMIT} -> "${desc.slice(0, 60)}..."`);
      assert(desc.length >= DESCRIPTION_MIN, `${rel(f)}: description is only ${desc.length} chars, minimum ${DESCRIPTION_MIN} -> "${desc}"`);
    }
  }
}

console.log(`  checked ${titlesChecked} literal titles and ${descsChecked} literal descriptions`);
console.log(`\n================================================`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
