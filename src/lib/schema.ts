import { SITE_URL, SITE_NAME, absoluteUrl } from '@/lib/seo';

/**
 * Reusable JSON-LD (schema.org) builders for rich results in Google.
 *
 * Each helper returns a plain object. Render it with:
 *   <script type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
 * or via next/script with the same inner HTML.
 *
 * Keep schema TRUTHFUL: never invent ratings, review counts, or prices.
 * Google penalises structured-data that does not match visible page content.
 */

type Json = Record<string, unknown>;

/** SoftwareApplication / WebApplication schema for a free calculator tool. */
export function calculatorSchema(input: {
  name: string;
  path: string;
  description: string;
  /** Short bullet features shown to users, e.g. ['Old vs new regime', 'FY 2026-27']. */
  featureList?: string[];
}): Json {
  const schema: Json = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    inLanguage: 'en-IN',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  if (input.featureList && input.featureList.length > 0) {
    schema.featureList = input.featureList;
  }
  return schema;
}

/** HowTo schema: helps a tool/guide qualify for "How to" rich results. */
export function howToSchema(input: {
  name: string;
  description: string;
  path: string;
  steps: Array<{ name: string; text: string }>;
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    step: input.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/** FAQPage schema. (The FAQ component already emits this; use when rendering FAQs server-side.) */
export function faqSchema(items: Array<{ question: string; answer: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** BreadcrumbList schema. Home is prepended automatically. */
export function breadcrumbSchema(items: Array<{ label: string; href?: string }>): Json {
  const itemListElement: Json[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    ...items.map((item, index) => {
      const entry: Json = { '@type': 'ListItem', position: index + 2, name: item.label };
      if (item.href) entry.item = absoluteUrl(item.href);
      return entry;
    }),
  ];
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement };
}

/** Article / NewsArticle schema for blog & newsletter posts. */
export function articleSchema(input: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
}): Json {
  const schema: Json = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(input.path) },
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/paisa_reality_logo.png` },
    },
    inLanguage: 'en-IN',
  };
  if (input.datePublished) schema.datePublished = input.datePublished;
  if (input.dateModified) schema.dateModified = input.dateModified;
  if (input.image) schema.image = input.image.startsWith('http') ? input.image : `${SITE_URL}${input.image}`;
  return schema;
}

/** FinancialProduct schema for bank-rate / deposit / loan comparison pages. */
export function financialProductSchema(input: {
  name: string;
  description: string;
  path: string;
  category?: string;
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    category: input.category ?? 'Banking',
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'Country', name: 'India' },
  };
}

/** Dataset schema for live-rate pages (gold, silver, petrol, diesel, LPG). */
export function datasetSchema(input: {
  name: string;
  description: string;
  path: string;
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    creator: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    spatialCoverage: { '@type': 'Place', name: 'India' },
    isAccessibleForFree: true,
  };
}


/** MonetaryGrant schema for a scholarship / financial-aid listing. Keep truthful. */
export function scholarshipSchema(input: {
  name: string;
  description: string;
  path: string;
  provider?: string | null;
  amount?: number | null;
  officialUrl?: string | null;
}): Json {
  const schema: Json = {
    '@context': 'https://schema.org',
    '@type': 'MonetaryGrant',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    funder: {
      '@type': 'Organization',
      name: input.provider || SITE_NAME,
    },
    areaServed: { '@type': 'Country', name: 'India' },
    inLanguage: 'en-IN',
  };
  if (input.amount != null && input.amount > 0) {
    schema.amount = { '@type': 'MonetaryAmount', currency: 'INR', value: input.amount };
  }
  if (input.officialUrl) schema.sameAs = input.officialUrl;
  return schema;
}
