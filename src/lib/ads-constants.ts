// Client-safe ad constants (no server/db imports). Shared by the admin UI and the server lib.

/** Ad slot keys the site renders and the admin can target. */
export const AD_PLACEMENTS = [
  { value: 'home-top', label: 'Home - top banner' },
  { value: 'home-mid', label: 'Home - middle banner' },
  { value: 'article-inline', label: 'Article - in content' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'footer', label: 'Footer banner' },
  { value: 'prices-top', label: 'Price pages - top' },
  { value: 'schemes-top', label: 'Schemes and Scholarships - top' },
] as const;

export const AD_TYPES = ['image', 'video', 'html'] as const;
export type AdType = (typeof AD_TYPES)[number];
