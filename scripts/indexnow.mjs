/**
 * Submit every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver share it).
 * Bing's index also feeds ChatGPT search and Copilot, so this is the fastest
 * way to get new or changed pages in front of those engines.
 *
 *   node scripts/indexnow.mjs            # all sitemap URLs
 *   node scripts/indexnow.mjs /gold-rate /interest-rates   # just these paths
 *
 * The key is public by design: it is served at /<key>.txt to prove ownership.
 * Run after a deploy that changes content. Submitting unchanged URLs repeatedly
 * is pointless, not harmful.
 */
const SITE = 'https://paisareality.com';
const KEY = '8810a952e5b341dfd230c20bb6dc9f03';

async function sitemapUrls() {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const paths = process.argv.slice(2);
const urls = paths.length ? paths.map((p) => SITE + (p.startsWith('/') ? p : `/${p}`)) : await sitemapUrls();

for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'paisareality.com', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: batch }),
  });
  console.log(`submitted ${batch.length} URLs: HTTP ${res.status} ${res.status === 200 || res.status === 202 ? 'accepted' : await res.text()}`);
}
