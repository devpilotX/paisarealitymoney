/**
 * Price alerts — the retention loop.
 *
 * Users set a one-shot target ("email me when 24K gold in Jaipur drops below
 * Rs 11,000/gram"); the daily price cron calls checkPriceAlerts() after
 * writing fresh prices. Firing is one-shot: an alert deactivates once its
 * email is sent, and stays active to retry if the send fails.
 *
 * Decision logic lives in price-alerts-core.ts (pure, unit-tested); this
 * module owns the database and email sides.
 */
import { query, execute } from '@/lib/db';
import { sendPriceAlertEmail } from '@/lib/email';
import { ALERT_COMMODITY_LABELS, alertShouldFire, type AlertDirection, type AlertCommodity } from '@/lib/price-alerts-core';
import type { QueryResultRow } from 'pg';

export {
  ALERT_COMMODITY_LABELS,
  ALERT_LIMITS,
  alertShouldFire,
  isAlertCommodity,
  isAlertDirection,
  isSaneTarget,
  type AlertCommodity,
  type AlertDirection,
} from '@/lib/price-alerts-core';

interface AlertJoinRow extends QueryResultRow {
  id: number;
  direction: AlertDirection;
  target_price: number;
  commodity: AlertCommodity;
  email: string;
  user_name: string | null;
  city_name: string;
  current_price: number;
}

export interface AlertCheckResult {
  checked: number;
  fired: number;
  errors: string[];
}

/**
 * Evaluate all active alerts against the latest stored prices and email the
 * owners of any that fire. Tolerates a missing table (pre-migration) by
 * returning zeros so the cron never breaks.
 */
export async function checkPriceAlerts(): Promise<AlertCheckResult> {
  const errors: string[] = [];
  let rows: AlertJoinRow[] = [];

  try {
    const goldRows = await query<AlertJoinRow>(
      `SELECT a.id, a.direction, a.target_price, a.commodity, u.email,
              COALESCE(u.name, '') AS user_name, c.name AS city_name,
              CASE WHEN a.commodity = 'gold_24k' THEN gp.gold_24k_per_gram ELSE gp.gold_22k_per_gram END AS current_price
       FROM price_alerts a
       JOIN users u ON u.id = a.user_id
       JOIN cities c ON c.slug = a.city_slug
       JOIN gold_prices gp ON gp.city_id = c.id
         AND gp.price_date = (SELECT MAX(price_date) FROM gold_prices)
       WHERE a.active AND a.commodity IN ('gold_24k', 'gold_22k')`
    );
    const silverRows = await query<AlertJoinRow>(
      `SELECT a.id, a.direction, a.target_price, a.commodity, u.email,
              COALESCE(u.name, '') AS user_name, c.name AS city_name,
              sp.silver_per_gram AS current_price
       FROM price_alerts a
       JOIN users u ON u.id = a.user_id
       JOIN cities c ON c.slug = a.city_slug
       JOIN silver_prices sp ON sp.city_id = c.id
         AND sp.price_date = (SELECT MAX(price_date) FROM silver_prices)
       WHERE a.active AND a.commodity = 'silver'`
    );
    rows = [...goldRows, ...silverRows];
  } catch {
    // price_alerts table not migrated yet — nothing to check.
    return { checked: 0, fired: 0, errors: [] };
  }

  let fired = 0;
  for (const row of rows) {
    const current = Number(row.current_price);
    const target = Number(row.target_price);
    if (!alertShouldFire(row.direction, target, current)) continue;

    try {
      const sent = await sendPriceAlertEmail(row.email, row.user_name || 'there', {
        commodityLabel: ALERT_COMMODITY_LABELS[row.commodity],
        cityName: row.city_name,
        direction: row.direction,
        targetPrice: target,
        currentPrice: current,
      });
      if (sent) {
        await execute(
          'UPDATE price_alerts SET active = FALSE, triggered_at = NOW(), triggered_price = $1 WHERE id = $2',
          [current, row.id]
        );
        fired++;
      } else {
        errors.push(`Alert ${row.id}: email send failed, will retry next run`);
      }
    } catch (error) {
      errors.push(`Alert ${row.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { checked: rows.length, fired, errors };
}
