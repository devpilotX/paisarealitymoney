#!/usr/bin/env node
// Paisa Reality article writer: a small HTTP service on 127.0.0.1 that n8n calls once a day.
//
//   POST /write   { candidates: [...], recent: [...] }            research, write and check a new article
//   POST /revise  { draft: {...article json...}, issues: [...] } fix a draft after the independent review
//   GET  /health
//
// It runs Kiro CLI headless (agent "paisa-writer", web_fetch only, no file or shell tools)
// with the Kiro API key that n8n sends in X-Kiro-Api-Key. The key lives only in the n8n
// credential, so rotating it is an edit in n8n. Every draft goes through three checks
// before it is returned: the site's publishing rules, the human-prose detector, and a
// fetch of every source to confirm each quoted fact is really on that page. Problems go
// back to the model for up to two revisions.
//
// Listens on 127.0.0.1 only. There is no separate token: every call must carry a valid Kiro key,
// and the key is what pays for the run. Runs as the unprivileged user kirowriter
// (systemd unit paisareality-writer.service).
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractJson, tidyTypography, pageText, quoteFound, parseDetector, readerText, assess, validateArticle, isOfficialSource,
} from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.WRITER_PORT || 5690);
const KIRO = process.env.KIRO_BIN || `${process.env.HOME}/.local/bin/kiro-cli`;
const MODELS = (process.env.WRITER_MODELS || 'claude-opus-5.5,claude-opus-5,claude-sonnet-5.5').split(',').map((s) => s.trim()).filter(Boolean);
const RUN_TIMEOUT_MS = Number(process.env.WRITER_RUN_TIMEOUT_MS || 20 * 60 * 1000);
const MAX_REVISIONS = 2;
const UA = 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const read = (p) => readFileSync(join(HERE, p), 'utf8');
const SKILLS = [
  ['human-prose', read('skills/human-prose/SKILL.md')],
  ['human-prose: catalogue of tells', read('skills/human-prose/references/tells-catalogue.md')],
  ['human-prose: rewrite method', read('skills/human-prose/references/rewrite-method.md')],
  ['deep-research: grading sources', read('skills/deep-research/source-grading.md')],
];
const INTERNAL_LINKS = [
  '/gold-rate', '/silver-rate', '/petrol-price', '/diesel-price', '/lpg-price', '/interest-rates',
  '/bank-rates/fd-rates', '/bank-rates/savings-rates', '/bank-rates/home-loan-rates', '/calculators/income-tax',
  '/calculators/emi', '/calculators/home-loan', '/calculators/fd', '/calculators/sip', '/calculators/ppf',
  '/calculators/nps', '/calculators/hra', '/calculators/gratuity', '/guides/old-vs-new-tax-regime',
  '/guides/sip-vs-fd', '/guides/ppf-vs-nps', '/schemes', '/scholarships', '/score',
];
const DETECTOR = join(HERE, 'skills/human-prose/scripts/ai_tells.py');

const log = (...a) => console.log(new Date().toISOString(), ...a);
let busy = false;

