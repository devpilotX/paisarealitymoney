import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import { estimateReadTime, generateUniqueSlug, getAllPostsAsync } from '@/lib/blog';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posts = await getAllPostsAsync(false);
  return NextResponse.json({ success: true, posts });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      content?: string;
      category?: string;
      tags?: string[];
      coverImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished?: boolean;
    };

    if (!body.title || !body.description || !body.content) {
      return NextResponse.json(
        { error: 'Title, description, and content are required' },
        { status: 400 }
      );
    }

    const slug = await generateUniqueSlug(body.title);
    const readTime = estimateReadTime(body.content);
    const publishedAt = body.isPublished
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : null;

    await execute(
      `INSERT INTO blog_posts (slug, title, description, content, category, tags, cover_image, read_time, is_published, meta_title, meta_description, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        body.title,
        body.description,
        body.content,
        body.category || 'finance',
        JSON.stringify(body.tags ?? []),
        body.coverImage || null,
        readTime,
        body.isPublished ? 1 : 0,
        body.metaTitle || body.title.slice(0, 70),
        body.metaDescription || body.description.slice(0, 160),
        publishedAt,
      ]
    );

    const rows = await query<(RowDataPacket & { id: number })[]>('SELECT LAST_INSERT_ID() AS id');
    return NextResponse.json({ success: true, id: rows[0]?.id, slug });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}
