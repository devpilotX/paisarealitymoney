/**
 * Weekly market wrap: a short newsletter post written only from the prices and
 * records already on the site. n8n calls /api/cron/weekly-wrap on Sunday evening.
 * This file is pure and DB-free (tested); market-wrap.ts reads the database.
 * Nothing is estimated or forecast: every figure is a stored average or a stored row.
 */
import { SMALL_SAVINGS, SMALL_SAVINGS_QUARTER, RBI_RATES, RBI_NEXT_MPC } from './policy-rates';

export interface DayAvg { date: string; value: number }
export interface FuelRow { city: string; slug: string; petrol: number; diesel: number; petrolWeekAgo: number | null; dieselWeekAgo: number | null }
export interface Deadline { kind: 'scholarship' | 'grant'; name: string; slug: string; deadline: string }

export interface WrapData {
  cityCount: number;
  gold24: DayAvg[]; // oldest first
  gold22: DayAvg[];
  silverKg: DayAvg[];
  fuel: FuelRow[];
  lpgDelhi: { now: number; weekAgo: number | null } | null;
  deadlines: Deadline[];
}

export interface Wrap { slug: string; title: string; description: string; metaTitle: string; content: string; weekEnd: string }

export const MIN_DAYS = 5;

const rupees = (n: number, digits = 0) => '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const MONTHS: readonly string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
const shortDate = (iso: string) => { const [, m, d] = iso.split('-').map(Number) as [number, number, number]; return `${d} ${(MONTHS[m - 1] ?? '').slice(0, 3)}`; };

function moveSentence(label: string, series: DayAvg[], unit: string, digits = 0): string {
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const diff = last.value - first.value;
  const pct = (diff / first.value) * 100;
  const high = series.reduce((a, b) => (b.value > a.value ? b : a));
  const low = series.reduce((a, b) => (b.value < a.value ? b : a));
  const change = Math.abs(diff) < 0.5
    ? 'practically unchanged from'
    : `${diff > 0 ? 'up' : 'down'} ${rupees(Math.abs(diff), digits)} (${Math.abs(pct).toFixed(2)}%) from`;
  let s = `${label} averaged ${rupees(last.value, digits)} ${unit} on ${longDate(last.date)}, ${change} ${rupees(first.value, digits)} on ${longDate(first.date)}.`;
  if (high.date !== low.date) s += ` The week's high was ${rupees(high.value, digits)} on ${shortDate(high.date)} and the low ${rupees(low.value, digits)} on ${shortDate(low.date)}.`;
  return s;
}

function fuelChange(now: number, before: number | null): string {
  if (before === null) return 'n/a';
  const d = now - before;
  return Math.abs(d) < 0.005 ? 'No change' : `${d > 0 ? '+' : '-'}${Math.abs(d).toFixed(2)}`;
}

