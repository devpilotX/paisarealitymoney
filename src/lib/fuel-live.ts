/**
 * Live daily petrol/diesel state rates.
 *
 * CarDekho publishes server-rendered state-wise petrol and diesel tables on a
 * single page, sourced from the OMCs' daily 6 AM revision. We fetch it once
 * per cron run, parse both tables, and sanity-check every value against our
 * verified baseline (±15%) so a markup change can never poison prices — any
 * state that fails parsing or sanity simply falls back to the baseline, and
 * the existing staleness alert emails the admin if the live feed stays broken.
 *
 * Set FUEL_LIVE_FETCH=off to disable without a deploy.
 */
import { STATE_FUEL } from './fuel-data';

export interface LiveStateFuel {
  petrol: Record<string, number>;
  diesel: Record<string, number>;
}

export const FUEL_LIVE_SOURCE = 'OMC daily published rates via CarDekho';

/** CarDekho state names that differ from our STATE_FUEL keys. */
const STATE_NAME_MAP: Record<string, string> = {
  'Jammu and Kashmir': 'Jammu & Kashmir',
  Pondicherry: 'Puducherry',
};

function normalizeStateName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ');
  return STATE_NAME_MAP[name] ?? name;
}

/**
 * Pull `<a href="...{fuel}-price-in-X-state" ...>State</a></td><td>₹NNN.NN`
 * rows out of the page HTML. Pure so tests can feed it fixture HTML.
 */
export function parseStateFuelTable(html: string, fuel: 'petrol' | 'diesel'): Record<string, number> {
  const out: Record<string, number> = {};
  const pattern = new RegExp(
    `${fuel}-price-in-[a-z-]+-state"[^>]*>([A-Za-z &]+)</a></td><td>(?:\\u20B9|&#8377;|&#x20b9;)\\s*([0-9]+(?:\\.[0-9]+)?)`,
    'g'
  );
  for (const match of html.matchAll(pattern)) {
    const state = normalizeStateName(match[1] ?? '');
    const price = Number.parseFloat(match[2] ?? '');
    if (state && Number.isFinite(price) && price > 0) out[state] = price;
  }
  return out;
}

/**
 * Keep only values within tolerance of the verified baseline. Protects the
 * site from a source markup change or a garbage parse.
 */
export function filterSaneStates(
  parsed: Record<string, number>,
  fuel: 'petrol' | 'diesel',
  tolerance = 0.15
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [state, price] of Object.entries(parsed)) {
    const baseline = STATE_FUEL[state]?.[fuel];
    if (baseline === undefined) continue;
    if (Math.abs(price - baseline) / baseline <= tolerance) out[state] = price;
  }
  return out;
}

/** Fetch and parse the live state tables. Returns null on any failure. */
export async function fetchLiveStateFuel(): Promise<LiveStateFuel | null> {
  if ((process.env.FUEL_LIVE_FETCH || '').toLowerCase() === 'off') return null;
  const url = process.env.FUEL_LIVE_URL || 'https://www.cardekho.com/petrol-price';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    // Note: no `cache` option — Next 15+ fetch defaults to no-store, and the
    // option is absent from the plain Node RequestInit type used by tests.
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PaisaRealityBot/1.0; +https://paisareality.com/methodology)' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();

    const petrol = filterSaneStates(parseStateFuelTable(html, 'petrol'), 'petrol');
    const diesel = filterSaneStates(parseStateFuelTable(html, 'diesel'), 'diesel');

    // Require broad coverage — a half-parsed page is a red flag, not data.
    if (Object.keys(petrol).length < 15 || Object.keys(diesel).length < 15) return null;
    return { petrol, diesel };
  } catch {
    return null;
  }
}
