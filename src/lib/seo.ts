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
  /** Page title without the brand suffix. The root layout appends " | Paisa Reality". */
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
