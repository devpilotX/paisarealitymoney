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

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

export function trackPageView(url: string): void {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }
  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
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
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }
  try {
    window.gtag('event', eventName, params ?? {});
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