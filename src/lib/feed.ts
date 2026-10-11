/**
 * RSS 2.0 and Google News sitemap builders. Pure functions so they are unit
 * tested without a database; the routes in src/app feed them published posts.
 */

export interface FeedItem {
  slug: string;
  title: string;
  description: string;
  /** ISO timestamp of publication. */
  date: string;
  category?: string;
}

/** Escape the five XML special characters and drop characters XML 1.0 forbids. */
export function xmlEscape(s: string): string {
  return s
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const validDate = (iso: string): Date | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function buildRss(opts: { siteUrl: string; title: string; description: string; items: FeedItem[]; now?: Date }): string {
  const { siteUrl, title, description } = opts;
  const items = opts.items.filter((i) => validDate(i.date));
  const newest = items[0] ? validDate(items[0].date)! : (opts.now ?? new Date());
  const body = items.map((i) => {
    const url = `${siteUrl}/newsletter/${encodeURIComponent(i.slug)}`;
    return [
      '    <item>',
      `      <title>${xmlEscape(i.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${validDate(i.date)!.toUTCString()}</pubDate>`,
      i.category ? `      <category>${xmlEscape(i.category)}</category>` : '',
      `      <description>${xmlEscape(i.description)}</description>`,
      '    </item>',
    ].filter(Boolean).join('\n');
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${siteUrl}/newsletter</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${xmlEscape(description)}</description>
    <language>en-IN</language>
    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>
${body}
  </channel>
</rss>
`;
}

/** Google News only reads articles published in the last two days. */
export const NEWS_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export function buildNewsSitemap(opts: { siteUrl: string; publication: string; items: FeedItem[]; now?: Date }): string {
  const now = (opts.now ?? new Date()).getTime();
  const fresh = opts.items.filter((i) => {
    const d = validDate(i.date);
    return d !== null && now - d.getTime() <= NEWS_WINDOW_MS && d.getTime() <= now + 60_000;
  });
  const urls = fresh.map((i) => `  <url>
    <loc>${opts.siteUrl}/newsletter/${encodeURIComponent(i.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(opts.publication)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${validDate(i.date)!.toISOString()}</news:publication_date>
      <news:title>${xmlEscape(i.title)}</news:title>
    </news:news>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;
}
