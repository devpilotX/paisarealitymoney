/**
 * Automation rules: page-change fingerprints, the daily data-health report and the
 * weekly price wrap. DB-free.
 * Run: npx ts-node --project tsconfig.scripts.json tests/automation.test.ts
 */
import { visibleTextFingerprint, checkUrl } from '../src/lib/link-check';
import { evaluateHealth, type HealthFacts } from '../src/lib/data-health-core';
import { composeWrap, longDate, type WrapData, type DayAvg } from '../src/lib/market-wrap-core';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); } else { failed++; console.error(`  FAIL ${msg}`); }
}

const series = (start: number, step: number, n = 7, from = '2026-09-28'): DayAvg[] =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.parse(from + 'T00:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
    return { date: d, value: start + step * i };
  });

const baseWrap = (): WrapData => ({
  cityCount: 50,
  gold24: series(149000, 120),
  gold22: series(136583, 110),
  silverKg: series(238000, -500),
  fuel: [
    { city: 'Delhi', slug: 'delhi', petrol: 94.77, diesel: 87.67, petrolWeekAgo: 94.77, dieselWeekAgo: 87.67 },
    { city: 'Mumbai', slug: 'mumbai', petrol: 103.54, diesel: 90.03, petrolWeekAgo: 103.54, dieselWeekAgo: 90.03 },
  ],
  lpgDelhi: { now: 853, weekAgo: 853 },
  deadlines: [{ kind: 'scholarship', name: 'NSP Post Matric', slug: 'nsp-post-matric', deadline: '2026-10-31' }],
});

const facts = (over: Partial<HealthFacts> = {}): HealthFacts => ({
  today: '2026-10-01',
  latestPrice: { gold: '2026-10-01', silver: '2026-10-01', fuel: '2026-09-30', lpg: '2026-10-01' },
  banksStale: 0, banksTotal: 51, schemesUnverified: 0, scholarshipsPastDeadline: 0,
  linksFailing: [], pagesChanged: [],
  ...over,
});
const policy = { ssNext: '2027-01-01', mpcEnds: '2026-10-07', rbiAsOf: '2026-08-05' };

