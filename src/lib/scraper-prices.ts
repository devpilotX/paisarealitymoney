import { query, execute } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface CityRow extends RowDataPacket {
  id: number;
  slug: string;
  name: string;
  state: string;
  is_metro: boolean;
}

interface GoldPriceData {
  cityId: number;
  priceDate: string;
  gold24kPerGram: number;
  gold22kPerGram: number;
  gold18kPerGram: number;
  gold24kPer10gram: number;
  gold22kPer10gram: number;
  changeAmount: number;
  changePercent: number;
}

interface ScraperResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
}

const GOLD_BASE_24K = 7850;
const SILVER_BASE_PER_GRAM = 96.50;
const ALLOW_SYNTHETIC_PRICES = process.env.ALLOW_SYNTHETIC_PRICES === 'true';

function disabledSourceResult(priceType: string): ScraperResult {
  return {
    success: false,
    message:
      `${priceType} price refresh is not connected to an authoritative live provider. ` +
      'No database rows were changed. Configure an official/paid provider integration before using this in production, ' +
      'or set ALLOW_SYNTHETIC_PRICES=true only for local demo data.',
    recordsProcessed: 0,
    errors: [`${priceType} scraper blocked because synthetic prices are disabled.`],
  };
}

const CITY_GOLD_OFFSETS: Record<string, number> = {
  mumbai: 0, delhi: 20, bangalore: -10, chennai: 30, kolkata: 15,
  hyderabad: 5, pune: -5, ahmedabad: 10, jaipur: 25, lucknow: 20,
  surat: 10, kanpur: 22, nagpur: -3, indore: 18, thane: 0,
  bhopal: 16, visakhapatnam: 8, patna: 28, vadodara: 12, ghaziabad: 20,
  ludhiana: 22, agra: 24, coimbatore: 32, madurai: 34, varanasi: 26,
  rajkot: 14, ranchi: 30, chandigarh: 18, mysore: -8, guwahati: 35,
  bhubaneswar: 28, dehradun: 22, raipur: 20, kochi: 36, thiruvananthapuram: 38,
  jodhpur: 26, gwalior: 18, vijayawada: 10, amritsar: 24, noida: 20,
  mangalore: -6, jammu: 30, jalandhar: 22, shimla: 28, tiruchirappalli: 34,
  hubli: -4, salem: 32, aurangabad: -2, srinagar: 32, meerut: 22,
};

const CITY_FUEL_OFFSETS: Record<string, { petrol: number; diesel: number }> = {
  mumbai: { petrol: 4.50, diesel: 3.80 }, delhi: { petrol: 0, diesel: 0 },
  bangalore: { petrol: 2.20, diesel: 1.90 }, chennai: { petrol: 1.80, diesel: 1.50 },
  kolkata: { petrol: 3.10, diesel: 2.70 }, hyderabad: { petrol: 3.50, diesel: 3.10 },
  pune: { petrol: 4.20, diesel: 3.50 }, ahmedabad: { petrol: 1.50, diesel: 1.20 },
  jaipur: { petrol: 2.80, diesel: 2.40 }, lucknow: { petrol: 1.20, diesel: 0.90 },
  surat: { petrol: 1.60, diesel: 1.30 }, kanpur: { petrol: 1.30, diesel: 1.00 },
  nagpur: { petrol: 3.90, diesel: 3.20 }, indore: { petrol: 2.60, diesel: 2.20 },
  thane: { petrol: 4.50, diesel: 3.80 }, bhopal: { petrol: 2.70, diesel: 2.30 },
  visakhapatnam: { petrol: 3.40, diesel: 3.00 }, patna: { petrol: 3.20, diesel: 2.80 },
  vadodara: { petrol: 1.55, diesel: 1.25 }, ghaziabad: { petrol: 0.10, diesel: 0.10 },
  ludhiana: { petrol: 2.10, diesel: 1.70 }, agra: { petrol: 1.40, diesel: 1.10 },
  coimbatore: { petrol: 1.90, diesel: 1.60 }, madurai: { petrol: 2.00, diesel: 1.70 },
  varanasi: { petrol: 1.50, diesel: 1.20 }, rajkot: { petrol: 1.45, diesel: 1.15 },
  ranchi: { petrol: 2.90, diesel: 2.50 }, chandigarh: { petrol: 0.80, diesel: 0.60 },
  mysore: { petrol: 2.30, diesel: 2.00 }, guwahati: { petrol: 3.60, diesel: 3.20 },
  bhubaneswar: { petrol: 3.00, diesel: 2.60 }, dehradun: { petrol: 2.00, diesel: 1.60 },
  raipur: { petrol: 2.50, diesel: 2.10 }, kochi: { petrol: 3.30, diesel: 2.90 },
  thiruvananthapuram: { petrol: 3.40, diesel: 3.00 }, jodhpur: { petrol: 2.90, diesel: 2.50 },
  gwalior: { petrol: 2.60, diesel: 2.20 }, vijayawada: { petrol: 3.45, diesel: 3.05 },
  amritsar: { petrol: 2.20, diesel: 1.80 }, noida: { petrol: 0.15, diesel: 0.15 },
  mangalore: { petrol: 2.40, diesel: 2.10 }, jammu: { petrol: 2.50, diesel: 2.10 },
  jalandhar: { petrol: 2.15, diesel: 1.75 }, shimla: { petrol: 2.80, diesel: 2.40 },
  tiruchirappalli: { petrol: 2.00, diesel: 1.70 }, hubli: { petrol: 2.35, diesel: 2.05 },
  salem: { petrol: 1.95, diesel: 1.65 }, aurangabad: { petrol: 3.85, diesel: 3.15 },
  srinagar: { petrol: 3.70, diesel: 3.30 }, meerut: { petrol: 0.20, diesel: 0.20 },
};

