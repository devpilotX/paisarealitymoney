import fs from 'fs';
import path from 'path';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { meta: {}, content: raw };
  const meta: Record<string, string> = {};
  for (const line of (fmMatch[1]?.split('\n') ?? [])) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, content: fmMatch[2] ?? '' };
}

export function getAllPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(CONTENT_DIR)) return [];
    const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
    return files.map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
      const { meta, content } = parseFrontmatter(raw);
      return {
        slug: file.replace('.md', ''), title: meta.title ?? 'Untitled',
        description: meta.description ?? '', date: meta.date ?? '2026-04-01',
        author: meta.author ?? 'Paisa Reality', category: meta.category ?? 'finance',
        readTime: meta.readTime ?? '5 min read', content,
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch { return []; }
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}