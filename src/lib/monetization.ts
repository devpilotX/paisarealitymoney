/**
 * Monetization configuration audit.
 *
 * Why this exists: on 2026-07-26 the site had been live for two months with
 * three monetization paths, all silently inert.
 *   1. NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT and _IN_ARTICLE_SLOT were empty, so
 *      AdBanner returned null on all 110 ad placements and AdSenseScript never
 *      loaded the AdSense library. Verified: zero client bundles referenced
 *      pagead2.googlesyndication.com, in the current build and both backups.
 *   2. RAZORPAY_KEY_ID was a rzp_test_ key, so premium could never take money.
 *   3. ad_creatives had zero rows, so the self-hosted ad manager served nothing.
 *
 * None of that produced a single log line or warning anywhere. This module
 * turns that class of failure into something loud: it is reported at startup by
 * instrumentation.ts and is covered by tests/monetization.test.ts.
 *
 * Pure and dependency-free on purpose, so it can run at startup and in tests.
 */

export type Severity = 'blocker' | 'warning' | 'ok';
export type Area = 'adsense' | 'razorpay' | 'house-ads';

export interface MonetizationIssue {
  area: Area;
  severity: Severity;
  message: string;
  /** The concrete action that resolves it. Empty when nothing is wrong. */
  fix: string;
}

export interface MonetizationEnv {
  NEXT_PUBLIC_ADSENSE_PUB_ID?: string;
  NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT?: string;
  NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  NODE_ENV?: string;
}

export interface MonetizationStatus {
  adsense: {
    /** True when the AdSense library will be loaded at all. */
    libraryLoads: boolean;
    /** True when manual <ins> ad units can render. Needs at least one slot id. */
    manualUnitsWork: boolean;
    pubIdSet: boolean;
    slotsSet: number;
  };
  razorpay: {
    configured: boolean;
    /** 'live', 'test' or 'unknown'. A test key cannot collect real money. */
    mode: 'live' | 'test' | 'unknown';
  };
  issues: MonetizationIssue[];
  /** True when at least one path can actually earn. */
  canEarn: boolean;
}

const has = (value: string | undefined): boolean => Boolean(value && value.trim().length > 0);

export function monetizationStatus(env: MonetizationEnv): MonetizationStatus {
  const pubIdSet = has(env.NEXT_PUBLIC_ADSENSE_PUB_ID);
  const slots = [env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT, env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT].filter(has);
  const razorpayKey = (env.RAZORPAY_KEY_ID ?? '').trim();
  const razorpayConfigured = has(razorpayKey) && has(env.RAZORPAY_KEY_SECRET);
  const mode: 'live' | 'test' | 'unknown' = razorpayKey.startsWith('rzp_live_')
    ? 'live'
    : razorpayKey.startsWith('rzp_test_')
      ? 'test'
      : 'unknown';

  const issues: MonetizationIssue[] = [];

  if (!pubIdSet) {
    issues.push({
      area: 'adsense',
      severity: 'blocker',
      message: 'No AdSense publisher id, so no ad can ever render.',
      fix: 'Set NEXT_PUBLIC_ADSENSE_PUB_ID to the numeric part of your ca-pub id and rebuild.',
    });
  } else if (slots.length === 0) {
    issues.push({
      area: 'adsense',
      severity: 'warning',
      message:
        'Publisher id is set but no ad unit slot ids are, so every AdBanner placement renders nothing. Auto ads still work because the library now loads on the publisher id alone.',
      fix: 'Either turn on Auto ads in the AdSense dashboard, or create ad units there and put their slot ids in NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT and NEXT_PUBLIC_ADSENSE_IN_ARTICLE_SLOT, then rebuild. These are build-time values.',
    });
  }

  if (!razorpayConfigured) {
    issues.push({
      area: 'razorpay',
      severity: 'warning',
      message: 'Razorpay is not fully configured, so the premium plan cannot be sold.',
      fix: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
    });
  } else if (mode === 'test') {
    issues.push({
      area: 'razorpay',
      severity: 'blocker',
      message: 'Razorpay is using a test key, so checkout takes no real money.',
      fix: 'Replace RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET with live keys from an activated Razorpay account, then restart.',
    });
  }

  const libraryLoads = pubIdSet;
  const manualUnitsWork = pubIdSet && slots.length > 0;

  return {
    adsense: { libraryLoads, manualUnitsWork, pubIdSet, slotsSet: slots.length },
    razorpay: { configured: razorpayConfigured, mode },
    issues,
    canEarn: libraryLoads || (razorpayConfigured && mode === 'live'),
  };
}

/** A short multi-line report, suitable for a server log at startup. */
export function formatMonetizationReport(status: MonetizationStatus): string {
  const lines: string[] = [];
  lines.push(
    `[monetization] adsense: library ${status.adsense.libraryLoads ? 'loads' : 'DISABLED'}, ` +
      `manual units ${status.adsense.manualUnitsWork ? 'active' : 'inactive'} (${status.adsense.slotsSet} slot ids), ` +
      `razorpay: ${status.razorpay.configured ? status.razorpay.mode : 'not configured'}`,
  );
  for (const issue of status.issues) {
    lines.push(`[monetization] ${issue.severity.toUpperCase()} ${issue.area}: ${issue.message}`);
    lines.push(`[monetization]   fix: ${issue.fix}`);
  }
  if (status.issues.length === 0) {
    lines.push('[monetization] no configuration problems found.');
  }
  return lines.join('\n');
}
