/**
 * Rules for articles that arrive from the daily research workflow (and for the sources
 * list on any article). Pure and dependency-free, so tests import it and the publish
 * API and the writer apply exactly the same checks.
 */

export const ARTICLE_CATEGORIES = [
  'finance', 'gold', 'silver', 'fuel', 'schemes', 'tax', 'investment', 'insurance', 'banking', 'budgeting',
] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

/** Primary sources: regulators, ministries and the government portals they publish on. */
const OFFICIAL_HOSTS = [
  'rbi.org.in', 'sebi.gov.in', 'irdai.gov.in', 'pfrda.org.in', 'npci.org.in', 'epfindia.gov.in',
  'incometax.gov.in', 'incometaxindia.gov.in', 'cbic.gov.in', 'gst.gov.in', 'finmin.gov.in',
  'pib.gov.in', 'indiabudget.gov.in', 'egazette.gov.in', 'nsiindia.gov.in', 'indiapost.gov.in',
  'mospi.gov.in', 'dea.gov.in', 'financialservices.gov.in', 'nseindia.com', 'bseindia.com',
  'amfiindia.com', 'uidai.gov.in', 'india.gov.in', 'myscheme.gov.in', 'ppac.gov.in',
];

export function hostOf(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.hostname.toLowerCase().replace(/^www\./, '') : null;
  } catch {
    return null;
  }
}

/** True for a regulator, ministry or any *.gov.in / *.nic.in host. */
export function isOfficialSource(url: string): boolean {
  const h = hostOf(url);
  if (!h) return false;
  if (h.endsWith('.gov.in') || h.endsWith('.nic.in')) return true;
  return OFFICIAL_HOSTS.some((o) => h === o || h.endsWith(`.${o}`));
}

export interface ArticleSource { title: string; url: string }

/** Reads the sources column (jsonb, may be null or malformed) into a clean list. */
export function parseSources(raw: unknown): ArticleSource[] {
  if (!Array.isArray(raw)) return [];
  const out: ArticleSource[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const url = String((item as { url?: unknown }).url ?? '').trim();
    const title = String((item as { title?: unknown }).title ?? '').trim().slice(0, 200);
    if (!/^https:\/\//i.test(url) || !hostOf(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ title: title || hostOf(url) || url, url });
  }
  return out;
}

/** "RBI repo rate cut, Oct 2026!" -> "rbi-repo-rate-cut-oct-2026" */
export function normalizeTopicKey(input: string): string {
  return input.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function wordCount(markdown: string): number {
  return markdown.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`|[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

/** Leftovers that must never reach a published page. */
const FORBIDDEN: Array<[RegExp, string]> = [
  [/\[\s*insert[^\]]*\]/i, 'an unfilled [insert ...] placeholder'],
  [/\b(TODO|TBD|lorem ipsum)\b/, 'a placeholder word'],
  [/\bas an ai\b|\blanguage model\b|\bI hope this helps\b|\bknowledge cutoff\b/i, 'text addressed to the operator'],
  [/oaicite|turn\d+search|contentReference\[|utm_source=chatgpt/i, 'leaked chatbot citation markup'],
  [/\u2014/, 'an em dash'],
];

export interface ArticleInput {
  title: string;
  description: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  sources: ArticleSource[];
  topicKey: string;
}

export type ArticleValidation = { ok: true; value: ArticleInput } | { ok: false; errors: string[] };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Validates an article from the workflow. Collects every problem so one round trip fixes all of them. */
export function validateArticle(b: Record<string, unknown>): ArticleValidation {
  const errors: string[] = [];
  const title = str(b.title).replace(/\s+/g, ' ');
  const description = str(b.description).replace(/\s+/g, ' ');
  const content = str(b.content).replace(/\r\n/g, '\n');
  const metaTitle = str(b.metaTitle).replace(/\s+/g, ' ');
  const metaDescription = str(b.metaDescription).replace(/\s+/g, ' ');
  const category = str(b.category).toLowerCase() as ArticleCategory;
  const tags = (Array.isArray(b.tags) ? b.tags : [])
    .map((t) => str(t).toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 8);
  const sources = parseSources(b.sources);
  const topicKey = normalizeTopicKey(str(b.topicKey) || title);

  if (title.length < 20 || title.length > 110) errors.push(`title must be 20-110 characters (is ${title.length})`);
  if (metaTitle.length < 30 || metaTitle.length > 60) errors.push(`metaTitle must be 30-60 characters (is ${metaTitle.length})`);
  if (metaDescription.length < 70 || metaDescription.length > 155) errors.push(`metaDescription must be 70-155 characters (is ${metaDescription.length})`);
  if (description.length < 50 || description.length > 300) errors.push(`description must be 50-300 characters (is ${description.length})`);
  if (!(ARTICLE_CATEGORIES as readonly string[]).includes(category)) errors.push(`category must be one of ${ARTICLE_CATEGORIES.join(', ')}`);

  const words = wordCount(content);
  if (words < 700 || words > 3500) errors.push(`content must be 700-3500 words (is ${words})`);
  if (/^#\s/m.test(content)) errors.push('content must not contain a level-1 heading; the page renders the title');
  if ((content.match(/^##\s+\S/gm) || []).length < 3) errors.push('content needs at least three ## section headings');
  for (const [rx, what] of FORBIDDEN) {
    if (rx.test(content) || rx.test(title) || rx.test(description)) errors.push(`contains ${what}`);
  }

  if (sources.length < 2 || sources.length > 12) errors.push(`needs 2-12 https sources (has ${sources.length})`);
  if (!sources.some((s) => isOfficialSource(s.url))) errors.push('needs at least one official source (regulator, ministry or .gov.in)');
  if (topicKey.length < 5) errors.push('topicKey is missing');

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { title, description, content, category, tags, metaTitle, metaDescription, sources, topicKey } };
}
