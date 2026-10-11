/**
 * RSS and Google News sitemap builders (pure, no DB).
 * Run: npx ts-node --project tsconfig.scripts.json tests/feed.test.ts
 */
import { buildRss, buildNewsSitemap, xmlEscape } from '../src/lib/feed';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); } else { failed++; console.error(`  ✗ ${msg}`); }
}

const SITE = 'https://paisareality.com';
const now = new Date('2026-10-11T03:00:00Z');
const items = [
  { slug: 'rbi-hike', title: 'RBI hikes repo to 5.50% & what it means <now>', description: 'EMIs "rise"', date: '2026-10-10T03:24:00Z', category: 'Banking' },
  { slug: 'older', title: 'Old story', description: 'd', date: '2026-10-01T03:00:00Z' },
  { slug: 'bad-date', title: 'Broken', description: 'd', date: 'not a date' },
];

console.log('\nxmlEscape');
assert(xmlEscape(`a & b < c > "d" 'e'`) === 'a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;', 'escapes all five specials');
assert(xmlEscape('ok\u0001bad') === 'okbad', 'drops control characters XML 1.0 forbids');

console.log('\nbuildRss');
const rss = buildRss({ siteUrl: SITE, title: 'T', description: 'D', items, now });
assert(rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'has the XML declaration');
assert((rss.match(/<item>/g) ?? []).length === 2, 'skips the item with an invalid date');
assert(rss.includes('<link>https://paisareality.com/newsletter/rbi-hike</link>'), 'absolute article link');
assert(rss.includes('5.50% &amp; what it means &lt;now&gt;'), 'title is escaped');
assert(rss.includes('<pubDate>Sat, 10 Oct 2026 03:24:00 GMT</pubDate>'), 'RFC 822 pubDate');
assert(rss.includes('<lastBuildDate>Sat, 10 Oct 2026 03:24:00 GMT</lastBuildDate>'), 'lastBuildDate is the newest item');
assert(!rss.includes('<category></category>') && rss.includes('<category>Banking</category>'), 'category only when present');

console.log('\nbuildNewsSitemap');
const news = buildNewsSitemap({ siteUrl: SITE, publication: 'Paisa Reality', items, now });
assert((news.match(/<url>/g) ?? []).length === 1, 'only articles from the last two days');
assert(news.includes('<news:publication_date>2026-10-10T03:24:00.000Z</news:publication_date>'), 'ISO publication date');
assert(news.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'), 'news namespace');
const empty = buildNewsSitemap({ siteUrl: SITE, publication: 'P', items: [], now });
assert(empty.includes('<urlset') && !empty.includes('<url>'), 'valid empty urlset when nothing is fresh');

console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
