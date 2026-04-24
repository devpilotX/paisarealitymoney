import type { MetadataRoute } from 'next';
import { CITIES } from '@/lib/cities';
import { ALL_INDIAN_STATES } from '@/lib/cities';
import { SCHEME_CATEGORIES } from '@/lib/constants';
import { query } from '@/lib/db';
import { getAllPostsAsync } from '@/lib/blog';
import { RowDataPacket } from 'mysql2/promise';

const BASE_URL = 'https://paisareality.com';

interface SchemeSitemapRow extends RowDataPacket {
  slug: string;
  updated_at: string | Date | null;
}

function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toIsoDate(value: string | Date | null, fallback: string): string {
  if (!value) return fallback;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/gold-rate`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/silver-rate`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/petrol-price`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/diesel-price`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/lpg-price`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/schemes`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/calculators`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/calculators/emi`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/sip`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/fd`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/ppf`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/income-tax`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/home-loan`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/nps`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/gratuity`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/hra`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/calculators/inflation`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/bank-rates`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/bank-rates/fd-rates`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/bank-rates/savings-rates`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/bank-rates/home-loan-rates`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/bank-rates/personal-loan-rates`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const goldCityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/gold-rate/${city.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const silverCityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/silver-rate/${city.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const petrolCityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/petrol-price/${city.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const dieselCityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/diesel-price/${city.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = SCHEME_CATEGORIES.map((category) => ({
    url: `${BASE_URL}/category/${category.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const statePages: MetadataRoute.Sitemap = ALL_INDIAN_STATES.map((state) => ({
    url: `${BASE_URL}/state/${stateNameToSlug(state)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const schemePages = await query<SchemeSitemapRow[]>(
    'SELECT slug, updated_at FROM schemes WHERE is_active = TRUE ORDER BY updated_at DESC'
  ).then((rows) => rows.map((scheme) => ({
    url: `${BASE_URL}/schemes/${scheme.slug}`,
    lastModified: toIsoDate(scheme.updated_at, now),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))).catch(() => [] as MetadataRoute.Sitemap);

  const blogPages = await getAllPostsAsync(true)
    .then((posts) => posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.date || now,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    })))
    .catch(() => [] as MetadataRoute.Sitemap);

  return [
    ...staticPages,
    ...categoryPages,
    ...statePages,
    ...schemePages,
    ...blogPages,
    ...goldCityPages,
    ...silverCityPages,
    ...petrolCityPages,
    ...dieselCityPages,
  ];
}
