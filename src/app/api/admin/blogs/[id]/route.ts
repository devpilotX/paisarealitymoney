import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { execute } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
import { estimateReadTime, generateUniqueSlug, getPostByIdAsync } from '@/lib/blog';
import { parseSources } from '@/lib/article-core';
import { sanitizeSlug } from '@/lib/sanitize';

interface RouteParams { params: Promise<{ id: string }>; }

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function refresh(...slugs: string[]): void {
  revalidatePath('/newsletter');
  revalidatePath('/sitemap.xml');
  for (const s of slugs) revalidatePath(`/newsletter/${s}`);
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = parseId((await params).id);
  const post = id ? await getPostByIdAsync(id) : null;
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, post });
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const postId = parseId((await params).id);
    const existing = postId ? await getPostByIdAsync(postId) : null;
    if (!postId || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json()) as {
      title?: string; slug?: string; description?: string; content?: string; category?: string;
      tags?: string[]; coverImage?: string | null; metaTitle?: string; metaDescription?: string;
      isPublished?: boolean; sources?: unknown;
    };

    const title = (body.title ?? existing.title).trim();
    const description = (body.description ?? existing.description).trim();
    const content = body.content ?? existing.content;
    if (!title || !description || !content.trim()) {
      return NextResponse.json({ error: 'Title, description and content cannot be empty' }, { status: 400 });
    }

    // The URL stays put when the title is edited: a changed URL loses its search ranking
    // and breaks every link already shared. It changes only when the slug field itself is edited.
    let slug = existing.slug;
    if (body.slug !== undefined && body.slug.trim() !== existing.slug) {
      const wanted = sanitizeSlug(body.slug);
      if (!wanted) return NextResponse.json({ error: 'URL slug may only use lowercase letters, numbers and dashes' }, { status: 400 });
      slug = await generateUniqueSlug(wanted, postId);
    }

    const readTime = body.content !== undefined ? estimateReadTime(content) : existing.readTime;
    const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished;
    const publishedAt = isPublished && !existing.isPublished ? new Date().toISOString() : existing.date || null;
    const sources = body.sources !== undefined ? parseSources(body.sources) : existing.sources;
    const metaTitle = (body.metaTitle ?? existing.metaTitle ?? '').trim() || title.slice(0, 60);
    const metaDescription = (body.metaDescription ?? existing.metaDescription ?? '').trim() || description.slice(0, 155);

    await execute(
      `UPDATE blog_posts SET slug=$1, title=$2, description=$3, content=$4, category=$5, tags=$6, cover_image=$7,
              read_time=$8, is_published=$9, meta_title=$10, meta_description=$11, published_at=$12, sources=$13,
              updated_at=NOW()
        WHERE id=$14`,
      [
        slug, title, description, content,
        body.category ?? existing.category, JSON.stringify(body.tags ?? existing.tags),
        body.coverImage === undefined ? existing.coverImage : body.coverImage || null, readTime, isPublished,
        metaTitle.slice(0, 70), metaDescription.slice(0, 160), publishedAt, JSON.stringify(sources), postId,
      ]
    );

    refresh(slug, existing.slug);
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('post update failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = parseId((await params).id);
  const existing = id ? await getPostByIdAsync(id) : null;
  if (!id || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await execute('DELETE FROM blog_posts WHERE id = $1', [id]);
  refresh(existing.slug);
  return NextResponse.json({ success: true });
}
