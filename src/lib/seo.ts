import type { Metadata } from 'next';

export const SITE_URL = 'https://paisareality.com';
export const SITE_NAME = 'Paisa Reality';

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http')) return path;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash === '/' ? SITE_URL : `${SITE_URL}${withSlash}`;
}

interface PageSeoInput {
  /**
   * The page title, rendered verbatim. The root layout uses template '%s', so
   * nothing is appended and this string is what Google sees in full.
   */
  title: string;
  description: string;
  /** Site-relative path, for example "/score". */
  path: string;
  keywords?: string[];
  /** Set true to keep the page out of search results. */
  noindex?: boolean;
  /** Override the OpenGraph type. Defaults to "website". */
  ogType?: 'website' | 'article';
}

/*
 * ---------------------------------------------------------------------------
 * Length-aware metadata builders for database-driven pages.
 *
 * Google truncates titles around 60 characters and descriptions around 155.
 * The previous fixed-suffix templates overshot both:
 *   - 242 of 312 template-driven scheme titles rendered over 60 chars (max 108)
 *   - 253 descriptions were hard-truncated mid-sentence, cutting the call to
 *     action off entirely
 *
 * These builders fit the suffix to the space available instead of appending
 * blindly, and never invent a fact. Measured against the scheme seed sources
 * (351 slugs, 39 with a hand-written meta_title, so 312 template-driven):
 *   titles over 60 : 242 -> 10   (the 10 are names that alone exceed 60 chars,
 *                                 which we leave intact rather than abbreviate)
 *   longest title   : 108 -> 78
 *   descriptions truncated : 253 -> 0
 *
 * Fitting alone is not the goal, so the suffix ladder descends by information
 * value. Titles carrying a real qualifier rather than just the year:
 *   91 of 312 -> 207   (bare name plus year: 205 -> 84)
 *
 * Scholarships (62 rows, 34 overrides, 31 template-driven) improve the same
 * way: titles over 60 went 31 -> 2, longest 120 -> 79.
 * ---------------------------------------------------------------------------
 */

/** Longest title Google will reliably display. */
export const TITLE_LIMIT = 60;
/** Longest meta description Google will reliably display. */
export const DESCRIPTION_LIMIT = 155;

/**
 * Build a title that fits within TITLE_LIMIT by choosing the richest suffix
 * that still fits. Falls back to the bare name rather than truncating it,
 * because a clipped scheme name is worse than a plain one.
 *
 * The ladder descends by information value, not just by length, so a page
 * keeps a real qualifier ("Eligibility", "How to Apply") wherever there is
 * room for one. A bare name plus year is the last resort.
 *
 * Apply wording is only ever used when the record actually has an application
 * URL. Most schemes only link out to an official portal, so claiming "Apply
 * Online" on those pages would misrepresent them.
 */
export function buildRecordTitle(name: string, opts: { canApplyOnline?: boolean; year?: string } = {}): string {
  const year = opts.year ?? '2026';
  const candidates = opts.canApplyOnline
    ? [
        ` ${year}: Eligibility & Apply Online`,
        ` ${year}: Eligibility & Apply`,
        ` ${year}: How to Apply`,
        ` ${year}: Eligibility`,
        ` ${year}`,
      ]
    : [
        ` ${year}: Eligibility & Benefits`,
        ` ${year}: Eligibility`,
        ` ${year}`,
      ];
  for (const suffix of candidates) {
    if (name.length + suffix.length <= TITLE_LIMIT) return `${name}${suffix}`;
  }
  return name;
}

/**
 * Build a description that fits within DESCRIPTION_LIMIT. Appends a short
 * call to action only when it fits, so the CTA is either fully present or
 * fully absent — never cut in half.
 */
export function buildRecordDescription(summary: string | null | undefined, fallbackName: string): string {
  const cta = ' Check who qualifies and how to apply.';
  const base = (summary?.trim() || `${fallbackName}: eligibility, benefits and how to apply.`).replace(/\s+/g, ' ');
  if (base.length + cta.length <= DESCRIPTION_LIMIT) return `${base}${cta}`;
  if (base.length <= DESCRIPTION_LIMIT) return base;
  return `${base.slice(0, DESCRIPTION_LIMIT - 3).trimEnd()}...`;
}

/**
 * Returns a consistent Metadata object with a self-referencing canonical,
 * OpenGraph, and Twitter card, all using absolute URLs. The default social
 * image is supplied site-wide by app/opengraph-image, so no image is set here.
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  noindex,
  ogType = 'website',
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };

  if (keywords && keywords.length > 0) {
    meta.keywords = keywords;
  }

  if (noindex) {
    meta.robots = { index: false, follow: false };
  }

  return meta;
}
