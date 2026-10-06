/** Article thumbnails: the editor's cover image, or the site's own generated card. */
export const CATEGORY_LABELS: Record<string, string> = {
  finance: 'Personal finance', gold: 'Gold', silver: 'Silver', fuel: 'Fuel prices', schemes: 'Government schemes',
  tax: 'Tax', investment: 'Investing', insurance: 'Insurance', banking: 'Banking', budgeting: 'Budgeting',
};

/** Background gradient and the mark drawn on each category's generated card (ASCII only: the card font has no emoji). */
export const CATEGORY_STYLE: Record<string, { from: string; to: string; mark: string }> = {
  finance: { from: '#0c4a47', to: '#1C3A5E', mark: 'Rs' },
  gold: { from: '#7a4b00', to: '#c08a1e', mark: 'Au' },
  silver: { from: '#3b4452', to: '#7d8796', mark: 'Ag' },
  fuel: { from: '#6b1d1d', to: '#b4442e', mark: 'L' },
  schemes: { from: '#14532d', to: '#2f7d4a', mark: 'Gov' },
  tax: { from: '#312e81', to: '#5b4fc7', mark: '%' },
  investment: { from: '#0f3d5e', to: '#1f7a8c', mark: 'SIP' },
  insurance: { from: '#3f1d5e', to: '#7a3e9d', mark: 'Ins' },
  banking: { from: '#0b2a4a', to: '#1d5c8f', mark: 'Rs' },
  budgeting: { from: '#4a3b0b', to: '#8a6d1d', mark: '=' },
};

export function articleImage(post: { slug: string; coverImage: string | null }): string {
  return post.coverImage || `/newsletter/${post.slug}/opengraph-image`;
}

/** Absolute form, for schema.org and feeds. */
export function articleImageUrl(post: { slug: string; coverImage: string | null }): string {
  const src = articleImage(post);
  return src.startsWith('/') ? `https://paisareality.com${src}` : src;
}
