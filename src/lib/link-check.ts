/** Link health checks used by the grants upkeep and the official-link monitor. No database access, so tests can import it. */
import { createHash } from 'crypto';

const TLS_CHAIN_CODES = new Set(['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'SELF_SIGNED_CERT_IN_CHAIN']);
const CHECK_TIMEOUT_MS = 20_000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 PaisaRealityLinkCheck/1.0 (+https://paisareality.com/methodology)';

export interface LinkResult {
  ok: boolean;
  status: string;
  /** Fingerprint of the page's visible text, when the page was fetched as HTML. */
  contentHash?: string;
}

/** Pure, for tests: is this HTTP status a working page? */
export function isHealthyStatus(status: number): boolean {
  return status >= 200 && status < 400;
}

/**
 * The visible text of an HTML page, reduced to what a reader would notice changing.
 * Scripts, styles, tags, dates and clock times are dropped, so a page that only
 * updates a date stamp or a visitor counter does not look changed.
 */
export function visibleTextFingerprint(html: string): string {
  const text = html
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?\b/gi, ' ')
    .replace(/\b(visitors?|hits|last updated|updated on)\b[^.]{0,40}/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return createHash('sha256').update(text.slice(0, 20000)).digest('hex').slice(0, 32);
}

export async function checkUrl(url: string, fetchImpl: typeof fetch = fetch, opts: { hash?: boolean } = {}): Promise<LinkResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    });
    // Some portals answer 403/405/429 to automated clients while the page works for people.
    const ok = isHealthyStatus(res.status) || res.status === 403 || res.status === 405 || res.status === 429;
    let contentHash: string | undefined;
    if (opts.hash && isHealthyStatus(res.status) && /html/i.test(res.headers.get('content-type') ?? 'text/html')) {
      contentHash = visibleTextFingerprint(await res.text());
    }
    return { ok, status: String(res.status), contentHash };
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    const code = String((e as { cause?: { code?: string } })?.cause?.code ?? '');
    // Several government servers send an incomplete certificate chain. Browsers repair
    // it and the page opens normally; Node does not. The server answered, so it is reachable.
    if (TLS_CHAIN_CODES.has(code)) return { ok: true, status: 'reachable (incomplete certificate chain)' };
    return { ok: false, status: name === 'AbortError' ? 'timeout' : code ? 'network error ' + code : 'network error' };
  } finally {
    clearTimeout(timer);
  }
}
