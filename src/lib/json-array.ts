/**
 * Tolerant reader for jsonb array columns.
 *
 * node-postgres returns a `jsonb` column as an already-parsed JS value, so
 * calling JSON.parse on it throws and any catch-and-return-empty wrapper
 * silently produces an empty list. That exact bug hid the eligibility rows and
 * the entire Documents Required section on every English scheme page until it
 * was fixed on 2026-07-21, and the Hindi scheme route kept its own copy of the
 * broken version, so Hindi readers still saw no documents on 2026-07-26.
 *
 * The logic now lives in one place precisely so the two routes cannot drift
 * apart again. Accepts a parsed array or a JSON string, and returns only
 * strings.
 */
export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