const STATE_LPG_PRICES: Record<string, { domestic: number; commercial: number }> = {
  'Maharashtra': { domestic: 903.00, commercial: 1865.50 },
  'Delhi': { domestic: 803.00, commercial: 1772.00 },
  'Karnataka': { domestic: 903.50, commercial: 1880.00 },
  'Tamil Nadu': { domestic: 903.00, commercial: 1877.50 },
  'West Bengal': { domestic: 903.00, commercial: 1907.50 },
  'Telangana': { domestic: 903.00, commercial: 1870.00 },
  'Gujarat': { domestic: 903.00, commercial: 1825.00 },
  'Rajasthan': { domestic: 903.00, commercial: 1840.50 },
  'Uttar Pradesh': { domestic: 903.00, commercial: 1810.00 },
  'Madhya Pradesh': { domestic: 903.00, commercial: 1835.00 },
  'Bihar': { domestic: 903.00, commercial: 1920.00 },
  'Punjab': { domestic: 903.00, commercial: 1800.00 },
  'Andhra Pradesh': { domestic: 903.00, commercial: 1875.00 },
  'Kerala': { domestic: 903.00, commercial: 1900.00 },
  'Jharkhand': { domestic: 903.00, commercial: 1915.00 },
  'Assam': { domestic: 903.00, commercial: 1950.00 },
  'Odisha': { domestic: 903.00, commercial: 1895.00 },
  'Chhattisgarh': { domestic: 903.00, commercial: 1850.00 },
  'Uttarakhand': { domestic: 903.00, commercial: 1830.00 },
  'Himachal Pradesh': { domestic: 903.00, commercial: 1845.00 },
  'Chandigarh': { domestic: 803.00, commercial: 1790.00 },
  'Jammu & Kashmir': { domestic: 903.00, commercial: 1860.00 },
};

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function getDailyVariation(seed: number): number {
  const hash = Math.sin(seed) * 10000;
  return (hash - Math.floor(hash) - 0.5) * 2;
}

async function getAllCities(): Promise<CityRow[]> {
  return query<CityRow[]>('SELECT id, slug, name, state, is_metro FROM cities ORDER BY id');
}

async function getPreviousGoldPrice(cityId: number): Promise<number | null> {
  const rows = await query<(RowDataPacket & { gold_24k_per_gram: number })[]>(
    'SELECT gold_24k_per_gram FROM gold_prices WHERE city_id = ? ORDER BY price_date DESC LIMIT 1',
    [cityId]
  );
  return rows.length > 0 && rows[0] ? rows[0].gold_24k_per_gram : null;
}

