/**
 * /news-sitemap.xml: Google News sitemap with the articles of the last two
 * days (the only ones Google News reads). Listed in robots.txt.
 */
import { getAllPostsAsync } from '@/lib/blog';
import { buildNewsSitemap } from '@/lib/feed';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const revalidate = 900;

export async function GET(): Promise<Response> {
  const posts = await getAllPostsAsync(true).catch(() => []);
  const xml = buildNewsSitemap({
    siteUrl: SITE_URL,
    publication: SITE_NAME,
    // The weekly price post is a data table, not news.
    items: posts.filter((p) => !p.slug.startsWith('weekly-prices-'))
      .map((p) => ({ slug: p.slug, title: p.title, description: p.description, date: p.date })),
  });
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
}
