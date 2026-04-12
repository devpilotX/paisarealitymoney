import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  coverImage: string | null;
  author: string;
  readTime: string;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogRow extends RowDataPacket {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string | string[] | null;
  cover_image: string | null;
  author: string;
  read_time: string;
  is_published: boolean | number;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

let blogTableAvailable: boolean | null = null;

async function hasBlogTable(): Promise<boolean> {
  if (blogTableAvailable !== null) {
    return blogTableAvailable;
  }

  const rows = await query<(RowDataPacket & { count: number })[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'blog_posts'`
  );
  blogTableAvailable = (rows[0]?.count ?? 0) > 0;
  return blogTableAvailable;
}

function toDateString(value: string | Date | null): string {
  if (!value) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function parseTags(tags: BlogRow['tags']): string[] {
  if (!tags) {
    return [];
  }
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string');
  }
  try {
    const parsed = JSON.parse(tags) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    return [];
  }
}

function rowToPost(row: BlogRow): BlogPost {
  const createdAt = toDateString(row.created_at);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    category: row.category,
    tags: parseTags(row.tags),
    coverImage: row.cover_image,
    author: row.author,
    readTime: row.read_time,
    isPublished: Boolean(row.is_published),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    date: toDateString(row.published_at) || createdAt,
    createdAt,
    updatedAt: toDateString(row.updated_at),
  };
}

export function getAllPosts(): BlogPost[] {
  return [];
}

export function getPostBySlug(_slug: string): BlogPost | null {
  return null;
}

export async function getAllPostsAsync(onlyPublished = true): Promise<BlogPost[]> {
  if (!(await hasBlogTable())) {
    return [];
  }

  const where = onlyPublished ? 'WHERE is_published = TRUE' : '';
  const rows = await query<BlogRow[]>(
    `SELECT * FROM blog_posts ${where} ORDER BY published_at DESC, created_at DESC`
  );
  return rows.map(rowToPost);
}

export async function getPostBySlugAsync(slug: string): Promise<BlogPost | null> {
  if (!(await hasBlogTable())) {
    return null;
  }

  const rows = await query<BlogRow[]>(
    'SELECT * FROM blog_posts WHERE slug = ? AND is_published = TRUE LIMIT 1',
    [slug]
  );
  return rows[0] ? rowToPost(rows[0]) : null;
}

export async function getPostByIdAsync(id: number): Promise<BlogPost | null> {
  if (!(await hasBlogTable())) {
    return null;
  }

  const rows = await query<BlogRow[]>('SELECT * FROM blog_posts WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? rowToPost(rows[0]) : null;
}

export function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export async function generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
  blogTableAvailable = true;
  const baseSlug = generateSlug(title) || 'post';
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const params = excludeId ? [slug, excludeId] : [slug];
    const rows = await query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) AS count FROM blog_posts WHERE slug = ?${excludeId ? ' AND id <> ?' : ''}`,
      params
    );
    if ((rows[0]?.count ?? 0) === 0) {
      return slug;
    }
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}
