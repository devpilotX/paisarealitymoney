/**
 * Grants upkeep: link health rules and the grants dataset itself.
 * Run: npx ts-node --project tsconfig.scripts.json tests/grants.test.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { checkUrl, isHealthyStatus } from '../src/lib/link-check';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  ok ${msg}`); } else { failed++; console.error(`  FAIL ${msg}`); }
}

const fakeFetch = (status: number | Error): typeof fetch =>
  (async () => { if (status instanceof Error) throw status; return new Response('', { status }); }) as typeof fetch;

function tlsError(code: string): Error {
  const e = new TypeError('fetch failed');
  (e as unknown as { cause: { code: string } }).cause = { code };
  return e;
}

(async () => {
  console.log('\nstatus rules');
  assert(isHealthyStatus(200) && isHealthyStatus(301) && isHealthyStatus(399), '2xx and 3xx are healthy');
  assert(!isHealthyStatus(404) && !isHealthyStatus(500), '404 and 500 are not');

  console.log('\ncheckUrl');
  assert((await checkUrl('https://x.test', fakeFetch(200))).ok, '200 is ok');
  assert(!(await checkUrl('https://x.test', fakeFetch(404))).ok, '404 fails');
  assert(!(await checkUrl('https://x.test', fakeFetch(503))).ok, '503 fails');
  assert((await checkUrl('https://x.test', fakeFetch(403))).ok, '403 from a bot filter counts as reachable');
  assert((await checkUrl('https://x.test', fakeFetch(tlsError('UNABLE_TO_VERIFY_LEAF_SIGNATURE')))).ok, 'incomplete certificate chain counts as reachable');
  const dns = await checkUrl('https://x.test', fakeFetch(tlsError('ENOTFOUND')));
  assert(!dns.ok && dns.status.includes('ENOTFOUND'), 'a missing domain fails and says why');

  console.log('\ndataset');
  const data = JSON.parse(readFileSync(join(__dirname, '..', 'scripts', 'data', 'grants.json'), 'utf8')) as { grants: Array<Record<string, unknown>> };
  const slugs = new Set<string>();
  for (const g of data.grants) {
    const s = String(g.slug);
    assert(!slugs.has(s), `${s}: unique slug`); slugs.add(s);
    assert(/^https:\/\//.test(String(g.official_url)) || /^http:\/\//.test(String(g.official_url)), `${s}: official_url is a URL`);
    assert(['india', 'international'].includes(String(g.region)), `${s}: region valid`);
    assert(typeof g.summary === 'string' && (g.summary as string).length > 30, `${s}: has a summary`);
    assert(Array.isArray(g.eligibility) && (g.eligibility as unknown[]).length > 0, `${s}: has eligibility`);
    const text = JSON.stringify(g);
    assert(!/\u2014/.test(text), `${s}: no em dashes`);
    const min = g.amount_min_inr as number | null, max = g.amount_max_inr as number | null;
    assert(min == null || max == null || min <= max, `${s}: amount range is ordered`);
    assert(g.deadline == null || String(g.deadline) >= '2026-09-30', `${s}: no deadline already in the past`);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed > 0) process.exit(1);
})();
