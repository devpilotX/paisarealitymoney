/**
 * Self-policing accuracy check for gold and silver.
 *
 * Our displayed metal rate is a deterministic function of the international
 * spot price and our tuned knobs (import duty, GST, market premium), so no
 * check built from those same inputs can tell whether the knobs still match
 * the real Indian market. The only way to detect drift (for example an import
 * duty change we have not re-fitted for) is to compare against an independent
 * published dealer benchmark. This module does exactly that and returns admin
 * alert lines when our rate drifts beyond a threshold.
 *
 * Advisory only. Every network path fails open (returns null) and never throws,
 * so a flaky or blocked reference source can never break the daily price cron.
 */

export interface MetalDrift {
  metal: 'gold' | 'silver';
  ours: number;
  reference: number;
  /** Signed percentage: positive means our rate is above the reference. */
  driftPct: number;
  threshold: number;
  exceeds: boolean;
}

/**
 * Pure: signed drift of our rate versus a reference, and whether it breaches the
 * band. Returns null for non-positive or non-finite inputs so callers skip them.
 */
export function assessDrift(
  metal: 'gold' | 'silver',
  ours: number,
  reference: number,
  thresholdPct: number,
): MetalDrift | null {
  if (![ours, reference, thresholdPct].every((n) => Number.isFinite(n)) || ours <= 0 || reference <= 0) {
    return null;
  }
  const driftPct = Math.round(((ours - reference) / reference) * 1000) / 10;
  return { metal, ours, reference, driftPct, threshold: thresholdPct, exceeds: Math.abs(driftPct) > thresholdPct };
}

/** Strip tags and normalise rupee markup so the rate parsers work on plain text. */
function toText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8377;|&#x20b9;|&#x20B9;|₹|Rs\.?/gi, '₹')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ');
}

/** Pure: extract the 24K gold rate (Rs per gram) from a dealer page's HTML. */
export function parseGold24kPerGram(html: string): number | null {
  const text = toText(html);
  const patterns = [
    /₹\s*([\d,]+(?:\.\d+)?)\s*per gram for 24\s*(?:karat|carat|k)/i,
    /24\s*(?:karat|carat|k)[^₹]{0,40}₹\s*([\d,]+(?:\.\d+)?)\s*per gram/i,
  ];
  return matchNumber(text, patterns, 5000, 200000);
}

/** Pure: extract the silver rate (Rs per gram) from a dealer page's HTML. */
export function parseSilverPerGram(html: string): number | null {
  const text = toText(html);
  const patterns = [
    /silver[^₹]{0,60}₹\s*([\d,]+(?:\.\d+)?)\s*per gram/i,
    /₹\s*([\d,]+(?:\.\d+)?)\s*per gram/i,
  ];
  return matchNumber(text, patterns, 20, 20000);
}

function matchNumber(text: string, patterns: RegExp[], min: number, max: number): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const n = Number.parseFloat(m[1].replace(/,/g, ''));
      if (Number.isFinite(n) && n >= min && n <= max) return n;
    }
  }
  return null;
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export interface ReferenceRates {
  gold24kPerGram: number | null;
  silverPerGram: number | null;
  source: string;
}

/**
 * Fetch an independent published dealer benchmark. Defaults to GoodReturns
 * India pages; both URLs are env-tunable so the source can be swapped without a
 * code deploy if the markup ever changes.
 */
export async function fetchReferenceMetalRates(): Promise<ReferenceRates> {
  const goldUrl = process.env.GOLD_REFERENCE_URL || 'https://www.goodreturns.in/gold-rates/';
  const silverUrl = process.env.SILVER_REFERENCE_URL || 'https://www.goodreturns.in/silver-rates/';
  const [goldHtml, silverHtml] = await Promise.all([fetchText(goldUrl), fetchText(silverUrl)]);
  let source = 'reference';
  try {
    source = new URL(goldUrl).hostname;
  } catch {
    /* keep default */
  }
  return {
    gold24kPerGram: goldHtml ? parseGold24kPerGram(goldHtml) : null,
    silverPerGram: silverHtml ? parseSilverPerGram(silverHtml) : null,
    source,
  };
}

/**
 * Compare our representative rates against the reference and return admin alert
 * lines for any metal that drifts beyond the threshold. Fail-open: any error or
 * missing reference yields no alerts rather than a thrown error.
 */
export async function checkMetalDrift(
  ourGold24kPerGram: number | null,
  ourSilverPerGram: number | null,
): Promise<string[]> {
  const threshold = Number.parseFloat(process.env.METAL_DRIFT_ALERT_PCT || '4');
  const problems: string[] = [];
  let ref: ReferenceRates;
  try {
    ref = await fetchReferenceMetalRates();
  } catch {
    return problems;
  }

  const checks: Array<{ metal: 'gold' | 'silver'; ours: number | null; reference: number | null; knob: string }> = [
    { metal: 'gold', ours: ourGold24kPerGram, reference: ref.gold24kPerGram, knob: 'GOLD_MARKET_PREMIUM' },
    { metal: 'silver', ours: ourSilverPerGram, reference: ref.silverPerGram, knob: 'SILVER_MARKET_PREMIUM' },
  ];
  for (const c of checks) {
    if (c.ours == null || c.reference == null) continue;
    const d = assessDrift(c.metal, c.ours, c.reference, threshold);
    if (d && d.exceeds) {
      const unit = c.metal === 'gold' ? '/g 24K' : '/g';
      problems.push(
        `${c.metal.toUpperCase()} rate drifts ${d.driftPct > 0 ? '+' : ''}${d.driftPct}% from ${ref.source} ` +
          `(ours Rs ${Math.round(d.ours)}${unit} vs reference Rs ${Math.round(d.reference)}${unit}, band +/-${threshold}%). ` +
          `Re-verify the current import duty and re-fit ${c.knob} against dealer rates.`,
      );
    }
  }
  return problems;
}
