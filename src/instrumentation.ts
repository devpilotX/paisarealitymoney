/**
 * Runs once when the server boots. Its only job is to make a silently broken
 * revenue configuration impossible to miss: the site ran for two months with
 * AdSense and Razorpay both inert and nothing in any log said so.
 *
 * Keep this cheap and never let it throw. A diagnostic must not be able to take
 * the site down.
 */
export async function register(): Promise<void> {
  // Next registers instrumentation for each runtime it builds, so without this
  // guard the report prints twice on every boot.
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }
  try {
    const { monetizationStatus, formatMonetizationReport } = await import('@/lib/monetization');
    const status = monetizationStatus({
      NEXT_PUBLIC_ADSENSE_PUB_ID: process.env.NEXT_PUBLIC_ADSENSE_PUB_ID,
      NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT: process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT,
      NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT: process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    });
    const report = formatMonetizationReport(status);
    // Always stdout, never stderr. pm2 sends stderr to paisareality-error.log,
    // which is the file used to answer "did this deploy break anything". A
    // configuration notice does not belong in it. The severity is in the text,
    // so `pm2 logs paisareality | grep monetization` still shows everything.
    console.log(report);
  } catch {
    // Never block startup on a diagnostic.
  }
}