async function getPreviousSilverPrice(cityId: number): Promise<number | null> {
  const rows = await query<(RowDataPacket & { silver_per_gram: number })[]>(
    'SELECT silver_per_gram FROM silver_prices WHERE city_id = ? ORDER BY price_date DESC LIMIT 1',
    [cityId]
  );
  return rows.length > 0 && rows[0] ? rows[0].silver_per_gram : null;
}

async function getPreviousFuelPrices(cityId: number): Promise<{ petrol: number; diesel: number } | null> {
  const rows = await query<(RowDataPacket & { petrol_price: number; diesel_price: number })[]>(
    'SELECT petrol_price, diesel_price FROM fuel_prices WHERE city_id = ? ORDER BY price_date DESC LIMIT 1',
    [cityId]
  );
  return rows.length > 0 && rows[0] ? { petrol: rows[0].petrol_price, diesel: rows[0].diesel_price } : null;
}

export async function scrapeGoldPrices(): Promise<ScraperResult> {
  if (!ALLOW_SYNTHETIC_PRICES) {
    return disabledSourceResult('Gold');
  }

  const errors: string[] = [];
  let recordsProcessed = 0;
  try {
    const cities = await getAllCities();
    const today = new Date();
    const dateStr = getDateString(today);
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const dailyVar = getDailyVariation(daySeed) * 30;

    for (const city of cities) {
      try {
        const offset = CITY_GOLD_OFFSETS[city.slug] ?? 15;
        const cityVar = getDailyVariation(daySeed + city.id) * 10;
        const price24k = Math.round((GOLD_BASE_24K + offset + dailyVar + cityVar) * 100) / 100;
        const price22k = Math.round(price24k * 0.9167 * 100) / 100;
        const price18k = Math.round(price24k * 0.75 * 100) / 100;

        const prevPrice = await getPreviousGoldPrice(city.id);
        const changeAmount = prevPrice ? Math.round((price24k - prevPrice) * 100) / 100 : 0;
        const changePercent = prevPrice ? Math.round((changeAmount / prevPrice) * 10000) / 100 : 0;

        const priceData: GoldPriceData = {
          cityId: city.id, priceDate: dateStr,
          gold24kPerGram: price24k, gold22kPerGram: price22k, gold18kPerGram: price18k,
          gold24kPer10gram: price24k * 10, gold22kPer10gram: price22k * 10,
          changeAmount, changePercent,
        };

        await execute(
          `INSERT INTO gold_prices (city_id, price_date, gold_24k_per_gram, gold_22k_per_gram, gold_18k_per_gram, gold_24k_per_10gram, gold_22k_per_10gram, change_amount, change_percent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE gold_24k_per_gram=VALUES(gold_24k_per_gram), gold_22k_per_gram=VALUES(gold_22k_per_gram), gold_18k_per_gram=VALUES(gold_18k_per_gram), gold_24k_per_10gram=VALUES(gold_24k_per_10gram), gold_22k_per_10gram=VALUES(gold_22k_per_10gram), change_amount=VALUES(change_amount), change_percent=VALUES(change_percent)`,
          [priceData.cityId, priceData.priceDate, priceData.gold24kPerGram, priceData.gold22kPerGram, priceData.gold18kPerGram, priceData.gold24kPer10gram, priceData.gold22kPer10gram, priceData.changeAmount, priceData.changePercent]
        );
        recordsProcessed++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Gold price error for ${city.name}: ${msg}`);
      }
    }
    return { success: true, message: `Gold prices updated for ${recordsProcessed} cities`, recordsProcessed, errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Gold scraper failed: ${msg}`, recordsProcessed, errors };
  }
}

export async function scrapeSilverPrices(): Promise<ScraperResult> {
  if (!ALLOW_SYNTHETIC_PRICES) {
    return disabledSourceResult('Silver');
  }

  const errors: string[] = [];
  let recordsProcessed = 0;
  try {
    const cities = await getAllCities();
    const today = new Date();
    const dateStr = getDateString(today);
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const dailyVar = getDailyVariation(daySeed + 1000) * 1.5;

    for (const city of cities) {
      try {
        const offset = (CITY_GOLD_OFFSETS[city.slug] ?? 15) * 0.012;
        const cityVar = getDailyVariation(daySeed + city.id + 500) * 0.5;
        const silverPerGram = Math.round((SILVER_BASE_PER_GRAM + offset + dailyVar + cityVar) * 100) / 100;
        const silverPerKg = Math.round(silverPerGram * 1000 * 100) / 100;

        const prevPrice = await getPreviousSilverPrice(city.id);
        const changeAmount = prevPrice ? Math.round((silverPerGram - prevPrice) * 100) / 100 : 0;
        const changePercent = prevPrice ? Math.round((changeAmount / prevPrice) * 10000) / 100 : 0;

        await execute(
          `INSERT INTO silver_prices (city_id, price_date, silver_per_gram, silver_per_kg, change_amount, change_percent)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE silver_per_gram=VALUES(silver_per_gram), silver_per_kg=VALUES(silver_per_kg), change_amount=VALUES(change_amount), change_percent=VALUES(change_percent)`,
          [city.id, dateStr, silverPerGram, silverPerKg, changeAmount, changePercent]
        );
        recordsProcessed++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Silver price error for ${city.name}: ${msg}`);
      }
    }
    return { success: true, message: `Silver prices updated for ${recordsProcessed} cities`, recordsProcessed, errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Silver scraper failed: ${msg}`, recordsProcessed, errors };
  }
}

export async function scrapeFuelPrices(): Promise<ScraperResult> {
  if (!ALLOW_SYNTHETIC_PRICES) {
    return disabledSourceResult('Fuel');
  }

  const errors: string[] = [];
  let recordsProcessed = 0;
  try {
    const cities = await getAllCities();
    const today = new Date();
    const dateStr = getDateString(today);
    const basePetrol = 94.72;
    const baseDiesel = 87.62;

    for (const city of cities) {
      try {
        const offsets = CITY_FUEL_OFFSETS[city.slug] ?? { petrol: 2.00, diesel: 1.50 };
        const petrolPrice = Math.round((basePetrol + offsets.petrol) * 100) / 100;
        const dieselPrice = Math.round((baseDiesel + offsets.diesel) * 100) / 100;

        const prev = await getPreviousFuelPrices(city.id);
        const petrolChange = prev ? Math.round((petrolPrice - prev.petrol) * 100) / 100 : 0;
        const dieselChange = prev ? Math.round((dieselPrice - prev.diesel) * 100) / 100 : 0;

        await execute(
          `INSERT INTO fuel_prices (city_id, price_date, petrol_price, diesel_price, petrol_change, diesel_change)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE petrol_price=VALUES(petrol_price), diesel_price=VALUES(diesel_price), petrol_change=VALUES(petrol_change), diesel_change=VALUES(diesel_change)`,
          [city.id, dateStr, petrolPrice, dieselPrice, petrolChange, dieselChange]
        );
        recordsProcessed++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Fuel price error for ${city.name}: ${msg}`);
      }
    }
    return { success: true, message: `Fuel prices updated for ${recordsProcessed} cities`, recordsProcessed, errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Fuel scraper failed: ${msg}`, recordsProcessed, errors };
  }
}

export async function scrapeLpgPrices(): Promise<ScraperResult> {
  if (!ALLOW_SYNTHETIC_PRICES) {
    return disabledSourceResult('LPG');
  }

  const errors: string[] = [];
  let recordsProcessed = 0;
  try {
    const today = new Date();
    const dateStr = getDateString(today);

    for (const [state, prices] of Object.entries(STATE_LPG_PRICES)) {
      try {
        await execute(
          `INSERT INTO lpg_prices (state, price_date, domestic_14kg, commercial_19kg, subsidy_amount, change_amount)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE domestic_14kg=VALUES(domestic_14kg), commercial_19kg=VALUES(commercial_19kg), subsidy_amount=VALUES(subsidy_amount), change_amount=VALUES(change_amount)`,
          [state, dateStr, prices.domestic, prices.commercial, 0, 0]
        );
        recordsProcessed++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`LPG price error for ${state}: ${msg}`);
      }
    }
    return { success: true, message: `LPG prices updated for ${recordsProcessed} states`, recordsProcessed, errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `LPG scraper failed: ${msg}`, recordsProcessed, errors };
  }
}

export default { scrapeGoldPrices, scrapeSilverPrices, scrapeFuelPrices, scrapeLpgPrices };
