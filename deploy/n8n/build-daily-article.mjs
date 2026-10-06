// Builds deploy/n8n/workflows/09-daily-article.json. The Code node bodies live here as real
// functions so they can be read and linted; n8n receives their source text.
// Run: node deploy/n8n/build-daily-article.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const id = (n) => `b9a0c009-0000-4000-8000-${String(n).padStart(12, '0')}`;
const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')).replace(/^\n/, '').replace(/^ {2}/gm, ''); };
const CRON = { httpHeaderAuth: { id: 'paisaCronSecret', name: 'Site cron secret' } };
const TELEGRAM = { telegramApi: { id: 'paisaTelegramBot', name: 'Telegram: Paisareality_bot' } };
const KIRO = { httpHeaderAuth: { id: 'paisaKiroApiKey', name: 'Kiro API key' } };
const OPENROUTER = { httpHeaderAuth: { id: 'paisaOpenRouter', name: 'OpenRouter API key' } };
const SITE = 'https://paisareality.com';
const WRITER = 'http://127.0.0.1:5690';

// ---------------------------------------------------------------- code nodes

function listFeeds() {
  // Stop if today's article is already out (a manual re-run must not post twice).
  const status = $json;
  if (Number(status.publishedToday) > 0) return [];
  const recent = (status.recent || []).map((r) => r.title);
  const gn = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:2d&hl=en-IN&gl=IN&ceid=IN:en`;
  const feeds = [
    ['Google Trends India', 'https://trends.google.com/trending/rss?geo=IN', 'trends'],
    ['Google News: personal finance', gn('personal finance India OR income tax OR EPFO OR PPF OR NPS'), 'news'],
    ['Google News: RBI, SEBI, banks', gn('RBI OR SEBI OR "repo rate" OR "fixed deposit" OR UPI'), 'news'],
    ['Google News: GST, LPG, gold, fuel', gn('GST rate OR "LPG price" OR "gold price" OR "petrol price" OR "small savings"'), 'news'],
    ['RBI press releases', 'https://www.rbi.org.in/pressreleases_rss.xml', 'official'],
    ['RBI notifications', 'https://www.rbi.org.in/notifications_rss.xml', 'official'],
    ['SEBI', 'https://www.sebi.gov.in/sebirss.xml', 'official'],
    ['PIB Finance Ministry', 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3', 'official'],
    ['Income Tax Department', 'https://www.incometax.gov.in/iec/foportal/rss.xml', 'official'],
    ['ET Wealth', 'https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms', 'news'],
    ['Mint Money', 'https://www.livemint.com/rss/money', 'news'],
    ['Business Standard Personal Finance', 'https://www.business-standard.com/rss/finance/personal-finance-10307.rss', 'news'],
  ];
  return feeds.map(([name, url, kind]) => ({ json: { name, url, kind, recent } }));
}

function pickCandidates() {
  const feeds = $('List the feeds').all().map((i) => i.json);
  const recent = feeds[0]?.recent || [];
  const MONEY = /\b(tax|itr|tds|gst|rbi|repo|sebi|mutual funds?|sip|epfo?|pf|ppf|nps|pension|fd|fixed deposits?|interest rates?|loans?|emi|credit cards?|upi|banks?|banking|gold|silver|petrol|diesel|lpg|cylinder|schemes?|yojana|subsidy|insurance|lic|irdai|aadhaar|pan|kyc|salary|da hike|pay commission|savings|senior citizens?|sukanya|kisan|budget|inflation|cibil|rupee|deposit|npci|demat|ipo rules|dividend tax|capital gains|hra|80c|pmay|atal)\b/i;
  const SKIP = /answer key|result|admit card|cricket|ipl|\bmatch\b|movie|box office|election|murder|weather|live score|horoscope|target price|stocks? to buy|crypto|bitcoin|sensex today|nifty today|share price/i;
  const ROUTINE = /auction|vrrr|\bvrr\b|treasury bills?|money market operations|state government securities|\bsdl\b|lending facility|reserve money|weekly statistical|penalty on|imposes monetary penalty|cancels certificate|directions under section 35a|amalgamation|lapsed/i;
  const decode = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, 'i')); return m ? decode(m[1]) : ''; };
  const words = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3));
  const recentSets = recent.map(words);
  const similar = (t) => { const a = words(t); return recentSets.some((b) => { const inter = [...a].filter((w) => b.has(w)).length; return inter / Math.max(1, Math.min(a.size, b.size)) >= 0.6; }); };
  const now = Date.now();
  const out = [];
  $input.all().forEach((item, i) => {
    const feed = feeds[i];
    if (!feed) return;
    const xml = String(item.json.data || '');
    for (const raw of xml.split(/<item[\s>]/i).slice(1, 60)) {
      let title = tag(raw, 'title');
      if (!title) continue;
      const source = tag(raw, 'source') || feed.name;
      if (feed.kind === 'news') title = title.replace(/\s+-\s+[^-]+$/, '');
      const extra = feed.kind === 'trends' ? [...raw.matchAll(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/g)].map((m) => decode(m[1])).join(' | ') : '';
      const hay = `${title} ${extra}`;
      if (SKIP.test(hay) || (feed.kind === 'official' && ROUTINE.test(title))) continue;
      const hits = (hay.match(new RegExp(MONEY.source, 'gi')) || []).length;
      if (!hits && feed.kind !== 'official') continue;
      const pub = Date.parse(tag(raw, 'pubDate'));
      const ageH = Number.isFinite(pub) ? (now - pub) / 3600000 : 48;
      if (ageH > (feed.kind === 'official' ? 96 : 60)) continue;
      const traffic = tag(raw, 'ht:approx_traffic');
      const trafficN = Number(traffic.replace(/[^0-9]/g, '')) * (/k/i.test(traffic) ? 1000 : 1) || 0;
      let score = hits * 2 + (feed.kind === 'official' ? 3 : 0) + (ageH < 24 ? 2 : 0) + (trafficN ? Math.log10(trafficN) : 0);
      if (similar(title)) score -= 10;
      const url = feed.kind === 'trends' ? (raw.match(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/) || [])[1] || '' : tag(raw, 'link');
      out.push({ title: extra ? `${title}: ${extra}`.slice(0, 300) : title, source, feed: feed.name, url: decode(url), published: Number.isFinite(pub) ? new Date(pub).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '', traffic, score: Math.round(score * 10) / 10 });
    }
  });
  const seen = new Set();
  const candidates = out.sort((a, b) => b.score - a.score).filter((c) => { const k = c.title.toLowerCase().slice(0, 60); if (seen.has(k) || c.score < 2) return false; seen.add(k); return true; }).slice(0, 30);
  const feedsOk = $input.all().filter((i) => String(i.json.data || '').includes('<item')).length;
  return [{ json: { candidates, recent, feedsOk, feedsTotal: feeds.length } }];
}

function buildReview() {
  const r = $json;
  const a = r.article;
  const evidence = (r.claims || []).map((c, i) => `${i + 1}. ${c.claim}\n   source: ${c.source_url}\n   quote from that page: "${c.quote}"`).join('\n');
  const system = 'You are a strict fact-check editor for an Indian personal finance website. You get an article and its evidence: exact quotes copied from the pages it cites (a script has already confirmed each quote is on its page). Check that every specific fact in the article (numbers, rates, dates, deadlines, eligibility rules, limits, names of schemes and bodies) is supported by the evidence, that the arithmetic in any worked example is correct, and that the article gives no personalised investment advice and no guarantees. Plain explanation that needs no source is fine. Reply with JSON only, no other text: {"verdict":"pass" or "fail","issues":[{"severity":"high" or "low","text":"what is wrong and where"}]}. Use high only for: a fact that contradicts the evidence, a specific figure or rule with no support in the evidence, wrong arithmetic, or advice or a guarantee. verdict is fail if any issue is high.';
  const user = `ARTICLE TITLE: ${a.title}\n\nARTICLE:\n${a.content}\n\nEVIDENCE:\n${evidence}`;
  return [{ json: { ...r, reviewRequest: { model: 'nvidia/nemotron-3-ultra-550b-a55b:free', temperature: 0.1, max_tokens: 6000, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] } } }];
}

function readVerdict() {
  const written = $('Research and write (Kiro)').first().json;
  const res = $json;
  let verdict = 'unavailable';
  let issues = [];
  let note = '';
  const text = res?.choices?.[0]?.message?.content;
  if (typeof text === 'string') {
    const s = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    const m = s.match(/\{[\s\S]*\}/);
    try {
      const v = JSON.parse(m ? m[0] : s);
      verdict = v.verdict === 'pass' ? 'pass' : v.verdict === 'fail' ? 'fail' : 'unavailable';
      issues = Array.isArray(v.issues) ? v.issues.filter((x) => x && x.text).slice(0, 12) : [];
    } catch { note = 'reviewer reply was not JSON'; }
  } else {
    note = String(res?.error?.message || res?.error || 'no reply').slice(0, 200);
  }
  const high = issues.filter((i) => i.severity === 'high');
  if (verdict === 'fail' && high.length === 0) verdict = 'pass';
  return [{ json: { ...written, review: { verdict, issues, high: high.length, note } } }];
}

function readyToPublish() {
  // Both routes arrive here: reviewed and passed, or revised after the review.
  const j = $json;
  const revised = Boolean(j.revisedAfterReview);
  const review = revised ? $('Read the verdict').first().json.review : j.review;
  return [{ json: { article: j.article, summary: j.summary, sources: j.sources, report: j.report, review, revised, reviseReport: revised ? j.report : null } }];
}

function markRevised() {
  return [{ json: { ...$json, revisedAfterReview: true } }];
}

function buildRevise() {
  const r = $json;
  const draft = { ...r.article, claims: (r.claims || []).map((c) => ({ claim: c.claim, source_url: c.source_url, quote: c.quote })) };
  return [{ json: { draft, issues: r.review.issues.filter((i) => i.severity === 'high').map((i) => i.text) } }];
}

function afterPublish() {
  const pkg = $('Ready to publish').first().json;
  const res = $json;
  const body = typeof res.body === 'string' ? (() => { try { return JSON.parse(res.body); } catch { return {}; } })() : (res.body || {});
  if (!body.success) return [{ json: { published: false, status: res.statusCode, errors: body.errors || [String(res.body || '').slice(0, 300)], pkg } }];
  return [{ json: { published: true, url: body.url, slug: body.slug, pkg, indexnow: { host: 'paisareality.com', key: '8810a952e5b341dfd230c20bb6dc9f03', keyLocation: 'https://paisareality.com/8810a952e5b341dfd230c20bb6dc9f03.txt', urlList: [body.url, 'https://paisareality.com/newsletter', 'https://paisareality.com/sitemap.xml'] } } }];
}

function composePublished() {
  const p = $('After publish').first().json;
  const s = p.pkg.summary || {};
  const rv = p.pkg.review || {};
  const idx = Number($json.statusCode) || 0;
  const first = $('Research and write (Kiro)').first().json.report || {};
  const credits = (Number(first.credits) || 0) + (p.pkg.revised ? Number(p.pkg.report?.credits) || 0 : 0);
  const minutes = Math.round(((Number(first.seconds) || 0) + (p.pkg.revised ? Number(p.pkg.report?.seconds) || 0 : 0)) / 60);
  const lines = [
    "Today's article is live:",
    p.pkg.article.title,
    p.url,
    '',
    `Facts checked on their sources: ${s.claimsVerified}/${s.claimsTotal} (${s.officialClaimsVerified} on official pages), ${s.sources} sources (${s.officialSources} official)`,
    `Style check: ${s.detector?.high ?? 0} high, ${s.detector?.medium ?? 0} medium findings; about ${s.words} words`,
    `Independent review (Nemotron): ${rv.verdict}${p.pkg.revised ? ', then revised to fix its points' : ''}${rv.note ? ` (${rv.note})` : ''}`,
    `IndexNow (Bing, Yandex): ${idx >= 200 && idx < 300 ? 'accepted' : `failed (HTTP ${idx})`}`,
    `Kiro: ${p.pkg.report?.model || '?'}, ${credits.toFixed(1)} credits, ${(first.attempts?.length || 1) + (p.pkg.revised ? p.pkg.report?.attempts?.length || 1 : 0)} draft(s), ${minutes} min`,
    '',
    'Edit or unpublish it in the admin dashboard if anything needs changing.',
  ];
  return [{ json: { text: lines.join('\n') } }];
}

function composeProblem() {
  const j = $json;
  let text;
  if (j.published === false) {
    text = ['The article was written but the site refused it:', ...(j.errors || []).map((e) => `- ${e}`), '', 'Nothing was published today.'].join('\n');
  } else if (j.skip) {
    text = `No article today: ${j.reason}\n\nThe writer found no new money topic it could confirm from an official source. That is the safe outcome.`;
  } else if (j.review && j.ok === false) {
    text = ['No article today: the draft failed again after fixing the fact-check points.', j.reason || '', ...(j.problems || []).slice(0, 8).map((p) => `- ${p}`)].join('\n');
  } else {
    const hint = /key rejected|malformed Kiro/i.test(String(j.reason)) ? '\n\nUpdate the key in n8n: Credentials > "Kiro API key" > Value.' : '';
    text = ['No article today:', String(j.reason || 'unknown error'), ...(j.problems || []).slice(0, 8).map((p) => `- ${p}`)].join('\n') + hint;
  }
  return [{ json: { text } }];
}

// ---------------------------------------------------------------- nodes

const http = (n, name, pos, params, extra = {}) => ({ id: id(n), name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos, parameters: params, ...extra });
const code = (n, name, pos, fn) => ({ id: id(n), name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos, parameters: { jsCode: body(fn) } });
const ifOk = (n, name, pos, left) => ({
  id: id(n), name, type: 'n8n-nodes-base.if', typeVersion: 2.2, position: pos,
  parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ id: id(900 + n), leftValue: left, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} },
});
const telegram = (n, name, pos) => ({
  id: id(n), name, type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: pos,
  parameters: { chatId: '__CHAT_ID__', text: "={{ String($json.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}", additionalFields: { appendAttribution: false, disable_web_page_preview: false, parse_mode: 'HTML' } },
  credentials: TELEGRAM,
});
const writerCall = (path, bodyExpr) => ({
  method: 'POST', url: `${WRITER}${path}`, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
  sendBody: true, specifyBody: 'json', jsonBody: bodyExpr, options: { timeout: 4200000 },
});

const nodes = [
  { id: id(1), name: 'Daily at 08:30', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, 200], parameters: { rule: { interval: [{ field: 'cronExpression', expression: '30 8 * * *' }] } } },
  { id: id(25), name: 'Run now', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 400], parameters: {} },
  http(2, 'Published today already?', [220, 200], { method: 'GET', url: `${SITE}/api/cron/articles`, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', options: { timeout: 30000 } }, { credentials: CRON, retryOnFail: true, maxTries: 3, waitBetweenTries: 15000 }),
  code(3, 'List the feeds', [440, 200], listFeeds),
  http(4, 'Fetch feed', [660, 200], { method: 'GET', url: '={{ $json.url }}', sendHeaders: true, headerParameters: { parameters: [{ name: 'User-Agent', value: 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' }] }, options: { timeout: 30000, response: { response: { responseFormat: 'text' } } } }, { onError: 'continueRegularOutput', retryOnFail: true, maxTries: 2, waitBetweenTries: 5000 }),
  code(5, 'Pick trending candidates', [880, 200], pickCandidates),
  http(6, 'Research and write (Kiro)', [1100, 200], writerCall('/write', '={{ JSON.stringify({ candidates: $json.candidates, recent: $json.recent }) }}'), { credentials: KIRO }),
  ifOk(7, 'Written and checked?', [1320, 200], '={{ $json.ok === true }}'),
  code(8, 'Ask for an independent review', [1540, 100], buildReview),
  http(9, 'Fact-check (Nemotron, OpenRouter)', [1760, 100], { method: 'POST', url: 'https://openrouter.ai/api/v1/chat/completions', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendHeaders: true, headerParameters: { parameters: [{ name: 'HTTP-Referer', value: SITE }, { name: 'X-Title', value: 'Paisa Reality fact-check' }] }, sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.reviewRequest) }}', options: { timeout: 300000 } }, { credentials: OPENROUTER, onError: 'continueRegularOutput', retryOnFail: true, maxTries: 2, waitBetweenTries: 20000 }),
  code(10, 'Read the verdict', [1980, 100], readVerdict),
  { ...ifOk(11, 'Review passed?', [2200, 100], "={{ $json.review.verdict !== 'fail' }}") },
  code(12, 'Prepare the fixes', [2420, 260], buildRevise),
  http(13, 'Revise with the review (Kiro)', [2640, 260], writerCall('/revise', '={{ JSON.stringify({ draft: $json.draft, issues: $json.issues }) }}'), { credentials: KIRO }),
  ifOk(14, 'Revision passed the checks?', [2860, 260], '={{ $json.ok === true }}'),
  code(15, 'Mark as revised', [3080, 200], markRevised),
  code(16, 'Ready to publish', [3300, 100], readyToPublish),
  http(17, 'Publish on the site', [3520, 100], { method: 'POST', url: `${SITE}/api/cron/articles`, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.article) }}', options: { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } }, { credentials: CRON }),
  code(18, 'After publish', [3740, 100], afterPublish),
  ifOk(19, 'Published?', [3960, 100], '={{ $json.published === true }}'),
  http(20, 'Submit to IndexNow', [4180, 0], { method: 'POST', url: 'https://api.indexnow.org/indexnow', sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.indexnow) }}', options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'text' } } } }),
  code(21, 'Compose the announcement', [4400, 0], composePublished),
  telegram(22, 'Telegram: article published', [4620, 0]),
  code(23, 'Compose the problem report', [3740, 420], composeProblem),
  telegram(24, 'Telegram: no article today', [3960, 420]),
];

const link = (to) => ({ node: to, type: 'main', index: 0 });
const connections = {
  'Daily at 08:30': { main: [[link('Published today already?')]] },
  'Run now': { main: [[link('Published today already?')]] },
  'Published today already?': { main: [[link('List the feeds')]] },
  'List the feeds': { main: [[link('Fetch feed')]] },
  'Fetch feed': { main: [[link('Pick trending candidates')]] },
  'Pick trending candidates': { main: [[link('Research and write (Kiro)')]] },
  'Research and write (Kiro)': { main: [[link('Written and checked?')]] },
  'Written and checked?': { main: [[link('Ask for an independent review')], [link('Compose the problem report')]] },
  'Ask for an independent review': { main: [[link('Fact-check (Nemotron, OpenRouter)')]] },
  'Fact-check (Nemotron, OpenRouter)': { main: [[link('Read the verdict')]] },
  'Read the verdict': { main: [[link('Review passed?')]] },
  'Review passed?': { main: [[link('Ready to publish')], [link('Prepare the fixes')]] },
  'Prepare the fixes': { main: [[link('Revise with the review (Kiro)')]] },
  'Revise with the review (Kiro)': { main: [[link('Revision passed the checks?')]] },
  'Revision passed the checks?': { main: [[link('Mark as revised')], [link('Compose the problem report')]] },
  'Mark as revised': { main: [[link('Ready to publish')]] },
  'Ready to publish': { main: [[link('Publish on the site')]] },
  'Publish on the site': { main: [[link('After publish')]] },
  'After publish': { main: [[link('Published?')]] },
  'Published?': { main: [[link('Submit to IndexNow')], [link('Compose the problem report')]] },
  'Submit to IndexNow': { main: [[link('Compose the announcement')]] },
  'Compose the announcement': { main: [[link('Telegram: article published')]] },
  'Compose the problem report': { main: [[link('Telegram: no article today')]] },
};

const workflow = {
  id: 'paisaDailyArticle1',
  name: 'Content: daily verified article (Kiro writes, Nemotron checks, Telegram reports)',
  active: false,
  settings: { executionOrder: 'v1', timezone: 'Asia/Kolkata', errorWorkflow: 'paisaErrorAlert1', saveDataSuccessExecution: 'all', saveDataErrorExecution: 'all', executionTimeout: -1 },
  nodes,
  connections,
  pinData: {},
};
writeFileSync(join(HERE, 'workflows', '09-daily-article.json'), JSON.stringify(workflow, null, 2) + '\n');
console.log(`wrote workflows/09-daily-article.json (${nodes.length} nodes)`);
