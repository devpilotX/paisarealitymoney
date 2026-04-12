import { execute, query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface MetalSpot {
  gold: number;
  silver: number;
  timestamp: string;
}

interface ExchangeRate {
  usdToInr: number;
}

interface CityRow extends RowDataPacket {
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
}

const CITY_GOLD_PREMIUM: Record<string, number> = {
  mumbai: 0,
  delhi: 20,
  bangalore: -10,
  chennai: 30,
  kolkata: 15,
  hyderabad: 5,
  pune: -5,
  ahmedabad: 10,
  jaipur: 25,
  lucknow: 20,
  surat: 10,
  kanpur: 22,
  nagpur: -3,
  indore: 18,
  thane: 0,
  bhopal: 16,
  visakhapatnam: 8,
  patna: 28,
  vadodara: 12,
  ghaziabad: 20,
  ludhiana: 22,
  agra: 24,
  coimbatore: 32,
  madurai: 34,
  varanasi: 26,
  rajkot: 14,
  ranchi: 30,
  chandigarh: 18,
  mysore: -8,
  guwahati: 35,
  bhubaneswar: 28,
  dehradun: 22,
  raipur: 20,
  kochi: 36,
  thiruvananthapuram: 38,
  jodhpur: 26,
  gwalior: 18,
  vijayawada: 10,
  amritsar: 24,
  noida: 20,
  mangalore: -6,
  jammu: 30,
  jalandhar: 22,
  shimla: 28,
  tiruchirappalli: 34,
  hubli: -4,
  salem: 32,
  aurangabad: -2,
  srinagar: 32,
  meerut: 22,
};

const CITY_FUEL_BASE: Record<string, { petrol: number; diesel: number }> = {
  mumbai: { petrol: 103.44, diesel: 89.97 },
  delhi: { petrol: 94.72, diesel: 87.62 },
  bangalore: { petrol: 101.94, diesel: 87.89 },
  chennai: { petrol: 100.76, diesel: 92.13 },
  kolkata: { petrol: 104.95, diesel: 91.76 },
  hyderabad: { petrol: 107.41, diesel: 95.65 },
  pune: { petrol: 104.36, diesel: 90.11 },
  ahmedabad: { petrol: 94.26, diesel: 89.72 },
  jaipur: { petrol: 104.88, diesel: 90.35 },
  lucknow: { petrol: 94.65, diesel: 87.76 },
  surat: { petrol: 94.34, diesel: 89.83 },
  kanpur: { petrol: 94.78, diesel: 87.91 },
  nagpur: { petrol: 104.18, diesel: 89.62 },
  indore: { petrol: 104.79, diesel: 90.15 },
  thane: { petrol: 103.44, diesel: 89.97 },
  bhopal: { petrol: 108.65, diesel: 93.12 },
  visakhapatnam: { petrol: 107.52, diesel: 95.32 },
  patna: { petrol: 107.24, diesel: 94.04 },
  vadodara: { petrol: 94.31, diesel: 89.78 },
  ghaziabad: { petrol: 94.82, diesel: 87.72 },
  ludhiana: { petrol: 95.42, diesel: 88.18 },
  agra: { petrol: 94.71, diesel: 87.68 },
  coimbatore: { petrol: 100.85, diesel: 92.27 },
  madurai: { petrol: 100.97, diesel: 92.39 },
  varanasi: { petrol: 94.73, diesel: 87.74 },
  rajkot: { petrol: 94.28, diesel: 89.75 },
  ranchi: { petrol: 99.16, diesel: 94.26 },
  chandigarh: { petrol: 96.2, diesel: 84.26 },
  mysore: { petrol: 101.84, diesel: 87.79 },
  guwahati: { petrol: 96.01, diesel: 88.72 },
  bhubaneswar: { petrol: 103.19, diesel: 94.76 },
  dehradun: { petrol: 94.82, diesel: 87.92 },
  raipur: { petrol: 102.42, diesel: 93.15 },
  kochi: { petrol: 107.71, diesel: 96.52 },
  thiruvananthapuram: { petrol: 107.8, diesel: 96.61 },
  jodhpur: { petrol: 104.91, diesel: 90.38 },
  gwalior: { petrol: 108.59, diesel: 93.06 },
  vijayawada: { petrol: 107.55, diesel: 95.35 },
  amritsar: { petrol: 95.48, diesel: 88.24 },
  noida: { petrol: 94.87, diesel: 87.77 },
  mangalore: { petrol: 101.88, diesel: 87.83 },
  jammu: { petrol: 98.28, diesel: 89.72 },
  jalandhar: { petrol: 95.44, diesel: 88.2 },
  shimla: { petrol: 96.12, diesel: 87.95 },
  tiruchirappalli: { petrol: 100.91, diesel: 92.33 },
  hubli: { petrol: 101.86, diesel: 87.81 },
  salem: { petrol: 100.89, diesel: 92.31 },
  aurangabad: { petrol: 104.15, diesel: 89.59 },
  srinagar: { petrol: 100.58, diesel: 91.22 },
  meerut: { petrol: 94.85, diesel: 87.75 },
};

const STATE_LPG: Record<string, { domestic: number; commercial: number }> = {
  Maharashtra: { domestic: 903, commercial: 1865.5 },
  Delhi: { domestic: 803, commercial: 1772 },
  Karnataka: { domestic: 903.5, commercial: 1880 },
  'Tamil Nadu': { domestic: 903, commercial: 1877.5 },
  'West Bengal': { domestic: 903, commercial: 1907.5 },
  Telangana: { domestic: 903, commercial: 1870 },
  Gujarat: { domestic: 903, commercial: 1825 },
  Rajasthan: { domestic: 903, commercial: 1840.5 },
  'Uttar Pradesh': { domestic: 903, commercial: 1810 },
  'Madhya Pradesh': { domestic: 903, commercial: 1835 },
  Bihar: { domestic: 903, commercial: 1920 },
  Punjab: { domestic: 903, commercial: 1800 },
  'Andhra Pradesh': { domestic: 903, commercial: 1875 },
  Kerala: { domestic: 903, commercial: 1900 },
  Jharkhand: { domestic: 903, commercial: 1915 },
  Assam: { domestic: 903, commercial: 1950 },
  Odisha: { domestic: 903, commercial: 1895 },
  Chhattisgarh: { domestic: 903, commercial: 1850 },
  Uttarakhand: { domestic: 903, commercial: 1830 },
  'Himachal Pradesh': { domestic: 903, commercial: 1845 },
  Chandigarh: { domestic: 803, commercial: 1790 },
  'Jammu & Kashmir': { domestic: 903, commercial: 1860 },
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

function getGoldApiHeaders(): HeadersInit | undefined {
  const apiKey = process.env.GOLD_API_KEY;
  return apiKey ? { 'x-api-key': apiKey } : undefined;
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function getMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
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

  if (!goldRes.ok) {
    throw new Error(`Gold API returned ${goldRes.status}`);
  }
  if (!silverRes.ok) {
    throw new Error(`Silver API returned ${silverRes.status}`);
  }

  const goldData = (await goldRes.json()) as { price?: unknown; updatedAt?: string };
  const silverData = (await silverRes.json()) as { price?: unknown; updatedAt?: string };
  const gold = getNumber(goldData.price, 'Gold spot price');
  const silver = getNumber(silverData.price, 'Silver spot price');

  return {
    gold,
    silver,
    timestamp: goldData.updatedAt || silverData.updatedAt || getMysqlDateTime(new Date()),
  };
}

export async function fetchExchangeRate(): Promise<ExchangeRate> {
  const url =
    process.env.EXCHANGE_RATE_URL ||
    'https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR';
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Exchange rate API returned ${res.status}`);
  }

  const data = (await res.json()) as { rates?: Record<string, unknown> };
  return { usdToInr: getNumber(data.rates?.INR, 'USD to INR rate') };
}

export function internationalToIndianGold24k(usdPerOz: number, usdToInr: number): number {
  const importDuty = Number.parseFloat(process.env.GOLD_IMPORT_DUTY || '0.15');
  const gst = Number.parseFloat(process.env.GOLD_GST || '0.03');
  const gramsPerOz = 31.1035;
  const inrPerGram = (usdPerOz / gramsPerOz) * usdToInr;
  return round2(inrPerGram * (1 + importDuty) * (1 + gst));
}

export function internationalToIndianSilver(usdPerOz: number, usdToInr: number): number {
  const importDuty = 0.075;
  const gst = 0.03;
  const gramsPerOz = 31.1035;
  const inrPerGram = (usdPerOz / gramsPerOz) * usdToInr;
  return round2(inrPerGram * (1 + importDuty) * (1 + gst));
}

async function getAllCities(): Promise<CityRow[]> {
  return query<CityRow[]>('SELECT id, slug, name, state, is_metro FROM cities ORDER BY id');
}

async function getPreviousPrice(table: string, column: string, cityId: number): Promise<number | null> {
  const rows = await query<(RowDataPacket & { val: number })[]>(
    `SELECT ${column} AS val FROM ${table} WHERE city_id = ? ORDER BY price_date DESC LIMIT 1`,
    [cityId]
  );
  return rows[0]?.val ?? null;
}

export async function updateGoldPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;

  try {
    const [metals, fx, cities] = await Promise.all([
      fetchMetalSpot(),
      fetchExchangeRate(),
      getAllCities(),
    ]);
    const base24k = internationalToIndianGold24k(metals.gold, fx.usdToInr);
    const today = getDateString(new Date());

    for (const city of cities) {
      try {
        const premium = CITY_GOLD_PREMIUM[city.slug] ?? 15;
        const price24k = round2(base24k + premium);
        const price22k = round2(price24k * 0.9167);
        const price18k = round2(price24k * 0.75);
        const prev = await getPreviousPrice('gold_prices', 'gold_24k_per_gram', city.id);
        const change = prev ? round2(price24k - prev) : 0;
        const changePct = prev ? round2((change / prev) * 100) : 0;

        await execute(
          `INSERT INTO gold_prices (city_id, price_date, gold_24k_per_gram, gold_22k_per_gram, gold_18k_per_gram, gold_24k_per_10gram, gold_22k_per_10gram, change_amount, change_percent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE gold_24k_per_gram=VALUES(gold_24k_per_gram), gold_22k_per_gram=VALUES(gold_22k_per_gram), gold_18k_per_gram=VALUES(gold_18k_per_gram), gold_24k_per_10gram=VALUES(gold_24k_per_10gram), gold_22k_per_10gram=VALUES(gold_22k_per_10gram), change_amount=VALUES(change_amount), change_percent=VALUES(change_percent)`,
          [
            city.id,
            today,
            price24k,
            price22k,
            price18k,
            round2(price24k * 10),
            round2(price22k * 10),
            change,
            changePct,
          ]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`Gold ${city.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      message: `Gold: ${recordsProcessed} cities updated from live spot USD ${metals.gold}/oz at USD/INR ${fx.usdToInr}`,
      recordsProcessed,
      errors,
      source: 'gold-api.com + frankfurter.dev',
    };
  } catch (error) {
    return {
      success: false,
      message: `Gold update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recordsProcessed,
      errors,
      source: 'gold-api.com + frankfurter.dev',
    };
  }
}

export async function updateSilverPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;

  try {
    const [metals, fx, cities] = await Promise.all([
      fetchMetalSpot(),
      fetchExchangeRate(),
      getAllCities(),
    ]);
    const baseSilver = internationalToIndianSilver(metals.silver, fx.usdToInr);
    const today = getDateString(new Date());

    for (const city of cities) {
      try {
        const premium = (CITY_GOLD_PREMIUM[city.slug] ?? 15) * 0.012;
        const silverPerGram = round2(baseSilver + premium);
        const silverPerKg = round2(silverPerGram * 1000);
        const prev = await getPreviousPrice('silver_prices', 'silver_per_gram', city.id);
        const change = prev ? round2(silverPerGram - prev) : 0;
        const changePct = prev ? round2((change / prev) * 100) : 0;

        await execute(
          `INSERT INTO silver_prices (city_id, price_date, silver_per_gram, silver_per_kg, change_amount, change_percent)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE silver_per_gram=VALUES(silver_per_gram), silver_per_kg=VALUES(silver_per_kg), change_amount=VALUES(change_amount), change_percent=VALUES(change_percent)`,
          [city.id, today, silverPerGram, silverPerKg, change, changePct]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`Silver ${city.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      message: `Silver: ${recordsProcessed} cities updated from live spot USD ${metals.silver}/oz`,
      recordsProcessed,
      errors,
      source: 'gold-api.com + frankfurter.dev',
    };
  } catch (error) {
    return {
      success: false,
      message: `Silver update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recordsProcessed,
      errors,
      source: 'gold-api.com + frankfurter.dev',
    };
  }
}

export async function updateFuelPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;

  try {
    const cities = await getAllCities();
    const today = getDateString(new Date());

    for (const city of cities) {
      try {
        const base = CITY_FUEL_BASE[city.slug] ?? { petrol: 96.72, diesel: 89.62 };
        const prevRows = await query<
          (RowDataPacket & { petrol_price: number; diesel_price: number })[]
        >(
          'SELECT petrol_price, diesel_price FROM fuel_prices WHERE city_id = ? ORDER BY price_date DESC LIMIT 1',
          [city.id]
        );
        const prev = prevRows[0];
        const petrolChange = prev ? round2(base.petrol - prev.petrol_price) : 0;
        const dieselChange = prev ? round2(base.diesel - prev.diesel_price) : 0;

        await execute(
          `INSERT INTO fuel_prices (city_id, price_date, petrol_price, diesel_price, petrol_change, diesel_change)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE petrol_price=VALUES(petrol_price), diesel_price=VALUES(diesel_price), petrol_change=VALUES(petrol_change), diesel_change=VALUES(diesel_change)`,
          [city.id, today, base.petrol, base.diesel, petrolChange, dieselChange]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`Fuel ${city.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      message: `Fuel: ${recordsProcessed} cities updated from published OMC rates`,
      recordsProcessed,
      errors,
      source: 'IOCL/BPCL published rates',
    };
  } catch (error) {
    return {
      success: false,
      message: `Fuel update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recordsProcessed,
      errors,
      source: 'IOCL/BPCL published rates',
    };
  }
}

export async function updateLpgPricesLive(): Promise<UpdateResult> {
  const errors: string[] = [];
  let recordsProcessed = 0;

  try {
    const today = getDateString(new Date());

    for (const [state, prices] of Object.entries(STATE_LPG)) {
      try {
        const prevRows = await query<(RowDataPacket & { domestic_14kg: number })[]>(
          'SELECT domestic_14kg FROM lpg_prices WHERE state = ? ORDER BY price_date DESC LIMIT 1',
          [state]
        );
        const change = prevRows[0] ? round2(prices.domestic - prevRows[0].domestic_14kg) : 0;

        await execute(
          `INSERT INTO lpg_prices (state, price_date, domestic_14kg, commercial_19kg, subsidy_amount, change_amount)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE domestic_14kg=VALUES(domestic_14kg), commercial_19kg=VALUES(commercial_19kg), subsidy_amount=VALUES(subsidy_amount), change_amount=VALUES(change_amount)`,
          [state, today, prices.domestic, prices.commercial, 0, change]
        );
        recordsProcessed++;
      } catch (error) {
        errors.push(`LPG ${state}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      message: `LPG: ${recordsProcessed} states updated from published OMC rates`,
      recordsProcessed,
      errors,
      source: 'OMC published rates',
    };
  } catch (error) {
    return {
      success: false,
      message: `LPG update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recordsProcessed,
      errors,
      source: 'OMC published rates',
    };
  }
}
