import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import { estimateReadTime, generateUniqueSlug, getAllPostsAsync } from '@/lib/blog';
import type { QueryResultRow } from 'pg';

export async function GET(): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const posts = await getAllPostsAsync(false);
  return NextResponse.json({ success: true, posts });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as {
      title?: string; description?: string; content?: string; category?: string;
      tags?: string[]; coverImage?: string; metaTitle?: string; metaDescription?: string; isPublished?: boolean;
    };

    if (!body.title || !body.description || !body.content) {
      return NextResponse.json({ error: 'Title, description, and content are required' }, { status: 400 });
    }

    const slug = await generateUniqueSlug(body.title);
    const readTime = estimateReadTime(body.content);
    const publishedAt = body.isPublished ? new Date().toISOString() : null;

    const result = await execute<QueryResultRow & { id: number }>(
      `INSERT INTO blog_posts (slug, title, description, content, category, tags, cover_image, read_time, is_published, meta_title, meta_description, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        slug, body.title, body.description, body.content,
        body.category || 'finance', JSON.stringify(body.tags ?? []),
        body.coverImage || null, readTime, body.isPublished ?? false,
        body.metaTitle || body.title.slice(0, 70),
        body.metaDescription || body.description.slice(0, 160), publishedAt,
      ]
    );

    return NextResponse.json({ success: true, id: result.rows[0]?.id, slug });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create post' }, { status: 500 });
  }
}
