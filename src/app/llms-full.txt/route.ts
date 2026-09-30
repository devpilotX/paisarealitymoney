/**
 * /llms-full.txt: the facts behind the site in one plain-text file, for answer
 * engines that want content rather than a link map (/llms.txt has the map).
 * Everything here is read from the same database and constants the pages use,
 * so it can never disagree with them. Regenerated hourly.
 */
import { query } from '@/lib/db';
import { SITE_URL } from '@/lib/seo';
import { getSchemeDirectory } from '@/lib/matcher';
import {
  SMALL_SAVINGS,
  SMALL_SAVINGS_QUARTER,
  SMALL_SAVINGS_ANNOUNCED,
  RBI_RATES,
  RBI_RATES_AS_OF,
  RBI_STANCE,
  EPF_RATE_PCT,
  EPF_RATE_YEAR,
} from '@/lib/policy-rates';
import type { QueryResultRow } from 'pg';

export const revalidate = 3600;

const u = (path: string): string => `${SITE_URL}${path}`;
const inr = (v: string | number | null | undefined): string =>
  v == null || v === '' ? 'n/a' : `Rs ${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const isoDate = (v: unknown): string => {
  if (v instanceof Date) return v.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return String(v ?? '').slice(0, 10);
};

const METROS = ['delhi', 'mumbai', 'kolkata', 'chennai', 'bangalore', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'lucknow'];

interface CityPriceRow extends QueryResultRow {
  slug: string;
  name: string;
  gold_date: Date | string | null;
  g24: string | null;
  g22: string | null;
  silver: string | null;
  petrol: string | null;
  diesel: string | null;
  fuel_as_of: Date | string | null;
}

async function cityPrices(): Promise<CityPriceRow[]> {
  try {
    return await query<CityPriceRow>(
      `SELECT c.slug, c.name,
              g.price_date AS gold_date, g.gold_24k_per_gram AS g24, g.gold_22k_per_gram AS g22,
              s.silver_per_gram AS silver,
              f.petrol_price AS petrol, f.diesel_price AS diesel, f.data_as_of AS fuel_as_of
         FROM cities c
         LEFT JOIN LATERAL (SELECT * FROM gold_prices WHERE city_id = c.id ORDER BY price_date DESC LIMIT 1) g ON true
         LEFT JOIN LATERAL (SELECT * FROM silver_prices WHERE city_id = c.id ORDER BY price_date DESC LIMIT 1) s ON true
         LEFT JOIN LATERAL (SELECT * FROM fuel_prices WHERE city_id = c.id ORDER BY price_date DESC LIMIT 1) f ON true
        WHERE c.slug = ANY($1)`,
      [METROS]
    );
  } catch {
    return [];
  }
}

interface LpgRow extends QueryResultRow { state: string; domestic_14kg: string; commercial_19kg: string | null; data_as_of: Date | string | null }

async function lpgPrices(): Promise<LpgRow[]> {
  try {
    return await query<LpgRow>(
      `SELECT DISTINCT ON (state) state, domestic_14kg, commercial_19kg, data_as_of
         FROM lpg_prices ORDER BY state, price_date DESC`
    );
  } catch {
    return [];
  }
}

interface ScholarshipRow extends QueryResultRow { slug: string; name: string; benefit_summary: string | null }

async function scholarships(): Promise<ScholarshipRow[]> {
  try {
    return await query<ScholarshipRow>(
      'SELECT slug, name, benefit_summary FROM scholarships WHERE active = true ORDER BY name'
    );
  } catch {
    return [];
  }
}

export async function GET(): Promise<Response> {
  const [prices, lpg, schemes, sch] = await Promise.all([cityPrices(), lpgPrices(), getSchemeDirectory(), scholarships()]);
  const order = new Map(METROS.map((s, i) => [s, i]));
  prices.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));

  const lines: string[] = [];
  const push = (...l: string[]): void => { lines.push(...l); };

  push(
    '# Paisa Reality: full reference',
    '',
    '> Free personal finance information for India. This file holds the current figures shown on paisareality.com, each with its date and source, so they can be quoted accurately. For a map of pages see ' + u('/llms.txt') + '.',
    '',
    'Paisa Reality is an information site, not a financial adviser. It does not sell financial products. Always confirm a price with your jeweller or fuel station, and scheme details on the official portal, before acting.',
    '',
  );

  push('## Gold, silver and fuel prices in major cities', '');
  if (prices.length === 0) {
    push('Prices are temporarily unavailable in this file. See ' + u('/gold-rate') + '.', '');
  } else {
    push(
      'Gold and silver are per gram, derived from the international spot price, the USD/INR rate, import duty, GST and a dealer premium fitted to published Indian rates. They exclude making charges. Petrol and diesel are per litre from oil marketing company rates.',
      '',
    );
    for (const r of prices) {
      push(
        `- ${r.name} (as of ${isoDate(r.gold_date)}): gold 24K ${inr(r.g24)}, gold 22K ${inr(r.g22)}, silver ${inr(r.silver)} per gram; petrol ${inr(r.petrol)}, diesel ${inr(r.diesel)} per litre (fuel verified ${isoDate(r.fuel_as_of)}). Details: ${u('/gold-rate/' + r.slug)}`,
      );
    }
    push('');
  }

  if (lpg.length > 0) {
    push('## LPG cylinder prices by state', '', `Domestic 14.2 kg and commercial 19 kg cylinders. Revised by oil companies on the 1st of each month. Page: ${u('/lpg-price')}`, '');
    for (const r of lpg) {
      push(`- ${r.state}: domestic ${inr(r.domestic_14kg)}, commercial ${r.commercial_19kg ? inr(r.commercial_19kg) : 'not published'} (verified ${isoDate(r.data_as_of)})`);
    }
    push('');
  }

  push('## Small savings interest rates', '', `Quarter: ${SMALL_SAVINGS_QUARTER}, notified by the Ministry of Finance on ${SMALL_SAVINGS_ANNOUNCED}. Page: ${u('/interest-rates')}`, '');
  for (const s of SMALL_SAVINGS) push(`- ${s.name}: ${s.ratePct}% (${s.compounding}). Tax: ${s.taxNote}.${s.note ? ' ' + s.note + '.' : ''}`);
  push('');

  push('## RBI policy rates', '', `As of the MPC decision on ${RBI_RATES_AS_OF}. Stance: ${RBI_STANCE}.`, '');
  for (const r of RBI_RATES) push(`- ${r.name}: ${r.ratePct}%. ${r.note}.`);
  push(`- EPF interest rate: ${EPF_RATE_PCT}% for ${EPF_RATE_YEAR}.`, '');

  push(
    '## Income tax, FY 2026-27 (AY 2027-28)',
    '',
    'Budget 2026 left the slabs unchanged from FY 2025-26. The Income Tax Act, 2025 applies from 1 April 2026.',
    '',
    '- New regime (default): 0 to 4 lakh nil; 4 to 8 lakh 5%; 8 to 12 lakh 10%; 12 to 16 lakh 15%; 16 to 20 lakh 20%; 20 to 24 lakh 25%; above 24 lakh 30%. Standard deduction Rs 75,000 for salaried. Section 87A rebate up to Rs 60,000 makes tax nil up to Rs 12 lakh of taxable income, with marginal relief just above it.',
    '- Old regime: 0 to 2.5 lakh nil; 2.5 to 5 lakh 5%; 5 to 10 lakh 20%; above 10 lakh 30% (higher exemption for seniors). Standard deduction Rs 50,000. Rebate makes tax nil up to Rs 5 lakh taxable.',
    '- 4% health and education cess on the tax in both regimes. Surcharge above Rs 50 lakh.',
    '- Capital gains: equity long-term gains taxed at 12.5% above Rs 1.25 lakh a year; short-term equity gains at 20%.',
    `- Calculator: ${u('/calculators/income-tax')}. Regime comparison guide: ${u('/guides/old-vs-new-tax-regime')}`,
    '',
  );

  push('## Government schemes', '', `${schemes.length} active central and state schemes. Each page covers benefits, eligibility, documents, how to apply and the official link. Finder: ${u('/schemes')}`, '');
  for (const s of schemes) {
    const summary = (s.benefitSummary || '').replace(/\s+/g, ' ').trim();
    push(`- [${s.name}](${u('/schemes/' + s.slug)}) (${s.category})${summary ? ': ' + summary : ''}`);
  }
  push('');

  if (sch.length > 0) {
    push('## Scholarships', '', `Index: ${u('/scholarships')}`, '');
    for (const s of sch) {
      const summary = (s.benefit_summary || '').replace(/\s+/g, ' ').trim();
      push(`- [${s.name}](${u('/scholarships/' + s.slug)})${summary ? ': ' + summary : ''}`);
    }
    push('');
  }

  push(
    '## How the data is produced',
    '',
    `Full methodology: ${u('/methodology')}. Editorial policy and corrections: ${u('/editorial-policy')}. Report an error: ${u('/contact')}.`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
