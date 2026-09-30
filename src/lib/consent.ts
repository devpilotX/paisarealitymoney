/**
 * Google Consent Mode. Runs before Analytics and AdSense load, so the visitor's
 * saved choice applies from the first request. "declined" turns off analytics
 * storage and ad personalisation; ads then serve without personal data. Visitors
 * who have not chosen yet get the defaults the banner describes.
 */
export const CONSENT_KEY = 'paisa-reality-cookie-consent';

export const CONSENT_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
var c = null;
try { c = localStorage.getItem('${CONSENT_KEY}'); } catch (e) {}
var off = c === 'declined';
gtag('consent', 'default', {
  analytics_storage: off ? 'denied' : 'granted',
  ad_storage: off ? 'denied' : 'granted',
  ad_user_data: off ? 'denied' : 'granted',
  ad_personalization: off ? 'denied' : 'granted',
  wait_for_update: 300
});
`;

export function applyConsent(choice: 'accepted' | 'declined'): void {
  if (typeof window === 'undefined') return;
  const v = choice === 'accepted' ? 'granted' : 'denied';
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  const g = w.gtag ?? function (...args: unknown[]) { w.dataLayer!.push(args); };
  g('consent', 'update', { analytics_storage: v, ad_storage: v, ad_user_data: v, ad_personalization: v });
}
