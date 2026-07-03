/**
 * Price alerts — pure decision logic, no imports, no side effects.
 * Kept dependency-free so the unit tests (and any future worker) can use it
 * without touching the database or email layers.
 */

export type AlertCommodity = 'gold_24k' | 'gold_22k' | 'silver';
export type AlertDirection = 'below' | 'above';

export const ALERT_COMMODITY_LABELS: Record<AlertCommodity, string> = {
  gold_24k: '24K Gold (per gram)',
  gold_22k: '22K Gold (per gram)',
  silver: 'Silver (per gram)',
};

/** Active-alert limits by plan. Premium gets more headroom. */
export const ALERT_LIMITS = { free: 3, premium: 15 } as const;

export function isAlertCommodity(value: unknown): value is AlertCommodity {
  return value === 'gold_24k' || value === 'gold_22k' || value === 'silver';
}

export function isAlertDirection(value: unknown): value is AlertDirection {
  return value === 'below' || value === 'above';
}

/** The one decision that matters: does this alert fire at this price? */
export function alertShouldFire(direction: AlertDirection, targetPrice: number, currentPrice: number): boolean {
  if (!Number.isFinite(targetPrice) || !Number.isFinite(currentPrice) || currentPrice <= 0) return false;
  return direction === 'below' ? currentPrice <= targetPrice : currentPrice >= targetPrice;
}

/** Sanity bounds so typos (Rs 10 gold, Rs 10 crore silver) are rejected at creation. */
export function isSaneTarget(commodity: AlertCommodity, targetPrice: number): boolean {
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) return false;
  if (commodity === 'silver') return targetPrice >= 10 && targetPrice <= 2000;
  return targetPrice >= 1000 && targetPrice <= 100000;
}
