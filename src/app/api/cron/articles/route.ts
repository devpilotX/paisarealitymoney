import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { QueryResultRow } from 'pg';
import { query, execute } from '@/lib/db';
import { secretMatches } from '@/lib/secret-compare';
import { estimateReadTime, generateUniqueSlug } from '@/lib/blog';
import { validateArticle } from '@/lib/article-core';
import { getAppUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Publishing endpoint for the n8n "Content: daily verified article" workflow.
 * Bearer CRON_SECRET only. The workflow has already researched, written, checked its
 * sources and had the draft reviewed; this route enforces the publishing rules again
 * (lengths, headings, leftovers, at least one official source) and refuses duplicates.
 *
 *   GET  -> topics published in the last 30 days, so the workflow can skip them
 *   POST -> publish one article; 400 with every problem listed, 409 on a repeat topic
 */
function authorised(request: NextRequest): boolean {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return secretMatches(bearer, process.env.CRON_SECRET);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await query<QueryResultRow & { title: string; slug: string; topic_key: string | null; published_at: string }>(
    `SELECT title, slug, topic_key, published_at::text AS published_at FROM blog_posts
      WHERE is_published AND published_at > NOW() - INTERVAL '30 days'
      ORDER BY published_at DESC LIMIT 100`,
  );
  const today = await query<QueryResultRow & { n: number }>(
    `SELECT count(*)::int AS n FROM blog_posts
      WHERE origin = 'daily-research' AND published_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'`,
  );
  return NextResponse.json({ success: true, publishedToday: today[0]?.n ?? 0, recent: rows });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, errors: ['body is not JSON'] }, { status: 400 });
  }
  const v = validateArticle(body);
  if (!v.ok) return NextResponse.json({ success: false, errors: v.errors }, { status: 400 });
  const a = v.value;

  try {
    const dup = await query<QueryResultRow & { slug: string }>(
      `SELECT slug FROM blog_posts WHERE topic_key = $1 AND published_at > NOW() - INTERVAL '30 days' LIMIT 1`,
      [a.topicKey],
    );
    if (dup[0]) {
      return NextResponse.json({ success: false, errors: [`topic already covered: /newsletter/${dup[0].slug}`] }, { status: 409 });
    }

    const slug = await generateUniqueSlug(a.title);
    const res = await execute<QueryResultRow & { id: number }>(
      `INSERT INTO blog_posts (slug, title, description, content, category, tags, author, read_time, is_published,
                               meta_title, meta_description, published_at, sources, topic_key, origin)
       VALUES ($1, $2, $3, $4, $5, $6, 'Paisa Reality', $7, TRUE, $8, $9, NOW(), $10, $11, 'daily-research')
       RETURNING id`,
      [slug, a.title, a.description, a.content, a.category, JSON.stringify(a.tags), estimateReadTime(a.content),
        a.metaTitle, a.metaDescription, JSON.stringify(a.sources), a.topicKey],
    );
    revalidatePath('/');
    revalidatePath('/newsletter');
    revalidatePath(`/newsletter/${slug}`);
    revalidatePath('/sitemap.xml');
    const url = `${getAppUrl()}/newsletter/${slug}`;
    return NextResponse.json({ success: true, id: res.rows[0]?.id, slug, url, title: a.title });
  } catch (e) {
    console.error('article publish failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ success: false, errors: ['database error while publishing'] }, { status: 500 });
  }
}
