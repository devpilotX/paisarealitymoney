import { revalidatePath } from 'next/cache';

/**
 * Price surfaces are prerendered with ISR (`export const revalidate = ...`).
 * On a low-traffic site the time-based cache serves the last snapshot to the
 * first visitor while it regenerates in the background, so the visible "as of"
 * date lags the database by a day or more. After every price update we purge
 * these routes on demand so the next request renders fresh data immediately.
 *
 * Best-effort: any failure here must never fail the price update itself.
 */

/** Static hub pages that show the latest prices. */
const PRICE_HUB_PATHS = [
  '/',
  '/gold-rate',
  '/silver-rate',
  '/petrol-price',
  '/diesel-price',
  '/lpg-price',
] as const;

/** Dynamic per-city routes. `revalidatePath(path, 'page')` purges every city. */
const PRICE_CITY_ROUTES = [
  '/gold-rate/[city]',
  '/silver-rate/[city]',
  '/petrol-price/[city]',
  '/diesel-price/[city]',
  '/hi/gold-rate/[city]',
] as const;

/** Revalidate every price route. Returns the count purged, or -1 on failure. */
export function revalidatePriceRoutes(): number {
  try {
    for (const path of PRICE_HUB_PATHS) {
      revalidatePath(path);
    }
    for (const route of PRICE_CITY_ROUTES) {
      revalidatePath(route, 'page');
    }
    return PRICE_HUB_PATHS.length + PRICE_CITY_ROUTES.length;
  } catch (error) {
    console.error('revalidatePriceRoutes failed:', error instanceof Error ? error.message : error);
    return -1;
  }
}
