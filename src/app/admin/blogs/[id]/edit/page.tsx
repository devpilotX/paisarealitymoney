'use client';

import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';

const CATEGORIES = [
  'finance',
  'gold',
  'silver',
  'fuel',
  'schemes',
  'tax',
  'investment',
  'insurance',
  'banking',
  'budgeting',
];

interface BlogPostResponse {
  post?: {
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    coverImage: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    isPublished: boolean;
    slug: string;
    sources: Array<{ title: string; url: string }>;
  };
  error?: string;
}

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sources, setSources] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('finance');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/blogs/${id}`)
      .then((response) => response.json() as Promise<BlogPostResponse>)
      .then((data) => {
        if (data.post) {
          setTitle(data.post.title);
          setSlug(data.post.slug);
          setSources((data.post.sources || []).map((s) => `${s.title} | ${s.url}`).join('\n'));
          setDescription(data.post.description);
          setCoverImage(data.post.coverImage || '');
          setContent(data.post.content);
          setCategory(data.post.category);
          setTags((data.post.tags || []).join(', '));
          setMetaTitle(data.post.metaTitle || '');
          setMetaDescription(data.post.metaDescription || '');
          setIsPublished(data.post.isPublished);
        } else {
          setError(data.error || 'Failed to load post');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load post');
        setLoading(false);
      });
  }, [id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          sources: sources
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const i = line.lastIndexOf('|');
              return i === -1 ? { title: '', url: line } : { title: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
            }),
          description,
          content,
          category,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          coverImage: coverImage || null,
          metaTitle,
          metaDescription,
          isPublished,
        }),
      });

      if (res.ok) {
        router.push('/admin');
        return;
      }

      const data = (await res.json()) as { error?: string };
      setError(data.error || 'Failed to update post');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }, [
    category,
    content,
    coverImage,
    description,
    id,
    isPublished,
    metaDescription,
    metaTitle,
    router,
    slug,
    sources,
    tags,
    title,
  ]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="post-slug" className="block text-sm font-medium mb-2">URL slug</label>
            <input
              id="post-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              className="input-field font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              paisareality.com/newsletter/{slug}. Editing the title keeps this URL. Change it only if you must: the old link stops working.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="input-field h-20"
            />
          </div>

          <ImageUploadField
            label="Cover image (thumbnail)"
            value={coverImage}
            onChange={setCoverImage}
            placeholder="https://.../cover.jpg"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input-field"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content (Markdown)</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="input-field h-96 font-mono text-sm"
            />
          </div>

          <div>
            <label htmlFor="post-sources" className="block text-sm font-medium mb-2">Sources (one per line: Title | https://url)</label>
            <textarea
              id="post-sources"
              value={sources}
              onChange={(event) => setSources(event.target.value)}
              className="input-field h-28 font-mono text-xs"
              placeholder="RBI press release | https://www.rbi.org.in/..."
            />
          </div>

          <details className="border rounded-lg p-4">
            <summary className="font-medium cursor-pointer">SEO Settings</summary>
            <div className="mt-4 space-y-4">
              <input
                value={metaTitle}
                onChange={(event) => setMetaTitle(event.target.value)}
                className="input-field"
                placeholder="Meta title"
                maxLength={70}
              />
              <textarea
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                className="input-field h-20"
                placeholder="Meta description"
                maxLength={160}
              />
            </div>
          </details>

          <div className="flex flex-col gap-4 pt-4 border-t sm:flex-row sm:items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-medium">Published</span>
            </label>
            <div className="flex-1" />
            <button onClick={() => router.push('/admin')} className="btn-secondary">
              Cancel
            </button>
            <button onClick={() => void handleSave()} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Update Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
