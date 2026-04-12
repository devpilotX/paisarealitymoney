import mysql from 'mysql2/promise';
import { CITIES } from '../src/lib/cities';

const GOLD_BASE_24K = 7850;
const SILVER_BASE_PER_GRAM = 96.5;
const BASE_PETROL = 94.72;
const BASE_DIESEL = 87.62;
const DAYS_TO_SEED = 30;

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
  Maharashtra: { domestic: 903.00, commercial: 1865.50 },
  Delhi: { domestic: 803.00, commercial: 1772.00 },
  Karnataka: { domestic: 903.50, commercial: 1880.00 },
  'Tamil Nadu': { domestic: 903.00, commercial: 1877.50 },
  'West Bengal': { domestic: 903.00, commercial: 1907.50 },
  Telangana: { domestic: 903.00, commercial: 1870.00 },
  Gujarat: { domestic: 903.00, commercial: 1825.00 },
  Rajasthan: { domestic: 903.00, commercial: 1840.50 },
  'Uttar Pradesh': { domestic: 903.00, commercial: 1810.00 },
  'Madhya Pradesh': { domestic: 903.00, commercial: 1835.00 },
  Bihar: { domestic: 903.00, commercial: 1920.00 },
  Punjab: { domestic: 903.00, commercial: 1800.00 },
  'Andhra Pradesh': { domestic: 903.00, commercial: 1875.00 },
  Kerala: { domestic: 903.00, commercial: 1900.00 },
  Jharkhand: { domestic: 903.00, commercial: 1915.00 },
  Assam: { domestic: 903.00, commercial: 1950.00 },
  Odisha: { domestic: 903.00, commercial: 1895.00 },
  Chhattisgarh: { domestic: 903.00, commercial: 1850.00 },
  Uttarakhand: { domestic: 903.00, commercial: 1830.00 },
  'Himachal Pradesh': { domestic: 903.00, commercial: 1845.00 },
  Chandigarh: { domestic: 803.00, commercial: 1790.00 },
  'Jammu & Kashmir': { domestic: 903.00, commercial: 1860.00 },
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function getDailyVariation(seed: number): number {
  const hash = Math.sin(seed) * 10000;
  return (hash - Math.floor(hash) - 0.5) * 2;
}

function getDaySeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