function todayIst() {
  return new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function skillBlock() {
  return SKILLS.map(([name, body]) => `\n\n---\n\n# Skill: ${name}\n\n${body.replace(/^---[\s\S]*?---\s*/, '')}`).join('');
}

function writePrompt(candidates, recent) {
  const brief = read('brief.md').replace('{{TODAY}}', todayIst()).replace('{{INTERNAL_LINKS}}', INTERNAL_LINKS.join(', '));
  const items = (candidates || []).slice(0, 40).map((c, i) =>
    `${i + 1}. ${c.title}${c.source ? ` (${c.source})` : ''}${c.published ? `, ${c.published}` : ''}${c.traffic ? `, searches ${c.traffic}` : ''}${c.url ? `\n   ${c.url}` : ''}`).join('\n');
  const done = (recent || []).slice(0, 60).map((r) => `- ${r.title || r}`).join('\n') || '- (none)';
  return `${brief}${skillBlock()}\n\n---\n\n# Trending items today\n\n${items || '(the feeds returned nothing; use the official feeds)'}\n\n# Recently published on Paisa Reality (do not repeat these)\n\n${done}\n`;
}

function revisePrompt(draft, problems) {
  return `${read('brief.md').replace('{{TODAY}}', todayIst()).replace('{{INTERNAL_LINKS}}', INTERNAL_LINKS.join(', '))}${skillBlock()}

---

# Revision

Your draft below failed these checks. Fix every one. You may fetch pages again to confirm facts. Keep
what is right, change only what each problem needs, and return the complete JSON again in the same
format (one fenced json block, nothing else). Do not invent a quote: if a page does not say it, remove
the claim from the article.

## Problems

${problems.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Draft

\`\`\`json
${JSON.stringify(draft, null, 2)}
\`\`\`
`;
}

/** One headless Kiro run. Resolves with the final message, or rejects with a short reason. */
function runKiro(prompt, apiKey, model) {
  return new Promise((resolve, reject) => {
    const work = mkdtempSync(join(tmpdir(), 'paisa-writer-'));
    const child = spawn(KIRO, ['chat', '--v3', '--no-interactive', '--agent', 'paisa-writer', '--model', model, '--effort', 'high', '--output-format', 'stream-json'], {
      cwd: work,
      env: { HOME: process.env.HOME, PATH: `${process.env.HOME}/.local/bin:/usr/local/bin:/usr/bin:/bin`, LANG: 'C.UTF-8', KIRO_API_KEY: apiKey },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let buf = '';
    let finalText = null;
    let error = null;
    let credits = 0;
    let fetches = 0;
    const timer = setTimeout(() => { error = 'timed out'; child.kill('SIGTERM'); }, RUN_TIMEOUT_MS);
    child.stdout.on('data', (d) => {
      buf += d;
      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        let e;
        try { e = JSON.parse(line); } catch { continue; }
        const data = e.data || {};
        if (e.type === 'runFinished') { finalText = data.finalText ?? ''; if (data.status && data.status !== 'success') error = `run ${data.status}`; }
        if (e.type === 'runError') error = String(data.message || 'run error').slice(0, 300);
        if (e.type === 'metadata' && Array.isArray(data.meteringUsage)) for (const m of data.meteringUsage) credits += Number(m.value) || 0;
        if (data.update?.sessionUpdate === 'tool_call') fetches++;
      }
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr = (stderr + d).slice(-4000); });
    child.on('close', (code) => {
      clearTimeout(timer);
      rmSync(work, { recursive: true, force: true });
      if (finalText !== null && !(error && /needs upgrading|not found|unknown model|invalid model/i.test(error))) {
        resolve({ text: finalText, credits, fetches, model });
      } else {
        const hint = /unauthori|401|403|invalid api key|expired/i.test(stderr + error) ? 'Kiro API key rejected (rotate it in n8n: credential "Kiro API key")' : (error || `kiro-cli exited ${code}`);
        reject(new Error(`${hint}${stderr && !error ? `: ${stderr.split('\n').filter((l) => /error/i.test(l)).slice(-2).join(' | ')}` : ''}`));
      }
    });
    child.stdin.end(prompt);
  });
}

async function runWithFallback(prompt, apiKey) {
  let last;
  for (const model of MODELS) {
    try {
      return await runKiro(prompt, apiKey, model);
    } catch (e) {
      last = e;
      // A rejected key will not work on another model either.
      if (/API key rejected/.test(e.message)) throw e;
      log(`model ${model} failed: ${e.message}`);
    }
  }
  throw last;
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-IN,en;q=0.9' } });
    const type = res.headers.get('content-type') || '';
    const body = Buffer.from(await res.arrayBuffer());
    return { status: res.status, type, body };
  } catch (e) {
    // Several government servers send an incomplete certificate chain that browsers repair
    // and Node does not. Read those pages with curl; only their public text is compared.
    const code = String(e?.cause?.code || '');
    if (/UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT|SELF_SIGNED_CERT_IN_CHAIN/.test(code)) {
      const r = spawnSync('curl', ['-skL', '-m', '25', '-A', UA, '-w', '\n%{http_code} %{content_type}', url], { maxBuffer: 30 * 1024 * 1024 });
      const out = r.stdout || Buffer.alloc(0);
      const cut = out.lastIndexOf(10);
      const [status, type] = out.subarray(cut + 1).toString().split(' ');
      return { status: Number(status) || 0, type: type || '', body: out.subarray(0, cut) };
    }
    return { status: 0, type: '', body: Buffer.alloc(0), error: e?.name === 'AbortError' ? 'timeout' : code || 'network error' };
  } finally {
    clearTimeout(t);
  }
}

function textOf({ type, body }) {
  if (/pdf/i.test(type) || body.subarray(0, 5).toString() === '%PDF-') {
    const r = spawnSync('pdftotext', ['-layout', '-', '-'], { input: body, maxBuffer: 30 * 1024 * 1024 });
    return pageText(r.status === 0 ? r.stdout.toString('utf8') : '');
  }
  return pageText(body.toString('utf8'));
}

async function checkSources(article, claims) {
  const urls = [...new Set([...(article.sources || []).map((s) => s.url), ...claims.map((c) => c.source_url)].filter((u) => /^https?:\/\//.test(String(u))))];
  const pages = new Map();
  const sourceChecks = [];
  for (const url of urls) {
    const r = await fetchText(url);
    const reachable = r.status >= 200 && r.status < 400;
    const text = reachable ? textOf(r) : '';
    pages.set(url, { reachable, text, status: r.status || r.error });
    sourceChecks.push({ url, reachable, status: String(r.status || r.error), official: isOfficialSource(url), chars: text.length });
  }
  const claimChecks = claims.map((c) => {
    const page = pages.get(c.source_url);
    if (!page) return { ...c, verified: false, reason: 'source URL missing or invalid' };
    if (!page.reachable) return { ...c, verified: false, reason: `page did not load (${page.status})` };
    if (page.text.length < 200) return { ...c, verified: false, reason: 'page had no readable text' };
    return quoteFound(c.quote, page.text) ? { ...c, verified: true } : { ...c, verified: false, reason: 'quote not on page' };
  });
  return { sourceChecks, claimChecks };
}

function runDetector(text) {
  const r = spawnSync('python3', [DETECTOR, '--strict'], { input: text, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (r.status === 2 || r.error) throw new Error(`detector failed: ${r.stderr || r.error}`);
  return parseDetector(r.stdout);
}

function cleanDraft(raw) {
  const a = { ...raw };
  for (const k of ['title', 'metaTitle', 'metaDescription', 'description', 'content', 'topic', 'topicKey']) {
    if (typeof a[k] === 'string') a[k] = tidyTypography(a[k]).trim();
  }
  a.claims = Array.isArray(a.claims) ? a.claims.filter((c) => c && c.claim && c.source_url && c.quote).map((c) => ({ claim: tidyTypography(c.claim), source_url: String(c.source_url).trim(), quote: String(c.quote) })) : [];
  return a;
}

async function evaluate(draft, final) {
  const validation = validateArticle(draft);
  const detector = runDetector(readerText(draft));
  const { sourceChecks, claimChecks } = await checkSources(draft, draft.claims);
  return { ...assess({ article: draft, validation, detector, sourceChecks, claimChecks }, final), sourceChecks, claimChecks, detector };
}

/** Write (or revise) until every check passes, with at most MAX_REVISIONS rewrites. */
async function produce(apiKey, firstPrompt, startDraft = null) {
  const report = { attempts: [], credits: 0, model: null, fetches: 0 };
  let prompt = firstPrompt;
  let draft = startDraft;
  for (let attempt = 0; attempt <= MAX_REVISIONS; attempt++) {
    const run = await runWithFallback(prompt, apiKey);
    report.credits += run.credits;
    report.fetches += run.fetches;
    report.model = run.model;
    const parsed = extractJson(run.text);
    if (!parsed) {
      report.attempts.push({ attempt, problems: ['reply was not JSON'] });
      prompt = revisePrompt(draft || { note: 'no usable draft yet' }, ['Your reply was not a single valid JSON object in a ```json fence. Return only that.']);
      continue;
    }
    if (parsed.skip) return { ok: false, skip: true, reason: String(parsed.reason || 'no suitable verified topic today'), report };
    draft = cleanDraft(parsed);
    const final = attempt === MAX_REVISIONS;
    const ev = await evaluate(draft, final);
    report.attempts.push({ attempt, problems: ev.problems.length, summary: ev.summary });
    log(`attempt ${attempt}: ${ev.problems.length} problems, publishable=${ev.publishable}`, JSON.stringify(ev.summary));
    if (ev.publishable) {
      const { claims, topic, ...article } = draft;
      return { ok: true, article, claims: ev.claimChecks, sources: ev.sourceChecks, topic, summary: ev.summary, notes: ev.problems, report };
    }
    if (final) return { ok: false, reason: 'draft did not pass the checks after two revisions', problems: ev.problems.slice(0, 15), draftTitle: draft.title, report };
    prompt = revisePrompt(draft, ev.problems.slice(0, 40));
  }
  return { ok: false, reason: 'no usable draft', report };
}


function send(res, status, body) {
  const s = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(s) });
  res.end(s);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 2_000_000) throw new Error('body too large');
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, busy, models: MODELS });
    if (req.method !== 'POST' || !['/write', '/revise'].includes(req.url)) return send(res, 404, { ok: false, reason: 'not found' });
    const apiKey = String(req.headers['x-kiro-api-key'] || '').trim();
    if (!/^ksk_[A-Za-z0-9_-]{16,}$/.test(apiKey)) return send(res, 400, { ok: false, reason: 'missing or malformed Kiro API key (n8n credential "Kiro API key")' });
    if (busy) return send(res, 409, { ok: false, reason: 'a run is already in progress' });
    const body = await readJson(req);
    busy = true;
    const started = Date.now();
    try {
      const result = req.url === '/write'
        ? await produce(apiKey, writePrompt(body.candidates, body.recent))
        : await produce(apiKey, revisePrompt(body.draft || {}, (body.issues || []).map((i) => `Independent fact-check: ${typeof i === 'string' ? i : JSON.stringify(i)}`)), body.draft || null);
      result.report.seconds = Math.round((Date.now() - started) / 1000);
      log(`${req.url} done in ${result.report.seconds}s ok=${result.ok} credits=${result.report.credits.toFixed(2)}`);
      return send(res, 200, result);
    } finally {
      busy = false;
    }
  } catch (e) {
    log('request failed:', e.message);
    return send(res, 200, { ok: false, reason: String(e.message).slice(0, 400), report: {} });
  }
});

server.requestTimeout = 0;
server.headersTimeout = 60_000;
server.listen(PORT, '127.0.0.1', () => log(`writer listening on 127.0.0.1:${PORT}, models ${MODELS.join(' > ')}`));
