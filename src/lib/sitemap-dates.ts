/**
 * Resolving lastmod for the sitemap.
 *
 * The rule that was missing: lastmod describes the PAGE, not just the database
 * row behind it. On 2026-07-26 every scheme and scholarship page gained a
 * "last date to apply" answer, a social card and a rewritten title, and the
 * scholarship pages gained an entire FAQ section, without a single row changing.
 * Because the entries used the row's updated_at, the sitemap kept telling Google
 * those 413 pages had not changed since 20 and 21 July.
 *
 * So take whichever is later, the row or the template. Blanket-bumping every
 * lastmod on every deploy is the other failure mode: Google learns to distrust
 * the field. This keeps a stable, meaningful date that only moves when the page
 * genuinely changes.
 *
 * A future date is never emitted, because a row with a clock-skewed or bad
 * updated_at should not advertise a page that does not exist yet.
 */

/** The date the page templates last changed in a way a reader would notice. */
export const TEMPLATE_UPDATED = '2026-07-26';

/**
 * Later of the record's own timestamp and the template date, clamped so it is
 * never in the future.
 *
 * @param value the record's updated_at, which may be null or unparseable
 * @param templateIso the date the rendering template last changed
 * @param nowMs injectable current time, for tests
 */
export function resolveLastModified(
  value: string | Date | null | undefined,
  templateIso: string,
  nowMs: number = Date.now(),
): string {
  const templateMs = new Date(templateIso).getTime();
  const template = Number.isNaN(templateMs) ? 0 : templateMs;

  let rowMs = 0;
  if (value) {
    const parsed = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(parsed.getTime())) rowMs = parsed.getTime();
  }

  const chosen = Math.min(Math.max(rowMs, template), nowMs);
  return new Date(chosen).toISOString();
}
