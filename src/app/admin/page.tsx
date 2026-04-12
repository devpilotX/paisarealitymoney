'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface BlogPostSummary {
  id: number;
  slug: string;
  title: string;
  category: string;
  isPublished: boolean;
  date: string;
}

export default function AdminPage(): React.ReactElement {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    const res = await fetch('/api/admin/blogs');
    setLoading(false);

    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as { posts?: BlogPostSummary[] };
    setPosts(data.posts || []);
    return true;
  }, []);

  useEffect(() => {
    void loadPosts().then((ok) => {
      setLoggedIn(ok);
      setChecking(false);
    });
  }, [loadPosts]);

  const handleLogin = useCallback(async () => {
    setError('');
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError('Invalid credentials');
      return;
    }

    setLoggedIn(true);
    await loadPosts();
  }, [email, loadPosts, password]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm('Delete this post?')) {
        return;
      }
      await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      await loadPosts();
    },
    [loadPosts]
  );

  const triggerPriceUpdate = useCallback(async () => {
    const secret = window.prompt('Enter CRON_SECRET:');
    if (!secret) {
      return;
    }

    const res = await fetch(`/api/cron/prices?secret=${encodeURIComponent(secret)}`);
    const data = (await res.json()) as unknown;
    window.alert(JSON.stringify(data, null, 2));
  }, []);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field mb-4"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-field mb-6"
          />
          <button onClick={handleLogin} className="btn-primary w-full">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex flex-wrap gap-3">
            <button onClick={triggerPriceUpdate} className="btn-secondary text-sm">
              Update Prices
            </button>
            <Link href="/admin/blogs/new" className="btn-primary text-sm">
              New Blog Post
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Blog Posts ({posts.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No posts yet. Create your first one.
            </div>
          ) : (
            <div className="divide-y">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium">{post.title}</h3>
                    <p className="text-sm text-gray-500">
                      {post.category} - {post.isPublished ? 'Published' : 'Draft'} -{' '}
                      {new Date(post.date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/blogs/${post.id}/edit`}
                      className="text-primary text-sm hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => void handleDelete(post.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                    {post.isPublished && (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-gray-500 text-sm hover:underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
