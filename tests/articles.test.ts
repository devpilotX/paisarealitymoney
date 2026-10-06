/**
 * Publishing rules for researched articles, and the ad manager's validation. DB-free.
 * Run: npx ts-node --project tsconfig.scripts.json tests/articles.test.ts
 */
import { isOfficialSource, normalizeTopicKey, parseSources, validateArticle, wordCount } from '../src/lib/article-core';
import { adState, validateAd } from '../src/lib/ads-constants';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); } else { failed++; console.error(`  FAIL ${msg}`); }
}

const para = 'The Reserve Bank kept the repo rate unchanged at its October meeting, and banks have not moved their loan rates yet. ';
const body = ['## What changed', para.repeat(20), '## What it means for borrowers', para.repeat(20), '## What to do now', para.repeat(20)].join('\n\n');
const good = {
  title: 'RBI keeps repo rate unchanged: what it means for your EMI',
  description: 'The RBI held the repo rate at its October 2026 meeting. Here is what that does to home loan EMIs and FD rates.',
  content: body,
  category: 'banking',
  tags: ['rbi', 'repo rate', 'emi'],
  metaTitle: 'RBI repo rate unchanged: effect on your home loan EMI',
  metaDescription: 'The RBI left the repo rate unchanged in October 2026. What it means for home loan EMIs, FD rates and borrowers, with official sources.',
  sources: [
    { title: 'RBI monetary policy statement', url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=1' },
    { title: 'Mint report', url: 'https://www.livemint.com/money/x' },
  ],
  topicKey: 'RBI repo rate October 2026',
};

console.log('\narticles');
const ok = validateArticle(good);
assert(ok.ok, `a complete article passes ${ok.ok ? '' : JSON.stringify(ok.errors)}`);
assert(ok.ok && ok.value.topicKey === 'rbi-repo-rate-october-2026', 'topic key is normalised');
assert(wordCount(body) >= 700, `fixture has enough words (${wordCount(body)})`);

const noOfficial = validateArticle({ ...good, sources: [{ title: 'a', url: 'https://www.livemint.com/a' }, { title: 'b', url: 'https://economictimes.indiatimes.com/b' }] });
assert(!noOfficial.ok && noOfficial.errors.some((e) => /official/.test(e)), 'news-only sources are refused');
const oneSource = validateArticle({ ...good, sources: [good.sources[0]] });
assert(!oneSource.ok && oneSource.errors.some((e) => /2-12/.test(e)), 'a single source is refused');
const emDash = validateArticle({ ...good, content: body + '\n\nRates moved \u2014 slowly.' });
assert(!emDash.ok && emDash.errors.some((e) => /em dash/.test(e)), 'em dashes are refused');
const placeholder = validateArticle({ ...good, content: body + '\n\nThe new limit is [insert figure].' });
assert(!placeholder.ok && placeholder.errors.some((e) => /placeholder/.test(e)), 'unfilled placeholders are refused');
const chatbot = validateArticle({ ...good, content: body + '\n\nI hope this helps!' });
assert(!chatbot.ok && chatbot.errors.some((e) => /operator/.test(e)), 'chatbot sign-offs are refused');
const h1 = validateArticle({ ...good, content: '# Title\n\n' + body });
assert(!h1.ok && h1.errors.some((e) => /level-1/.test(e)), 'a duplicate H1 is refused');
const short = validateArticle({ ...good, content: '## a\n\nb\n\n## c\n\nd\n\n## e\n\nf' });
assert(!short.ok && short.errors.some((e) => /700-3500 words/.test(e)), 'a thin article is refused');
const longMeta = validateArticle({ ...good, metaTitle: 'x'.repeat(61), metaDescription: 'short' });
assert(!longMeta.ok && longMeta.errors.length >= 2, 'meta title over 60 and a short description both reported');
const badCat = validateArticle({ ...good, category: 'crypto' });
assert(!badCat.ok, 'unknown category refused');

assert(isOfficialSource('https://www.rbi.org.in/x') && isOfficialSource('https://pib.gov.in/x') && isOfficialSource('https://epfindia.gov.in/') && isOfficialSource('https://scholarships.gov.in/'), 'regulators and .gov.in are official');
assert(!isOfficialSource('https://rbi.org.in.evil.com/') && !isOfficialSource('https://notgov.in/') && !isOfficialSource('javascript:alert(1)'), 'look-alike hosts are not official');
const parsed = parseSources([{ title: 'A', url: 'https://a.gov.in/1' }, { title: 'dup', url: 'https://a.gov.in/1' }, { url: 'http://insecure.example' }, 'junk', null, { url: 'https://b.example/x' }]);
assert(parsed.length === 2 && parsed[1]?.title === 'b.example', 'sources: https only, de-duplicated, title falls back to host');
assert(normalizeTopicKey('  Gold Rate Today: 24K up 2%!  ') === 'gold-rate-today-24k-up-2', 'topic key strips punctuation');

console.log('\nads');
const ad = { name: 'Diwali banner', placement: 'prices-top', type: 'image', imageUrl: 'https://cdn.example/b.png', linkUrl: 'https://advertiser.example', altText: 'Diwali gold offer', priority: 5 };
const v = validateAd(ad);
assert(v.ok, 'a complete image ad passes');
assert(!validateAd({ ...ad, placement: 'sidebar' }).ok, 'a placement no page renders is refused');
assert(!validateAd({ ...ad, linkUrl: 'javascript:alert(1)' }).ok, 'javascript: click URL refused');
assert(!validateAd({ ...ad, linkUrl: 'http://advertiser.example' }).ok, 'plain http click URL refused');
assert(validateAd({ ...ad, imageUrl: '/ads/banner.png' }).ok, 'site-relative image allowed');
assert(!validateAd({ ...ad, imageUrl: '//evil.example/x.png' }).ok, 'protocol-relative image refused');
assert(!validateAd({ ...ad, imageUrl: '' }).ok, 'image ad without an image refused');
assert(!validateAd({ ...ad, altText: '' }).ok, 'image ad without alt text refused');
assert(!validateAd({ ...ad, priority: 2.5 }).ok && !validateAd({ ...ad, priority: 500 }).ok, 'priority must be a whole number in range');
assert(!validateAd({ ...ad, startsAt: '2026-10-10T00:00:00Z', endsAt: '2026-10-09T00:00:00Z' }).ok, 'end before start refused');
assert(!validateAd({ ...ad, startsAt: 'next tuesday' }).ok, 'unparseable date refused');
const iso = validateAd({ ...ad, startsAt: '2026-10-10T05:30:00+05:30' });
assert(iso.ok && iso.value.startsAt === '2026-10-10T00:00:00.000Z', 'start time is stored as an absolute instant');
assert(v.ok && v.value.videoUrl === null && v.value.html === null, 'fields for other ad types are dropped');

const now = Date.parse('2026-10-06T12:00:00Z');
assert(adState({ active: true, startsAt: null, endsAt: null }, now) === 'live', 'unscheduled active ad is live');
assert(adState({ active: true, startsAt: '2026-10-07 00:00:00+00', endsAt: null }, now) === 'scheduled', 'future start is scheduled (Postgres text format)');
assert(adState({ active: true, startsAt: null, endsAt: '2026-10-05 00:00:00+05:30' }, now) === 'expired', 'past end is expired');
assert(adState({ active: false, startsAt: null, endsAt: null }, now) === 'off', 'inactive is off');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
