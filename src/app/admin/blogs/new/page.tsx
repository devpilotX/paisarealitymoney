'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

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

export default function NewBlogPage(): React.ReactElement {
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
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    if (!title || !content || !description) {
      setError('Title, description, and content are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST',
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
          metaTitle: metaTitle || title.slice(0, 70),
          metaDescription: metaDescription || description.slice(0, 160),
          isPublished,
        }),
      });

      if (res.ok) {
        router.push('/admin');
        return;
      }

      const data = (await res.json()) as { error?: string };
      setError(data.error || 'Failed to save');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }, [category, content, description, isPublished, metaDescription, metaTitle, router, tags, title]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">New Blog Post</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="input-field"
              placeholder="Gold Price Forecast 2026: Expert Analysis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="input-field h-20"
              placeholder="Brief summary for listing pages and SEO"
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
                placeholder="gold, investment, 2026"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content (Markdown) *</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="input-field h-96 font-mono text-sm"
              placeholder={'Write your blog post in Markdown...\n\n## Heading\n\nParagraph text here'}
            />
          </div>

          <details className="border rounded-lg p-4">
            <summary className="font-medium cursor-pointer">SEO Settings</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Meta Title</label>
                <input
                  value={metaTitle}
                  onChange={(event) => setMetaTitle(event.target.value)}
                  className="input-field"
                  maxLength={70}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(event) => setMetaDescription(event.target.value)}
                  className="input-field h-20"
                  maxLength={160}
                />
              </div>
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
              <span className="font-medium">Publish immediately</span>
            </label>
            <div className="flex-1" />
            <button onClick={() => router.push('/admin')} className="btn-secondary">
              Cancel
            </button>
            <button onClick={() => void handleSave()} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