(async () => {
  console.log('\npage fingerprints');
  const page = (body: string) => `<html><head><script>var t=${Math.random()}</script><style>p{}</style></head><body>${body}</body></html>`;
  assert(visibleTextFingerprint(page('<p>Last date 31/10/2026. Apply now.</p><p>10:45 am</p>'))
    === visibleTextFingerprint(page('<p>Last date 15/11/2026. Apply now.</p><p>11:02 pm</p>')), 'dates, times and scripts do not count as a change');
  assert(visibleTextFingerprint(page('<p>Income limit Rs 2.5 lakh</p>')) !== visibleTextFingerprint(page('<p>Income limit Rs 3 lakh</p>')), 'a changed rule does');
  assert(visibleTextFingerprint(page('<p>Visitors: 1234</p><p>Scheme</p>')) === visibleTextFingerprint(page('<p>Visitors: 99999</p><p>Scheme</p>')), 'visitor counters do not');
  const html = (async () => new Response('<p>hello</p>', { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch;
  const r = await checkUrl('https://x.test', html, { hash: true });
  assert(r.ok && typeof r.contentHash === 'string' && r.contentHash.length === 32, 'checkUrl returns a fingerprint when asked');
  const r404 = await checkUrl('https://x.test', (async () => new Response('gone', { status: 404 })) as typeof fetch, { hash: true });
  assert(!r404.ok && r404.contentHash === undefined, 'no fingerprint for an error page');

  console.log('\ndata health');
  assert(evaluateHealth(facts(), policy).ok && evaluateHealth(facts(), policy).issues.length === 0, 'fresh data gives a clean report');
  const stale = evaluateHealth(facts({ latestPrice: { gold: '2026-09-28', silver: '2026-10-01', fuel: '2026-09-30', lpg: '2026-10-01' } }), policy);
  assert(!stale.ok && stale.issues.some((i) => /gold prices last written 2026-09-28, 3 days/.test(i.text)), 'gold three days old must be fixed');
  assert(evaluateHealth(facts({ latestPrice: { gold: null, silver: '2026-10-01', fuel: '2026-10-01', lpg: '2026-10-01' } }), policy).issues.some((i) => /No gold/.test(i.text)), 'missing prices are reported');
  assert(!evaluateHealth(facts({ today: '2026-10-08' }), policy).ok, 'RBI block flagged after the meeting ends');
  const fresh = (d: string) => ({ gold: d, silver: d, fuel: d, lpg: d });
  assert(evaluateHealth(facts({ today: '2026-10-08', latestPrice: fresh('2026-10-08') }), { ...policy, rbiAsOf: '2026-10-07' }).ok, 'and cleared once updated');
  const ss = evaluateHealth(facts({ today: '2027-01-01', latestPrice: fresh('2027-01-01') }), { ...policy, rbiAsOf: '2026-10-07' });
  assert(!ss.ok && ss.issues.length === 1 && /Small savings/.test(ss.issues[0]!.text), 'new small savings quarter flagged');
  const rev = evaluateHealth(facts({ banksStale: 46, linksFailing: [{ table: 'schemes', slug: 'pm-kisan', status: '404' }], pagesChanged: [{ table: 'grants', slug: 'sisfs' }] }), policy);
  assert(rev.ok && rev.issues.length === 3 && rev.issues.every((i) => i.level === 'review'), 'stale banks, failing links and changed pages are review items');
  const many = evaluateHealth(facts({ linksFailing: Array.from({ length: 20 }, (_, i) => ({ table: 'schemes', slug: 's' + i, status: '404' })) }), policy);
  assert(many.issues.length === 16 && /5 more/.test(many.issues[15]!.text), 'long lists are capped');

  console.log('\nweekly wrap');
  assert(longDate('2026-10-04') === '4 October 2026', 'long date');
  assert(composeWrap({ ...baseWrap(), gold24: series(1, 1, 3) }) === null, 'no post without a full week of prices');
  const w = composeWrap(baseWrap())!;
  assert(w.slug === 'weekly-prices-2026-10-04', 'slug is the week end date');
  assert(w.title.length <= 60 && w.metaTitle.length <= 60, `titles fit (${w.metaTitle.length})`);
  assert(w.description.length >= 70 && w.description.length <= 155, `description fits (${w.description.length})`);
  assert(/\u20B91,49,720 per 10 grams on 4 October 2026, up \u20B9720 over the week/.test(w.description), 'description states the real move');
  assert(/up \u20B9720 \(0\.48%\) from \u20B91,49,000 on 28 September 2026/.test(w.content), 'gold move and Indian number format');
  assert(/Silver averaged \u20B92,35,000 per kg on 4 October 2026, down \u20B93,000/.test(w.content), 'silver move');
  assert(/did not change in any of the four metros/.test(w.content), 'flat fuel stated plainly');
  assert(/the same as a week ago/.test(w.content), 'flat LPG stated plainly');
  assert(/\[NSP Post Matric\]\(\/scholarships\/nsp-post-matric\): closes 31 October 2026/.test(w.content), 'deadline links');
  assert(!/[\u2014\u2013\u201C\u201D]/.test(w.content + w.title + w.description), 'no em dashes or curly quotes');
  const moved = composeWrap({ ...baseWrap(), fuel: [{ city: 'Delhi', slug: 'delhi', petrol: 95.27, diesel: 87.67, petrolWeekAgo: 94.77, dieselWeekAgo: 87.67 }] })!;
  assert(/\| 95\.27 \| \+0\.50 \| 87\.67 \| No change \|/.test(moved.content), 'fuel table shows the change');
  const flatGold = composeWrap({ ...baseWrap(), gold24: series(149000, 0) })!;
  const goldPart = flatGold.content.split('## Silver')[0]!;
  assert(/little changed/.test(flatGold.description) && /practically unchanged/.test(goldPart) && !/high was/.test(goldPart), 'flat week handled');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
