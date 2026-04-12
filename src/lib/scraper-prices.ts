import {
  updateFuelPricesLive,
  updateGoldPricesLive,
  updateLpgPricesLive,
  updateSilverPricesLive,
  type UpdateResult,
} from '@/lib/price-providers';

export async function scrapeGoldPrices(): Promise<UpdateResult> {
  return updateGoldPricesLive();
}

export async function scrapeSilverPrices(): Promise<UpdateResult> {
  return updateSilverPricesLive();
}

export async function scrapeFuelPrices(): Promise<UpdateResult> {
  return updateFuelPricesLive();
}

export async function scrapeLpgPrices(): Promise<UpdateResult> {
  return updateLpgPricesLive();
}

export default {
  scrapeGoldPrices,
  scrapeSilverPrices,
  scrapeFuelPrices,
  scrapeLpgPrices,
};
