/** Link health check used by the grants upkeep. No database access, so tests can import it. */
const TLS_CHAIN_CODES = new Set(['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'SELF_SIGNED_CERT_IN_CHAIN']);
const CHECK_TIMEOUT_MS = 20_000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 PaisaRealityLinkCheck/1.0 (+https://paisareality.com/methodology)';

export interface LinkResult {
  ok: boolean;
  status: string;
}

/** Pure, for tests: is this HTTP status a working page? */
export function isHealthyStatus(status: number): boolean {
  return status >= 200 && status < 400;
}

export async function checkUrl(url: string, fetchImpl: typeof fetch = fetch): Promise<LinkResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    });
    // Some portals answer 403/405 to automated clients while the page works for people.
    // Treat those as "reachable" rather than hiding a live programme.
    const ok = isHealthyStatus(res.status) || res.status === 403 || res.status === 405 || res.status === 429;
    return { ok, status: String(res.status) };
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    const code = String((e as { cause?: { code?: string } })?.cause?.code ?? '');
    // Several government servers send an incomplete certificate chain. Browsers repair
    // it and the page opens normally; Node does not. The server answered, so the link
    // is reachable for readers, and hiding the programme would be wrong.
    if (TLS_CHAIN_CODES.has(code)) return { ok: true, status: 'reachable (incomplete certificate chain)' };
    return { ok: false, status: name === 'AbortError' ? 'timeout' : code ? 'network error ' + code : 'network error' };
  } finally {
    clearTimeout(timer);
  }
}
