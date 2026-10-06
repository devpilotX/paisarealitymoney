// Pure helpers for the article writer service. No I/O, so deploy/writer/lib.test.mjs covers them.
import { validateArticle, isOfficialSource } from '../../src/lib/article-core.ts';

export { validateArticle, isOfficialSource };

/** Pulls the JSON object out of the model's final message (a ```json fence, or the outermost braces). */
export function extractJson(text) {
  const s = String(text ?? '');
  const fence = s.match(/```json\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fence) candidates.push(fence[1]);
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(s.slice(first, last + 1));
  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch { /* try the next candidate */ }
  }
  return null;
}

/** Straight quotes and apostrophes, plain spaces, no zero-width characters. Leaves em dashes for the model to fix. */
export function tidyTypography(s) {
  return String(s ?? '')
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/(\d)\u2013(\d)/g, '$1-$2');
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: '-', mdash: '-', rupee: 'rs', hellip: '...' };

/** Visible text of an HTML page, normalised for quote matching. */
export function pageText(html) {
  return normalizeForMatch(
    String(html ?? '')
      .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? ' '),
  );
}

export function normalizeForMatch(s) {
  return tidyTypography(s)
    .toLowerCase()
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u20b9/g, 'rs ')
    .replace(/\brs\.?\s*/g, 'rs ')
    .replace(/[^a-z0-9%.,\-'" ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * True when the quote appears on the page: exactly after normalisation, or with at least
 * 85% of its four-word shingles present (survives a line break, a footnote marker or a
 * changed punctuation mark, not a different sentence).
 */
export function quoteFound(quote, normalizedPage) {
  const q = normalizeForMatch(quote);
  if (q.length < 15) return false;
  if (normalizedPage.includes(q)) return true;
  const words = q.split(' ');
  if (words.length < 6) return false;
  const shingles = [];
  for (let i = 0; i + 4 <= words.length; i++) shingles.push(words.slice(i, i + 4).join(' '));
  const hits = shingles.filter((sh) => normalizedPage.includes(sh)).length;
  return hits / shingles.length >= 0.85;
}

/** Parses the human-prose detector's report lines: "high   <stdin>:12  [rule] detail". */
export function parseDetector(output) {
  const findings = [];
  for (const line of String(output ?? '').split(/\r?\n/)) {
    const m = line.match(/^(high|medium|low)\s+\S+:(\d+)\s+\[([^\]]+)\]\s*(.*)$/);
    if (m) findings.push({ severity: m[1], line: Number(m[2]), rule: m[3], detail: m[4].trim() });
  }
  const count = (s) => findings.filter((f) => f.severity === s).length;
  return { findings, high: count('high'), medium: count('medium'), low: count('low') };
}

/** The text the detector scans: everything a reader sees. */
export function readerText(a) {
  return [a.title, '', a.description, '', a.content].join('\n');
}

/**
 * Turns every check into a list of problems for the next revision, and a publish decision.
 *   final=true relaxes medium detector findings to at most two (high are never accepted).
 */
export function assess({ article, validation, detector, sourceChecks, claimChecks }, final = false) {
  const problems = [];
  if (!validation.ok) for (const e of validation.errors) problems.push(`Publishing rule: ${e}.`);

  for (const f of detector.findings.filter((x) => x.severity === 'high' || x.severity === 'medium')) {
    problems.push(`Style (${f.severity}, ${f.rule}) on line ${f.line} of title+description+content: ${f.detail}`);
  }

  for (const s of sourceChecks) {
    if (!s.reachable) problems.push(`Source ${s.url} could not be opened (${s.status}). Replace it with a page that loads.`);
  }

  const verified = claimChecks.filter((c) => c.verified);
  for (const c of claimChecks.filter((x) => !x.verified)) {
    problems.push(`Claim not found on its source: "${c.claim}" cites ${c.source_url}, but the quote "${String(c.quote).slice(0, 160)}" is not on that page (${c.reason}). Copy the exact words from the page, cite another fetched page that says it, or remove the claim from the article.`);
  }
  const officialVerified = verified.filter((c) => isOfficialSource(c.source_url)).length;
  if (claimChecks.length < 5) problems.push(`Only ${claimChecks.length} claims listed; list every number, date, rate and rule (at least 5).`);
  if (officialVerified < 2) problems.push('Fewer than two claims are confirmed on an official page. Confirm the key facts on the regulator or ministry page.');

  const ratio = claimChecks.length ? verified.length / claimChecks.length : 0;
  const mediumOk = final ? detector.medium <= 2 : detector.medium === 0;
  const publishable =
    validation.ok && detector.high === 0 && mediumOk &&
    sourceChecks.every((s) => s.reachable) &&
    claimChecks.length >= 5 && ratio === 1 && officialVerified >= 2;

  return {
    publishable,
    problems,
    summary: {
      words: article?.content ? String(article.content).split(/\s+/).filter(Boolean).length : 0,
      claimsVerified: verified.length,
      claimsTotal: claimChecks.length,
      officialClaimsVerified: officialVerified,
      sources: sourceChecks.length,
      officialSources: sourceChecks.filter((s) => s.official).length,
      detector: { high: detector.high, medium: detector.medium, low: detector.low },
    },
  };
}
