// src/lib/analytics.ts

export function trackSchemeSearch(params: {
  query?: string;
  state?: string;
  category?: string;
  resultsCount?: number;
  [key: string]: unknown;
}) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] trackSchemeSearch', params);
  }

  // TODO: Replace with your real analytics provider later
  // e.g. posthog.capture('scheme_search', params);
}