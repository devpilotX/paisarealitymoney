/**
 * Live SEO audit of every URL in the sitemap. Read-only, no dependencies.
 *
 *   node scripts/seo-audit.mjs            # all sitemap URLs
 *   node scripts/seo-audit.mjs --limit 20 # quick sample
 *
 * Checks status, title length, description length, canonical, robots, H1
 * count, JSON-LD presence, og:image, image alt text, word count and response
 * encoding, then prints a summary and writes tmp-audit-report.json for diffing
 * before and after a deploy.
 *
 * Written for the 2026-07-26 audit, which found 297 titles over 60 chars, 253
 * descriptions truncated mid-sentence and 717 of 772 pages with no og:image.
 * Keep it: comparing two runs is the cheapest way to prove a deploy helped.
 */
import fs from 'fs';

const ORIGIN = 'https://paisareality.com';
const CONCURRENCY = 6;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 155;
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const get = async (url, tries = 2) => {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'PaisaRealityAudit/1.0 (owner-run)' } });
      const body = r.headers.get('content-type')?.includes('xml') || r.headers.get('content-type')?.includes('html')
        ? await r.text() : '';
      return { status: r.status, url: r.url, body, headers: r.headers };
    } catch (e) {
      if (i === tries - 1) return { status: 0, url, body: '', headers: new Headers(), err: String(e.message || e) };
      await new Promise((s) => setTimeout(s, 800));
    }
  }
};

const pick = (re, s) => { const m = s.match(re); return m ? m[1].trim() : null; };
const decode = (s) => s == null ? s : s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&#x27;|&apos;/g, "'").replace(/&nbsp;/g, ' ');

console.log('fetching sitemap...');
const sm = await get(`${ORIGIN}/sitemap.xml`);
let urls = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
// Nested sitemap index support.
if (urls.length && urls.every((u) => u.endsWith('.xml'))) {
  const nested = [];
  for (const s of urls) { const r = await get(s); nested.push(...[...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())); }
  urls = nested;
}
console.log(`sitemap URLs: ${urls.length}`);
urls = urls.slice(0, LIMIT === Infinity ? urls.length : LIMIT);

const rows = [];
let done = 0;
async function worker(queue) {
  while (queue.length) {
    const url = queue.shift();
    const r = await get(url);
    const b = r.body;
    const title = decode(pick(/<title[^>]*>([\s\S]*?)<\/title>/i, b));
    const desc = decode(pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, b)
      ?? pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, b) ?? '') || null;
    const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, b);
    const robots = pick(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i, b);
    const h1s = [...b.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    const jsonLd = (b.match(/application\/ld\+json/g) || []).length;
    const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i, b);
    const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i, b);
    const imgs = [...b.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    const imgNoAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
    const words = b.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    rows.push({
      url, status: r.status, finalUrl: r.url, title, titleLen: title ? title.length : 0,
      desc, descLen: desc ? desc.length : 0, canonical, robots, h1Count: h1s.length, h1: h1s[0] ?? null,
      jsonLd, ogTitle: Boolean(ogTitle), ogImage: Boolean(ogImage), imgCount: imgs.length, imgNoAlt, words,
      encoding: r.headers.get('content-encoding'), cache: r.headers.get('cache-control'),
    });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${urls.length}`);
  }
}
const queue = [...urls];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

fs.writeFileSync('tmp-audit-report.json', JSON.stringify(rows, null, 1));

const bad = (f) => rows.filter(f);
const pathOf = (u) => u.replace(ORIGIN, '') || '/';
const summary = {
  total: rows.length,
  nonOk: bad((r) => r.status !== 200).map((r) => `${r.status} ${pathOf(r.url)}`),
  redirected: bad((r) => r.finalUrl.replace(/\/$/, '') !== r.url.replace(/\/$/, '')).map((r) => `${pathOf(r.url)} -> ${r.finalUrl}`),
  noTitle: bad((r) => !r.title).map((r) => pathOf(r.url)),
  titleOver: bad((r) => r.titleLen > TITLE_MAX).length,
  titleOverWorst: bad((r) => r.titleLen > TITLE_MAX).sort((a, b) => b.titleLen - a.titleLen).slice(0, 15).map((r) => `${r.titleLen} ${pathOf(r.url)} :: ${r.title}`),
  noDesc: bad((r) => !r.desc).map((r) => pathOf(r.url)),
  descOver: bad((r) => r.descLen > DESC_MAX).length,
  descOverWorst: bad((r) => r.descLen > DESC_MAX).sort((a, b) => b.descLen - a.descLen).slice(0, 10).map((r) => `${r.descLen} ${pathOf(r.url)}`),
  descShort: bad((r) => r.desc && r.descLen < DESC_MIN).map((r) => `${r.descLen} ${pathOf(r.url)}`).slice(0, 15),
  descTruncated: bad((r) => r.desc && /\.\.\.$/.test(r.desc)).map((r) => pathOf(r.url)).slice(0, 15),
  noCanonical: bad((r) => !r.canonical).map((r) => pathOf(r.url)),
  canonicalMismatch: bad((r) => r.canonical && r.canonical.replace(/\/$/, '') !== r.url.replace(/\/$/, '')).map((r) => `${pathOf(r.url)} -> ${r.canonical}`).slice(0, 20),
  noindex: bad((r) => r.robots && /noindex/i.test(r.robots)).map((r) => pathOf(r.url)),
  h1Missing: bad((r) => r.h1Count === 0).map((r) => pathOf(r.url)),
  h1Multiple: bad((r) => r.h1Count > 1).map((r) => `${r.h1Count} ${pathOf(r.url)}`),
  noJsonLd: bad((r) => r.jsonLd === 0).map((r) => pathOf(r.url)),
  noOgImage: bad((r) => !r.ogImage).map((r) => pathOf(r.url)).slice(0, 10),
  imgNoAltPages: bad((r) => r.imgNoAlt > 0).map((r) => `${r.imgNoAlt} ${pathOf(r.url)}`).slice(0, 15),
  thin: bad((r) => r.words < 300).map((r) => `${r.words}w ${pathOf(r.url)}`).slice(0, 20),
  dupTitles: Object.entries(rows.reduce((a, r) => { if (r.title) a[r.title] = (a[r.title] ?? 0) + 1; return a; }, {}))
    .filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => `${n}x ${t}`),
  uncompressed: bad((r) => !r.encoding).map((r) => pathOf(r.url)).slice(0, 5),
};
console.log('\n===== SUMMARY =====');
for (const [k, v] of Object.entries(summary)) {
  if (Array.isArray(v)) { console.log(`\n${k}: ${v.length}`); v.slice(0, 15).forEach((x) => console.log(`   ${x}`)); }
  else console.log(`${k}: ${v}`);
}
