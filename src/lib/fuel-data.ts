/**
 * Verified fuel and LPG baseline data with provenance.
 *
 * Every figure below was checked against OMC-published rates as aggregated by
 * GoodReturns and CarDekho on the date in FUEL_BASELINE_AS_OF. City prices use
 * the published city rate where one exists; otherwise the published state rate
 * applies (intra-state variation is typically under Rs 1/litre for fuel).
 * Commercial LPG is stored only where a published figure exists; unknown
 * values stay null and render as "varies" rather than a made-up number.
 *
 * Runtime overrides live in the price_overrides table (admin-managed) and take
 * precedence over this baseline. See price-providers.ts for the merge order.
 */

export const FUEL_BASELINE_AS_OF = '2026-07-02';
export const FUEL_BASELINE_SOURCE = 'OMC published rates (IOCL/BPCL/HPCL) via GoodReturns and CarDekho';

export interface FuelRate {
  petrol: number;
  diesel: number;
}

export interface LpgRate {
  domestic: number;
  commercial: number | null;
}

/** Published state/UT rates per litre. */
export const STATE_FUEL: Record<string, FuelRate> = {
  'Andhra Pradesh': { petrol: 117.61, diesel: 105.3 },
  'Arunachal Pradesh': { petrol: 99.69, diesel: 89.11 },
  Assam: { petrol: 106.55, diesel: 97.98 },
  Bihar: { petrol: 115.06, diesel: 101.07 },
  Chandigarh: { petrol: 101.54, diesel: 89.47 },
  Chhattisgarh: { petrol: 108.06, diesel: 101.32 },
  Delhi: { petrol: 102.12, diesel: 95.2 },
  Gujarat: { petrol: 101.83, diesel: 97.92 },
  Haryana: { petrol: 103.32, diesel: 95.96 },
  'Himachal Pradesh': { petrol: 101.29, diesel: 93.36 },
  'Jammu & Kashmir': { petrol: 100.32, diesel: 86.65 },
  Jharkhand: { petrol: 105.62, diesel: 100.77 },
  Karnataka: { petrol: 110.98, diesel: 98.91 },
  Kerala: { petrol: 114.01, diesel: 102.9 },
  'Madhya Pradesh': { petrol: 116.02, diesel: 101.01 },
  Maharashtra: { petrol: 111.78, diesel: 98.48 },
  Odisha: { petrol: 110.26, diesel: 101.92 },
  Punjab: { petrol: 105.29, diesel: 95.22 },
  Rajasthan: { petrol: 112.31, diesel: 97.46 },
  'Tamil Nadu': { petrol: 109.75, diesel: 101.55 },
  Telangana: { petrol: 116.94, diesel: 104.97 },
  'Uttar Pradesh': { petrol: 101.66, diesel: 95.14 },
  Uttarakhand: { petrol: 100.82, diesel: 96.17 },
  'West Bengal': { petrol: 114.7, diesel: 100.96 },
};

/** Published city-specific rates that differ from the state figure. */
export const CITY_FUEL_PUBLISHED: Record<string, Partial<FuelRate>> = {
  delhi: { petrol: 102.12, diesel: 95.2 },
  mumbai: { petrol: 111.21, diesel: 97.83 },
  kolkata: { petrol: 113.51, diesel: 99.82 },
  chennai: { petrol: 107.77, diesel: 99.55 },
  bangalore: { petrol: 111.68, diesel: 99.56 },
  hyderabad: { petrol: 115.69, diesel: 103.82 },
  jaipur: { petrol: 113.19 },
  lucknow: { petrol: 101.86 },
  patna: { petrol: 113.69 },
  thiruvananthapuram: { petrol: 114.8 },
  chandigarh: { petrol: 101.54, diesel: 89.47 },
  bhubaneswar: { petrol: 108.97 },
  noida: { petrol: 101.96 },
  raipur: { petrol: 108.06, diesel: 101.32 },
};

/** Fallback when a city's state is somehow missing from STATE_FUEL. */
export const FUEL_NATIONAL_FALLBACK: FuelRate = { petrol: 106.5, diesel: 97.5 };

/**
 * Resolve the baseline rate for a city: published city rate first, then the
 * state rate for any component the city figure does not cover.
 */
export function resolveCityFuel(citySlug: string, state: string): FuelRate {
  const stateRate = STATE_FUEL[state] ?? FUEL_NATIONAL_FALLBACK;
  const cityRate = CITY_FUEL_PUBLISHED[citySlug];
  return {
    petrol: cityRate?.petrol ?? stateRate.petrol,
    diesel: cityRate?.diesel ?? stateRate.diesel,
  };
}

/** Published 14.2 kg domestic and 19 kg commercial cylinder rates by state/UT. */
export const STATE_LPG: Record<string, LpgRate> = {
  'Andaman & Nicobar Islands': { domestic: 1018.0, commercial: null },
  'Andhra Pradesh': { domestic: 966.5, commercial: null },
  'Arunachal Pradesh': { domestic: 1007.5, commercial: null },
  Assam: { domestic: 991.0, commercial: null },
  Bihar: { domestic: 1031.5, commercial: null },
  Chandigarh: { domestic: 951.5, commercial: null },
  Chhattisgarh: { domestic: 1013.0, commercial: null },
  Delhi: { domestic: 942.0, commercial: 2930.0 },
  Goa: { domestic: 956.0, commercial: null },
  Gujarat: { domestic: 949.5, commercial: null },
  Haryana: { domestic: 943.5, commercial: null },
  'Himachal Pradesh': { domestic: 987.5, commercial: null },
  'Jammu & Kashmir': { domestic: 993.5, commercial: null },
  Jharkhand: { domestic: 999.5, commercial: null },
  Karnataka: { domestic: 944.5, commercial: 3021.0 },
  Kerala: { domestic: 951.0, commercial: null },
  'Madhya Pradesh': { domestic: 947.5, commercial: null },
  Maharashtra: { domestic: 941.5, commercial: 2885.5 },
  Manipur: { domestic: 1093.5, commercial: null },
  Meghalaya: { domestic: 1009.0, commercial: null },
  Mizoram: { domestic: 1094.0, commercial: null },
  Nagaland: { domestic: 961.0, commercial: null },
  Odisha: { domestic: 968.0, commercial: null },
  Puducherry: { domestic: 954.0, commercial: null },
  Punjab: { domestic: 983.0, commercial: null },
  Rajasthan: { domestic: 945.5, commercial: null },
  Sikkim: { domestic: 1094.5, commercial: null },
  'Tamil Nadu': { domestic: 957.5, commercial: 3106.0 },
  Telangana: { domestic: 994.0, commercial: 3191.0 },
  Tripura: { domestic: 1102.5, commercial: null },
  'Uttar Pradesh': { domestic: 979.5, commercial: null },
  Uttarakhand: { domestic: 961.0, commercial: null },
  'West Bengal': { domestic: 968.0, commercial: 3081.5 },
};

/** How old fuel data may get before the daily cron emails an admin alert. */
export const FUEL_STALE_AFTER_DAYS = 14;
/** LPG revises monthly, so allow a full cycle plus grace before alerting. */
export const LPG_STALE_AFTER_DAYS = 40;
