// Client-safe ad constants and validation (no server/db imports). Shared by the admin UI,
// the admin API and tests.

/** Ad slot keys the site actually renders (each one is wired to <AdSlot placement=...>). */
export const AD_PLACEMENTS = [
  { value: 'home-top', label: 'Home page - top banner' },
  { value: 'home-mid', label: 'Home page - middle banner' },
  { value: 'article-inline', label: 'Articles - below the article' },
  { value: 'prices-top', label: 'Gold, silver, fuel, LPG, bank and interest rate pages' },
  { value: 'schemes-top', label: 'Scheme and scholarship pages' },
  { value: 'calculators-top', label: 'Calculator and smart tool pages' },
  { value: 'guides-top', label: 'Guide pages' },
] as const;

export const AD_TYPES = ['image', 'video', 'html'] as const;
export type AdType = (typeof AD_TYPES)[number];

export interface AdFields {
  name: string;
  placement: string;
  type: AdType;
  imageUrl: string | null;
  videoUrl: string | null;
  html: string | null;
  linkUrl: string | null;
  altText: string | null;
  active: boolean;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
}

export type AdValidation = { ok: true; value: AdFields } | { ok: false; error: string };

function text(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/** https URL, or a site-relative path for media hosted on paisareality.com. */
function mediaUrl(v: string | null, allowRelative: boolean): boolean {
  if (!v) return true;
  if (allowRelative && /^\/[^/\\]/.test(v)) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

function instant(v: unknown): string | null | undefined {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v !== 'string') return undefined;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
}

/** Validates an admin ad form. Pure, so the same rules run in the API and the tests. */
export function validateAd(b: Record<string, unknown>): AdValidation {
  const name = text(b.name, 120);
  if (!name) return { ok: false, error: 'Give the ad a name.' };
  const placement = text(b.placement, 40);
  if (!placement || !AD_PLACEMENTS.some((p) => p.value === placement)) return { ok: false, error: 'Choose a placement from the list.' };
  const type = (AD_TYPES as readonly string[]).includes(String(b.type)) ? (b.type as AdType) : null;
  if (!type) return { ok: false, error: 'Type must be image, video or html.' };

  const imageUrl = text(b.imageUrl, 1000);
  const videoUrl = text(b.videoUrl, 1000);
  const html = text(b.html, 20000);
  const linkUrl = text(b.linkUrl, 1000);
  const altText = text(b.altText, 200);

  if (type === 'image' && !imageUrl) return { ok: false, error: 'An image ad needs an image URL.' };
  if (type === 'video' && !videoUrl) return { ok: false, error: 'A video ad needs a video URL.' };
  if (type === 'html' && !html) return { ok: false, error: 'An HTML ad needs its HTML.' };
  if (!mediaUrl(imageUrl, true)) return { ok: false, error: 'Image URL must start with https:// (or / for a file on this site).' };
  if (!mediaUrl(videoUrl, true)) return { ok: false, error: 'Video URL must start with https:// (or / for a file on this site).' };
  if (!mediaUrl(linkUrl, false)) return { ok: false, error: 'Click-through URL must be a full https:// address.' };
  if (type !== 'html' && !altText) return { ok: false, error: 'Add alt text: it describes the ad for screen readers.' };

  const priority = Number(b.priority ?? 0);
  if (!Number.isInteger(priority) || priority < -100 || priority > 100) return { ok: false, error: 'Priority must be a whole number from -100 to 100.' };

  const startsAt = instant(b.startsAt);
  const endsAt = instant(b.endsAt);
  if (startsAt === undefined || endsAt === undefined) return { ok: false, error: 'Start and end must be valid dates.' };
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) return { ok: false, error: 'The end must be after the start.' };

  return {
    ok: true,
    value: {
      name, placement, type,
      imageUrl: type === 'image' ? imageUrl : null,
      videoUrl: type === 'video' ? videoUrl : null,
      html: type === 'html' ? html : null,
      linkUrl, altText,
      active: b.active === undefined ? true : Boolean(b.active),
      priority, startsAt, endsAt,
    },
  };
}

export type AdState = 'live' | 'scheduled' | 'expired' | 'off';

/** What a visitor sees right now for this creative's schedule. */
export function adState(a: { active: boolean; startsAt: string | null; endsAt: string | null }, now = Date.now()): AdState {
  if (!a.active) return 'off';
  const parse = (v: string | null): number | null => {
    if (!v) return null;
    const t = Date.parse(v.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'));
    return Number.isFinite(t) ? t : null;
  };
  const s = parse(a.startsAt);
  const e = parse(a.endsAt);
  if (s !== null && s > now) return 'scheduled';
  if (e !== null && e < now) return 'expired';
  return 'live';
}
