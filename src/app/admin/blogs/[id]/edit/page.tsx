'use client';

import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';

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
    metaTitle: string | null;
    metaDescription: string | null;
    isPublished: boolean;
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
  const [description, setDescription] = useState('');
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
          setDescription(data.post.description);
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
          description,
          content,
          category,
          tags: tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
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
    description,
    id,
    isPublished,
    metaDescription,
    metaTitle,
    router,
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
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="input-field h-20"
            />
          </div>

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
