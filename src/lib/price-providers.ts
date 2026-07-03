import { execute, query } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import {
  FUEL_BASELINE_AS_OF,
  FUEL_BASELINE_SOURCE,
  STATE_LPG,
  resolveCityFuel,
} from '@/lib/fuel-data';

interface MetalSpot {
  gold: number;
  silver: number;
  timestamp: string;
}

interface ExchangeRate {
  usdToInr: number;
}

interface CityRow extends QueryResultRow {
  id: number;
  slug: string;
  name: string;
  state: string;
  is_metro: boolean;
}

export interface UpdateResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
  source: string;
  /** Oldest verification date backing the data written in this run (fuel/LPG). */
  dataAsOf?: string;
}

/**
 * City premiums applied on top of the spot-derived landed price, in Rs/gram.
 * These reflect typical local jeweller spreads and are periodically calibrated,
 * not live city quotes. The methodology page discloses this.
 */
const CITY_GOLD_PREMIUM: Record<string, number> = {
  mumbai: 0, delhi: 20, bangalore: -10, chennai: 30, kolkata: 15,
  hyderabad: 5, pune: -5, ahmedabad: 10, jaipur: 25, lucknow: 20,
  surat: 10, kanpur: 22, nagpur: -3, indore: 18, thane: 0,
  bhopal: 16, visakhapatnam: 8, patna: 28, vadodara: 12, ghaziabad: 20,
  ludhiana: 22, agra: 24, coimbatore: 32, madurai: 34, varanasi: 26,
  rajkot: 14, ranchi: 30, chandigarh: 18, mysore: -8, guwahati: 35,
  bhubaneswar: 28, dehradun: 22, raipur: 20, kochi: 36,
  thiruvananthapuram: 38, jodhpur: 26, gwalior: 18, vijayawada: 10,
  amritsar: 24, noida: 20, mangalore: -6, jammu: 30, jalandhar: 22,
  shimla: 28, tiruchirappalli: 34, hubli: -4, salem: 32, aurangabad: -2,
  srinagar: 32, meerut: 22,
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

function getGoldApiHeaders(): HeadersInit | undefined {
  const apiKey = process.env.GOLD_API_KEY;
  return apiKey ? { 'x-api-key': apiKey } : undefined;
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function getNumber(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} was missing or invalid`);
  }
  return parsed;
}

export async function fetchMetalSpot(): Promise<MetalSpot> {
  const goldUrl = process.env.GOLD_API_URL || 'https://api.gold-api.com/price/XAU';
  const silverUrl = process.env.SILVER_API_URL || 'https://api.gold-api.com/price/XAG';
  const headers = getGoldApiHeaders();
  const [goldRes, silverRes] = await Promise.all([
    fetch(goldUrl, { cache: 'no-store', headers }),
    fetch(silverUrl, { cache: 'no-store', headers }),
  ]);

  if (!goldRes.ok) throw new Error(`Gold API returned ${goldRes.status}`);
  if (!silverRes.ok) throw new Error(`Silver API returned ${silverRes.status}`);

  const goldData = (await goldRes.json()) as { price?: unknown; updatedAt?: string };
  const silverData = (await silverRes.json()) as { price?: unknown; updatedAt?: string };
  const gold = getNumber(goldData.price, 'Gold spot price');
  const silver = getNumber(silverData.price, 'Silver spot price');

  return { gold, silver, timestamp: goldData.updatedAt || silverData.updatedAt || new Date().toISOString() };
}

export async function fetchExchangeRate(): Promise<ExchangeRate> {
  const url = process.env.EXCHANGE_RATE_URL || 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, unknown> };
  return { usdToInr: getNumber(data.rates?.INR, 'USD to INR rate') };
}

/**
 * Landed-cost conversion. Import duty on gold and silver has been 6% (5% BCD
 * + 1% AIDC) since the July 2024 budget — the old 15%/7.5% values inflated
 * gold ~8% above the real market. The market-premium factor captures the
 * spread between duty-adjusted parity and published Indian dealer rates;
 * calibrate it against GoodReturns city rates whenever it drifts. All four
 * knobs are env-tunable so a budget change never needs a code deploy.
 */
export function internationalToIndianGold24k(usdPerOz: number, usdToInr: number): number {
  const importDuty = Number.parseFloat(process.env.GOLD_IMPORT_DUTY || '0.06');
  const gst = Number.parseFloat(process.env.GOLD_GST || '0.03');
  const marketPremium = Number.parseFloat(process.env.GOLD_MARKET_PREMIUM || '0');
  const gramsPerOz = 31.1035;
  const inrPerGram = (usdPerOz / gramsPerOz) * usdToInr;
  return round2(inrPerGram * (1 + importDuty) * (1 + gst) * (1 + marketPremium));
}

export function internationalToIndianSilver(usdPerOz: number, usdToInr: number): number {
  const importDuty = Number.parseFloat(process.env.SILVER_IMPORT_DUTY || '0.06');
  const gst = Number.parseFloat(process.env.SILVER_GST || '0.03');
  // Indian silver has carried a large physical premium over international
  // parity since the 2025 silver squeeze. Calibrated 3 Jul 2026 vs published
  // dealer rates (~Rs 245/g vs Rs 208/g parity). Review monthly.
  const marketPremium = Number.parseFloat(process.env.SILVER_MARKET_PREMIUM || '0.175');
  const gramsPerOz = 31.1035;
  const inrPerGram = (usdPerOz / gramsPerOz) * usdToInr;
  return round2(inrPerGram * (1 + importDuty) * (1 + gst) * (1 + marketPremium));
}

async function getAllCities(): Promise<CityRow[]> {
  return query<CityRow>('SELECT id, slug, name, state, is_metro FROM cities ORDER BY id');
}

/**
 * Previous-day price for change calculation. Strictly BEFORE the given date:
 * intra-day re-runs must compare against yesterday's close, not against the
 * row this same cron wrote an hour ago (that made every change read ~0.00).
 */
async function getPreviousPrice(table: string, column: string, cityId: number, beforeDate: string): Promise<number | null> {
  const rows = await query<QueryResultRow & { val: number }>(
    `SELECT ${column} AS val FROM ${table} WHERE city_id = $1 AND price_date < $2 ORDER BY price_date DESC LIMIT 1`,
    [cityId, beforeDate]
  );
  return rows[0]?.val ?? null;
}

// ---------------------------------------------------------------------------
// Manual price overrides (admin-managed)
// ---------------------------------------------------------------------------

export interface PriceOverride {
  payload: Record<string, number | null>;
  asOf: string;
  source: string;
}

interface PriceOverrideRow extends QueryResultRow {
  region_key: string;
  payload: Record<string, number | null>;
  as_of: string;
  source: string;
}

/**
 * Load admin overrides for a commodity, keyed by region (city slug or state
 * name). Returns an empty map when the table does not exist yet so the cron
 * keeps working before the migration has run.
 */
export async function getPriceOverrides(commodity: 'fuel' | 'lpg'): Promise<Map<string, PriceOverride>> {
  try {
    const rows = await query<PriceOverrideRow>(
      'SELECT region_key, payload, as_of::text AS as_of, source FROM price_overrides WHERE commodity = $1',
      [commodity]
    );
    const map = new Map<string, PriceOverride>();
    for (const row of rows) {
      map.set(row.region_key, { payload: row.payload ?? {}, asOf: row.as_of, source: row.source });
    }
    return map;
  } catch {
    return new Map();
  }
}

function pickNumber(payload: Record<string, number | null>, key: string): number | undefined {
  const value = payload[key];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

// ---------------------------------------------------------------------------
// Updaters
// ---------------------------------------------------------------------------

export async function updateGoldPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;

  try {
    const [metals, fx, cities] = await Promise.all([fetchMetalSpot(), fetchExchangeRate(), getAllCities()]);
    const base24k = internationalToIndianGold24k(metals.gold, fx.usdToInr);
    const today = getDateString(new Date());

    for (const city of cities) {
      try {
        const premium = CITY_GOLD_PREMIUM[city.slug] ?? 15;
        const price24k = round2(base24k + premium);
        const price22k = round2(price24k * 0.9167);
        const price18k = round2(price24k * 0.75);
        const prev = await getPreviousPrice('gold_prices', 'gold_24k_per_gram', city.id, today);
        const change = prev ? round2(price24k - prev) : 0;
        const changePct = prev ? round2((change / prev) * 100) : 0;

        await execute(
          `INSERT INTO gold_prices (city_id, price_date, gold_24k_per_gram, gold_22k_per_gram, gold_18k_per_gram, gold_24k_per_10gram, gold_22k_per_10gram, change_amount, change_percent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (city_id, price_date) DO UPDATE SET
             gold_24k_per_gram = EXCLUDED.gold_24k_per_gram,
             gold_22k_per_gram = EXCLUDED.gold_22k_per_gram,
             gold_18k_per_gram = EXCLUDED.gold_18k_per_gram,
             gold_24k_per_10gram = EXCLUDED.gold_24k_per_10gram,
             gold_22k_per_10gram = EXCLUDED.gold_22k_per_10gram,
             change_amount = EXCLUDED.change_amount,
             change_percent = EXCLUDED.change_percent`,
          [city.id, today, price24k, price22k, price18k, round2(price24k * 10), round2(price22k * 10), change, changePct]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`Gold ${city.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: true, message: `Gold: ${recordsProcessed} cities updated from live spot USD ${metals.gold}/oz at USD/INR ${fx.usdToInr}`, recordsProcessed, errors, source: 'gold-api.com + frankfurter.dev', dataAsOf: today };
  } catch (error) {
    return { success: false, message: `Gold update failed: ${error instanceof Error ? error.message : 'Unknown error'}`, recordsProcessed, errors, source: 'gold-api.com + frankfurter.dev' };
  }
}

export async function updateSilverPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;

  try {
    const [metals, fx, cities] = await Promise.all([fetchMetalSpot(), fetchExchangeRate(), getAllCities()]);
    const baseSilver = internationalToIndianSilver(metals.silver, fx.usdToInr);
    const today = getDateString(new Date());

    for (const city of cities) {
      try {
        const premium = (CITY_GOLD_PREMIUM[city.slug] ?? 15) * 0.012;
        const silverPerGram = round2(baseSilver + premium);
        const silverPerKg = round2(silverPerGram * 1000);
        const prev = await getPreviousPrice('silver_prices', 'silver_per_gram', city.id, today);
        const change = prev ? round2(silverPerGram - prev) : 0;
        const changePct = prev ? round2((change / prev) * 100) : 0;

        await execute(
          `INSERT INTO silver_prices (city_id, price_date, silver_per_gram, silver_per_kg, change_amount, change_percent)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (city_id, price_date) DO UPDATE SET
             silver_per_gram = EXCLUDED.silver_per_gram,
             silver_per_kg = EXCLUDED.silver_per_kg,
             change_amount = EXCLUDED.change_amount,
             change_percent = EXCLUDED.change_percent`,
          [city.id, today, silverPerGram, silverPerKg, change, changePct]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`Silver ${city.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: true, message: `Silver: ${recordsProcessed} cities updated from live spot USD ${metals.silver}/oz`, recordsProcessed, errors, source: 'gold-api.com + frankfurter.dev', dataAsOf: today };
  } catch (error) {
    return { success: false, message: `Silver update failed: ${error instanceof Error ? error.message : 'Unknown error'}`, recordsProcessed, errors, source: 'gold-api.com + frankfurter.dev' };
  }
}

export async function updateFuelPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;
  let oldestAsOf = getDateString(new Date());

  try {
    const [cities, overrides] = await Promise.all([getAllCities(), getPriceOverrides('fuel')]);
    const today = getDateString(new Date());

    for (const city of cities) {
      try {
        const baseline = resolveCityFuel(city.slug, city.state);
        const override = overrides.get(city.slug) ?? overrides.get(city.state);
        const petrol = (override && pickNumber(override.payload, 'petrol')) ?? baseline.petrol;
        const diesel = (override && pickNumber(override.payload, 'diesel')) ?? baseline.diesel;
        const asOf = override ? override.asOf : FUEL_BASELINE_AS_OF;
        const source = override ? override.source : FUEL_BASELINE_SOURCE;
        if (asOf < oldestAsOf) oldestAsOf = asOf;

        const prevRows = await query<QueryResultRow & { petrol_price: number; diesel_price: number }>(
          'SELECT petrol_price, diesel_price FROM fuel_prices WHERE city_id = $1 AND price_date < $2 ORDER BY price_date DESC LIMIT 1',
          [city.id, today]
        );
        const prev = prevRows[0];
        const petrolChange = prev ? round2(petrol - prev.petrol_price) : 0;
        const dieselChange = prev ? round2(diesel - prev.diesel_price) : 0;

        await execute(
          `INSERT INTO fuel_prices (city_id, price_date, petrol_price, diesel_price, petrol_change, diesel_change, data_as_of, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (city_id, price_date) DO UPDATE SET
             petrol_price = EXCLUDED.petrol_price,
             diesel_price = EXCLUDED.diesel_price,
             petrol_change = EXCLUDED.petrol_change,
             diesel_change = EXCLUDED.diesel_change,
             data_as_of = EXCLUDED.data_as_of,
             source = EXCLUDED.source`,
          [city.id, today, petrol, diesel, petrolChange, dieselChange, asOf, source]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`Fuel ${city.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: true, message: `Fuel: ${recordsProcessed} cities written, data verified as of ${oldestAsOf}`, recordsProcessed, errors, source: FUEL_BASELINE_SOURCE, dataAsOf: oldestAsOf };
  } catch (error) {
    return { success: false, message: `Fuel update failed: ${error instanceof Error ? error.message : 'Unknown error'}`, recordsProcessed, errors, source: FUEL_BASELINE_SOURCE };
  }
}

export async function updateLpgPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;
  let oldestAsOf = getDateString(new Date());

  try {
    const overrides = await getPriceOverrides('lpg');
    const today = getDateString(new Date());

    for (const [state, baseline] of Object.entries(STATE_LPG)) {
      try {
        const override = overrides.get(state);
        const domestic = (override && pickNumber(override.payload, 'domestic')) ?? baseline.domestic;
        const commercialOverride = override ? pickNumber(override.payload, 'commercial') : undefined;
        const commercial = commercialOverride ?? baseline.commercial;
        const asOf = override ? override.asOf : FUEL_BASELINE_AS_OF;
        const source = override ? override.source : FUEL_BASELINE_SOURCE;
        if (asOf < oldestAsOf) oldestAsOf = asOf;

        const prevRows = await query<QueryResultRow & { domestic_14kg: number }>(
          'SELECT domestic_14kg FROM lpg_prices WHERE state = $1 AND price_date < $2 ORDER BY price_date DESC LIMIT 1',
          [state, today]
        );
        const change = prevRows[0] ? round2(domestic - prevRows[0].domestic_14kg) : 0;

        await execute(
          `INSERT INTO lpg_prices (state, price_date, domestic_14kg, commercial_19kg, subsidy_amount, change_amount, data_as_of, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (state, price_date) DO UPDATE SET
             domestic_14kg = EXCLUDED.domestic_14kg,
             commercial_19kg = EXCLUDED.commercial_19kg,
             subsidy_amount = EXCLUDED.subsidy_amount,
             change_amount = EXCLUDED.change_amount,
             data_as_of = EXCLUDED.data_as_of,
             source = EXCLUDED.source`,
          [state, today, domestic, commercial, 0, change, asOf, source]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`LPG ${state}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: true, message: `LPG: ${recordsProcessed} states written, data verified as of ${oldestAsOf}`, recordsProcessed, errors, source: FUEL_BASELINE_SOURCE, dataAsOf: oldestAsOf };
  } catch (error) {
    return { success: false, message: `LPG update failed: ${error instanceof Error ? error.message : 'Unknown error'}`, recordsProcessed, errors, source: FUEL_BASELINE_SOURCE };
  }
}
