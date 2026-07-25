/**
 * Internal link audit. Crawls every URL in the live sitemap, collects every
 * internal href, and checks each unique target once.
 *
 *   node scripts/link-audit.mjs
 *   node scripts/link-audit.mjs --limit 30
 *
 * Read-only. Reports any internal link that does not return 200, plus where it
 * was found, so a broken link can be traced to the page that emits it.
 *
 * The sitemap audit in scripts/seo-audit.mjs proves pages are reachable. This
 * proves the navigation between them is intact, which is what crawlers follow
 * and what a visitor clicks.
 */
import fs from 'fs';

const ORIGIN = 'https://paisareality.com';
const CONCURRENCY = 6;
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const UA = { 'user-agent': 'PaisaRealityLinkAudit/1.0 (owner-run)' };

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: UA, redirect: 'follow' });
    const type = r.headers.get('content-type') ?? '';
    const body = type.includes('html') || type.includes('xml') ? await r.text() : '';
    return { status: r.status, body, finalUrl: r.url };
  } catch (e) {
    return { status: 0, body: '', finalUrl: url, err: String(e.message || e) };
  }
}

async function checkStatus(url) {
  // Some hosts reject HEAD, so fall back to a ranged GET.
  try {
    const h = await fetch(url, { method: 'HEAD', headers: UA, redirect: 'follow' });
    if (h.status < 400) return { status: h.status, finalUrl: h.url };
    const g = await fetch(url, { headers: { ...UA, range: 'bytes=0-2048' }, redirect: 'follow' });
    return { status: g.status, finalUrl: g.url };
  } catch (e) {
    return { status: 0, finalUrl: url, err: String(e.message || e) };
  }
}

const sm = await fetchText(`${ORIGIN}/sitemap.xml`);
let pages = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (LIMIT !== Infinity) pages = pages.slice(0, LIMIT);
console.log(`pages to scan: ${pages.length}`);

/** target -> set of pages linking to it */
const targets = new Map();
let scanned = 0;

async function scanWorker(queue) {
  while (queue.length) {
    const page = queue.shift();
    const { body } = await fetchText(page);
    for (const m of body.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
      const raw = m[1].trim();
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;
      let abs;
      if (raw.startsWith('/')) abs = ORIGIN + raw;
      else if (raw.startsWith(ORIGIN)) abs = raw;
      else continue; // external, handled separately
      abs = abs.split('#')[0];
      if (!targets.has(abs)) targets.set(abs, new Set());
      if (targets.get(abs).size < 4) targets.get(abs).add(page.replace(ORIGIN, '') || '/');
    }
    scanned++;
    if (scanned % 100 === 0) console.log(`  scanned ${scanned}/${pages.length}, ${targets.size} unique internal targets`);
  }
}
// One shared queue for all workers. Passing a copy per worker would make every
// worker do the whole list, which multiplies the request count by CONCURRENCY.
const scanQueue = [...pages];
await Promise.all(Array.from({ length: CONCURRENCY }, () => scanWorker(scanQueue)));
console.log(`\nunique internal link targets: ${targets.size}`);

const list = [...targets.keys()];
const broken = [];
let checked = 0;
async function checkWorker(queue) {
  while (queue.length) {
    const url = queue.shift();
    const r = await checkStatus(url);
    if (r.status !== 200) broken.push({ url, status: r.status, err: r.err, from: [...targets.get(url)] });
    checked++;
    if (checked % 100 === 0) console.log(`  checked ${checked}/${list.length}`);
  }
}
const checkQueue = [...list];
await Promise.all(Array.from({ length: CONCURRENCY }, () => checkWorker(checkQueue)));

fs.writeFileSync('tmp-link-audit.json', JSON.stringify({ pages: pages.length, targets: list.length, broken }, null, 1));
console.log(`\n===== RESULT =====`);
console.log(`pages scanned            : ${pages.length}`);
console.log(`unique internal targets  : ${list.length}`);
console.log(`internal links not 200   : ${broken.length}`);
for (const b of broken.sort((a, b2) => a.url.localeCompare(b2.url))) {
  console.log(`  ${b.status || 'ERR'} ${b.url.replace(ORIGIN, '')}${b.err ? ` (${b.err})` : ''}`);
  console.log(`      linked from: ${b.from.join(', ')}`);
}