export function composeWrap(d: WrapData): Wrap | null {
  if (d.gold24.length < MIN_DAYS || d.silverKg.length < MIN_DAYS) return null;
  const weekEnd = d.gold24[d.gold24.length - 1]!.date;
  const weekStart = d.gold24[0]!.date;
  const out: string[] = [];

  out.push(`Prices on this page are the averages of the ${d.cityCount} cities we track, before 3% GST and making charges. They are the same figures shown on our city pages each day. This covers ${longDate(weekStart)} to ${longDate(weekEnd)}.`);

  out.push('## Gold');
  out.push(moveSentence('24K gold', d.gold24, 'per 10 grams'));
  if (d.gold22.length) {
    const g22 = d.gold22[d.gold22.length - 1]!;
    out.push(`22K gold, the purity most jewellery is made in, averaged ${rupees(g22.value)} per 10 grams on the same day.`);
  }
  out.push('## Silver');
  out.push(moveSentence('Silver', d.silverKg, 'per kg'));

  if (d.fuel.length) {
    out.push('## Petrol and diesel');
    const allFlat = d.fuel.every((f) => f.petrolWeekAgo !== null && f.dieselWeekAgo !== null
      && Math.abs(f.petrol - f.petrolWeekAgo) < 0.005 && Math.abs(f.diesel - f.dieselWeekAgo) < 0.005);
    out.push(allFlat
      ? 'Pump prices did not change in any of the four metros this week.'
      : 'Retail prices in the four metros, in rupees per litre, with the change over the week:');
    out.push([
      '| City | Petrol | Change | Diesel | Change |',
      '|---|---|---|---|---|',
      ...d.fuel.map((f) => `| [${f.city}](/petrol-price/${f.slug}) | ${f.petrol.toFixed(2)} | ${fuelChange(f.petrol, f.petrolWeekAgo)} | ${f.diesel.toFixed(2)} | ${fuelChange(f.diesel, f.dieselWeekAgo)} |`),
    ].join('\n'));
  }

  if (d.lpgDelhi) {
    out.push('## Cooking gas');
    const l = d.lpgDelhi;
    const same = l.weekAgo === null || Math.abs(l.now - l.weekAgo) < 0.5;
    out.push(`A 14.2 kg domestic LPG cylinder costs ${rupees(l.now)} in Delhi${same ? ', the same as a week ago' : `, against ${rupees(l.weekAgo!)} a week ago`}. Oil companies usually revise LPG prices on the first day of the month. Prices for every state are on the [LPG price page](/lpg-price).`);
  }

  out.push('## Interest rates');
  const ppf = SMALL_SAVINGS.find((s) => /PPF/.test(s.name));
  const ssy = SMALL_SAVINGS.find((s) => /SSY/.test(s.name));
  const repo = RBI_RATES.find((r) => /^Repo/i.test(r.name));
  const parts: string[] = [];
  if (ppf && ssy) parts.push(`Small savings rates for ${SMALL_SAVINGS_QUARTER} are ${ppf.ratePct}% for PPF and ${ssy.ratePct}% for Sukanya Samriddhi.`);
  if (repo) parts.push(`The RBI repo rate is ${repo.ratePct}%, and the next policy meeting is ${RBI_NEXT_MPC}.`);
  parts.push('The full list is on the [interest rates page](/interest-rates), and bank FD rates are compared on [bank rates](/bank-rates).');
  out.push(parts.join(' '));

  if (d.deadlines.length) {
    out.push('## Closing in the next 30 days');
    out.push(d.deadlines.map((x) => `- [${x.name}](/${x.kind === 'grant' ? 'grants' : 'scholarships'}/${x.slug}): closes ${longDate(x.deadline)}`).join('\n'));
    out.push('Deadlines are taken from the official notice. Check the portal before applying, as dates are sometimes extended.');
  }

  out.push('## Where these numbers come from');
  out.push('Gold and silver are worked out five times a day from the international spot price and the rupee exchange rate, fitted to published Indian dealer rates, then averaged across cities. Fuel and LPG prices are the retail prices published by the oil marketing companies. The [methodology page](/methodology) explains each source. Prices here are for information and do not include the charges a jeweller or dealer adds.');

  const title = `Gold, silver and fuel prices: week to ${longDate(weekEnd)}`;
  const g = d.gold24;
  const goldDiff = g[g.length - 1]!.value - g[0]!.value;
  const goldWord = Math.abs(goldDiff) < 0.5 ? 'little changed' : `${goldDiff > 0 ? 'up' : 'down'} ${rupees(Math.abs(goldDiff))}`;
  const description = `24K gold averaged ${rupees(g[g.length - 1]!.value)} per 10 grams on ${longDate(weekEnd)}, ${goldWord} over the week. Silver, fuel and LPG prices, and deadlines ahead.`;
  return {
    slug: `weekly-prices-${weekEnd}`,
    title,
    metaTitle: `Gold, silver and fuel prices, week to ${shortDate(weekEnd)} ${weekEnd.slice(0, 4)}`,
    description: description.length <= 155 ? description : description.slice(0, description.lastIndexOf('.', 154) + 1),
    content: out.join('\n\n'),
    weekEnd,
  };
}
