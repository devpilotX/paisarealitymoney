import { createHash, timingSafeEqual } from 'crypto';

/**
 * Constant-time comparison for shared secrets (cron key, admin password).
 * Both sides are hashed first so the lengths always match and the comparison
 * time does not reveal how long the real secret is. Fails closed when the
 * expected value is unset or empty.
 */
export function secretMatches(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected || !provided) return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
