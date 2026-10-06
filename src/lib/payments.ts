/**
 * Payments switch. While NEXT_PUBLIC_PAYMENTS_ENABLED is not "true", the site is
 * entirely free: no pricing page, no upgrade buttons, no checkout API, and every
 * account gets the higher alert limit. The Razorpay code stays in place so paid
 * plans can come back by setting the variable and rebuilding (it is a build-time
 * value, inlined into client bundles).
 *
 * Before turning it back on, restore the Premium wording on /about,
 * /editorial-policy and the Razorpay line in /privacy.
 */
import { ALERT_LIMITS } from '@/lib/price-alerts-core';

export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

type Plan = keyof typeof ALERT_LIMITS;

/** Active price-alert limit for a plan. With payments off, everyone gets the top limit. */
export function alertLimitFor(plan: string | undefined, paymentsEnabled = PAYMENTS_ENABLED): number {
  if (!paymentsEnabled) return ALERT_LIMITS.premium;
  return ALERT_LIMITS[(plan as Plan) in ALERT_LIMITS ? (plan as Plan) : 'free'];
}
