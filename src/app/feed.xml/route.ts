/**
 * /feed.xml: RSS 2.0 feed of published newsletter articles, newest 30.
 * Lets feed readers, Google Discover and aggregators pick up each daily
 * article without waiting for a crawl.
 */
import { getAllPostsAsync } from '@/lib/blog';
import { buildRss } from '@/lib/feed';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const revalidate = 900;

export async function GET(): Promise<Response> {
  const posts = await getAllPostsAsync(true).catch(() => []);
  const xml = buildRss({
    siteUrl: SITE_URL,
    title: `${SITE_NAME} newsletter`,
    description: 'A new money story for Indian families every morning, every fact checked against the official source.',
    items: posts.slice(0, 30).map((p) => ({ slug: p.slug, title: p.title, description: p.description, date: p.date, category: p.category })),
  });
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
}