async function seedPrices(): Promise<void> {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'paisareality',
  });

  const previousGold = new Map<string, number>();
  const previousSilver = new Map<string, number>();
  const previousPetrol = new Map<string, number>();
  const previousDiesel = new Map<string, number>();
  const previousLpg = new Map<string, number>();
  const cityStates = Array.from(new Set(CITIES.map((city) => city.state)));
  let recordsProcessed = 0;

  console.log(`Connected to MySQL. Seeding ${DAYS_TO_SEED} days of prices for ${CITIES.length} cities...`);

  try {
    for (let dayOffset = DAYS_TO_SEED - 1; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const dateStr = getDateString(date);
      const daySeed = getDaySeed(date);
      const goldMarketVar = getDailyVariation(daySeed) * 30;
      const silverMarketVar = getDailyVariation(daySeed + 1000) * 1.5;
      const fuelMarketVar = getDailyVariation(daySeed + 2000) * 0.12;
      const lpgMarketVar = getDailyVariation(daySeed + 3000) * 1.25;

      for (const city of CITIES) {
        const goldOffset = CITY_GOLD_OFFSETS[city.slug] ?? 15;
        const fuelOffset = CITY_FUEL_OFFSETS[city.slug] ?? { petrol: 2.00, diesel: 1.50 };
        const cityGoldVar = getDailyVariation(daySeed + city.latitude + city.longitude) * 10;
        const citySilverVar = getDailyVariation(daySeed + city.latitude + 500) * 0.5;

        const gold24k = round2(GOLD_BASE_24K + goldOffset + goldMarketVar + cityGoldVar);
        const gold22k = round2(gold24k * 0.9167);
        const gold18k = round2(gold24k * 0.75);
        const oldGold = previousGold.get(city.slug);
        const goldChange = oldGold === undefined ? 0 : round2(gold24k - oldGold);
        const goldChangePercent = oldGold === undefined ? 0 : round2((goldChange / oldGold) * 100);
        previousGold.set(city.slug, gold24k);

        await connection.execute(
          `INSERT INTO gold_prices (city_id, price_date, gold_24k_per_gram, gold_22k_per_gram, gold_18k_per_gram, gold_24k_per_10gram, gold_22k_per_10gram, change_amount, change_percent)
           SELECT id, ?, ?, ?, ?, ?, ?, ?, ? FROM cities WHERE slug = ?
           ON DUPLICATE KEY UPDATE gold_24k_per_gram=VALUES(gold_24k_per_gram), gold_22k_per_gram=VALUES(gold_22k_per_gram), gold_18k_per_gram=VALUES(gold_18k_per_gram), gold_24k_per_10gram=VALUES(gold_24k_per_10gram), gold_22k_per_10gram=VALUES(gold_22k_per_10gram), change_amount=VALUES(change_amount), change_percent=VALUES(change_percent)`,
          [dateStr, gold24k, gold22k, gold18k, round2(gold24k * 10), round2(gold22k * 10), goldChange, goldChangePercent, city.slug]
        );

        const silverPerGram = round2(SILVER_BASE_PER_GRAM + goldOffset * 0.012 + silverMarketVar + citySilverVar);
        const oldSilver = previousSilver.get(city.slug);
        const silverChange = oldSilver === undefined ? 0 : round2(silverPerGram - oldSilver);
        const silverChangePercent = oldSilver === undefined ? 0 : round2((silverChange / oldSilver) * 100);
        previousSilver.set(city.slug, silverPerGram);

        await connection.execute(
          `INSERT INTO silver_prices (city_id, price_date, silver_per_gram, silver_per_kg, change_amount, change_percent)
           SELECT id, ?, ?, ?, ?, ? FROM cities WHERE slug = ?
           ON DUPLICATE KEY UPDATE silver_per_gram=VALUES(silver_per_gram), silver_per_kg=VALUES(silver_per_kg), change_amount=VALUES(change_amount), change_percent=VALUES(change_percent)`,
          [dateStr, silverPerGram, round2(silverPerGram * 1000), silverChange, silverChangePercent, city.slug]
        );

        const petrolPrice = round2(BASE_PETROL + fuelOffset.petrol + fuelMarketVar);
        const dieselPrice = round2(BASE_DIESEL + fuelOffset.diesel + fuelMarketVar);
        const oldPetrol = previousPetrol.get(city.slug);
        const oldDiesel = previousDiesel.get(city.slug);
        const petrolChange = oldPetrol === undefined ? 0 : round2(petrolPrice - oldPetrol);
        const dieselChange = oldDiesel === undefined ? 0 : round2(dieselPrice - oldDiesel);
        previousPetrol.set(city.slug, petrolPrice);
        previousDiesel.set(city.slug, dieselPrice);

        await connection.execute(
          `INSERT INTO fuel_prices (city_id, price_date, petrol_price, diesel_price, petrol_change, diesel_change)
           SELECT id, ?, ?, ?, ?, ? FROM cities WHERE slug = ?
           ON DUPLICATE KEY UPDATE petrol_price=VALUES(petrol_price), diesel_price=VALUES(diesel_price), petrol_change=VALUES(petrol_change), diesel_change=VALUES(diesel_change)`,
          [dateStr, petrolPrice, dieselPrice, petrolChange, dieselChange, city.slug]
        );

        recordsProcessed += 3;
      }

      for (const state of cityStates) {
        const base = STATE_LPG_PRICES[state] ?? { domestic: 903.00, commercial: 1850.00 };
        const domestic = round2(base.domestic + lpgMarketVar);
        const commercial = round2(base.commercial + lpgMarketVar * 2);
        const oldDomestic = previousLpg.get(state);
        const changeAmount = oldDomestic === undefined ? 0 : round2(domestic - oldDomestic);
        previousLpg.set(state, domestic);

        await connection.execute(
          `INSERT INTO lpg_prices (state, price_date, domestic_14kg, commercial_19kg, subsidy_amount, change_amount)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE domestic_14kg=VALUES(domestic_14kg), commercial_19kg=VALUES(commercial_19kg), subsidy_amount=VALUES(subsidy_amount), change_amount=VALUES(change_amount)`,
          [state, dateStr, domestic, commercial, 0, changeAmount]
        );

        recordsProcessed++;
      }

      console.log(`  Seeded prices for ${dateStr}`);
    }

    console.log(`\nDone. ${recordsProcessed} price rows inserted/updated.`);
  } finally {
    await connection.end();
  }
}

seedPrices().catch((error) => {
  console.error('Price seed failed:', error);
  process.exit(1);
});
