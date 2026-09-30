declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      params?: Record<string, string | number | boolean>
    ) => void;
    dataLayer: Array<Record<string, unknown>>;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-MT7980F7JH';

/**
 * The gtag script loads lazily, after the page is interactive, so tool pages can
 * fire events before it exists. This installs the standard queue stub: calls made
 * early go into dataLayer and are sent once the script arrives.
 */
function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function queued() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments as unknown as Record<string, unknown>);
    } as Window['gtag'];
  }
  (window.gtag as (...a: unknown[]) => void)(...args);
}

export function trackPageView(url: string): void {
  if (typeof window === 'undefined' || !GA_ID) {
    return;
  }
  try {
    gtag('config', GA_ID, {
      page_path: url,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined' || !GA_ID) {
    return;
  }
  try {
    gtag('event', eventName, params ?? {});
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

export function trackSchemeSearch(query: string, resultCount: number): void {
  trackEvent('scheme_search', {
    search_query: query,
    result_count: resultCount,
  });
}

export function trackCalculatorUse(calculatorType: string): void {
  trackEvent('calculator_use', {
    calculator_type: calculatorType,
  });
}

export function trackPremiumSignup(plan: string): void {
  trackEvent('premium_signup', {
    plan_type: plan,
  });
}

export function trackPriceCheck(priceType: string, city: string): void {
  trackEvent('price_check', {
    price_type: priceType,
    city: city,
  });
}

export default {
  trackPageView,
  trackEvent,
  trackSchemeSearch,
  trackCalculatorUse,
  trackPremiumSignup,
  trackPriceCheck,
};