import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import { estimateReadTime, generateUniqueSlug, getPostByIdAsync } from '@/lib/blog';

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const post = await getPostByIdAsync(Number.parseInt(id, 10));
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, post });
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const postId = Number.parseInt(id, 10);
    const body = (await request.json()) as {
      title?: string; description?: string; content?: string; category?: string;
      tags?: string[]; coverImage?: string | null; metaTitle?: string; metaDescription?: string; isPublished?: boolean;
    };

    const existing = await getPostByIdAsync(postId);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const title = body.title ?? existing.title;
    const description = body.description ?? existing.description;
    const content = body.content ?? existing.content;
    const slug = body.title ? await generateUniqueSlug(body.title, postId) : existing.slug;
    const readTime = body.content ? estimateReadTime(body.content) : existing.readTime;
    const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished;
    const publishedAt = isPublished && !existing.isPublished
      ? new Date().toISOString()
      : existing.date || null;

    await execute(
      `UPDATE blog_posts SET slug=$1, title=$2, description=$3, content=$4, category=$5, tags=$6, cover_image=$7, read_time=$8, is_published=$9, meta_title=$10, meta_description=$11, published_at=$12 WHERE id=$13`,
      [
        slug, title, description, content,
        body.category ?? existing.category, JSON.stringify(body.tags ?? existing.tags),
        body.coverImage ?? existing.coverImage, readTime, isPublished,
        body.metaTitle ?? existing.metaTitle ?? title.slice(0, 70),
        body.metaDescription ?? existing.metaDescription ?? description.slice(0, 160),
        publishedAt, postId,
      ]
    );

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await execute('DELETE FROM blog_posts WHERE id = $1', [Number.parseInt(id, 10)]);
  return NextResponse.json({ success: true });
}
