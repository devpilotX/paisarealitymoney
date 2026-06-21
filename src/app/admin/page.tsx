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

type Tab = 'overview' | 'blogs' | 'messages' | 'actions';

export default function AdminPage(): React.ReactElement {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [actionLog, setActionLog] = useState('');

  const loadPosts = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    const res = await fetch('/api/admin/blogs');
    setLoading(false);
    if (!res.ok) return false;
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
    if (!res.ok) { setError('Invalid credentials'); return; }
    setLoggedIn(true);
    await loadPosts();
  }, [email, loadPosts, password]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Delete this post?')) return;
    await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
    await loadPosts();
  }, [loadPosts]);

  const triggerPriceUpdate = useCallback(async () => {
    const secret = window.prompt('Enter CRON_SECRET:');
    if (!secret) return;
    setActionLog('Updating prices...');
    const res = await fetch(`/api/cron/prices?secret=${encodeURIComponent(secret)}`);
    const data = await res.json();
    setActionLog(res.ok ? 'Prices updated successfully.' : `Error: ${JSON.stringify(data)}`);
  }, []);

  const handleLogout = useCallback(() => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    setLoggedIn(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Paisa Reality Dashboard</p>
          </div>
          {error && <p className="text-red-600 text-sm mb-4 text-center bg-red-50 p-2 rounded">{error}</p>}
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleLogin(); }}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-sm focus:border-primary focus:outline-none"
            />
            <button onClick={() => void handleLogin()} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-800 transition-colors">
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.length - publishedCount;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'blogs', label: `Blogs (${posts.length})` },
    { id: 'messages', label: 'Messages' },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">Paisa</span>
            <span className="text-lg font-bold text-gray-900">Reality</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-primary" target="_blank">View site</Link>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Posts" value={posts.length} />
              <StatCard label="Published" value={publishedCount} />
              <StatCard label="Drafts" value={draftCount} />
              <StatCard label="Smart Tools" value={9} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Quick actions</h3>
                <div className="space-y-2">
                  <Link href="/admin/blogs/new" className="block px-4 py-3 bg-primary-50 rounded-lg text-sm font-medium text-primary hover:bg-primary-100 transition-colors">
                    + Write new blog post
                  </Link>
                  <button onClick={() => void triggerPriceUpdate()} className="block w-full text-left px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Refresh daily prices
                  </button>
                  <Link href="/smart-tools" target="_blank" className="block px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    View Smart Tools page
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Recent posts</h3>
                {posts.length === 0 ? (
                  <p className="text-sm text-gray-500">No posts yet.</p>
                ) : (
                  <div className="space-y-2">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{post.title}</p>
                          <p className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {post.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Blogs tab */}
        {tab === 'blogs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Blog Posts</h2>
              <Link href="/admin/blogs/new" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors">
                + New Post
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No posts yet. Create your first one.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{post.title}</td>
                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{post.category}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{new Date(post.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {post.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-3">
                          <Link href={`/admin/blogs/${post.id}/edit`} className="text-primary hover:underline">Edit</Link>
                          <button onClick={() => void handleDelete(post.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Messages tab */}
        {tab === 'messages' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-2">Contact Messages</h2>
            <p className="text-sm text-gray-500 mb-4">
              Messages sent through the contact form are delivered to <strong>connect@paisareality.com</strong> via the API. Check your inbox for new messages.
            </p>
            <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">Messages are delivered directly to your email.</p>
              <p className="text-sm mt-1">To view them here, connect a database table for messages in a future update.</p>
            </div>
          </div>
        )}

        {/* Actions tab */}
        {tab === 'actions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Price Management</h3>
              <p className="text-sm text-gray-500 mb-3">Trigger a manual refresh of all commodity prices (gold, silver, petrol, diesel, LPG).</p>
              <button
                onClick={() => void triggerPriceUpdate()}
                className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors"
              >
                Update all prices now
              </button>
              {actionLog && <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">{actionLog}</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Site links</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link href="/" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Homepage</Link>
                <Link href="/smart-tools" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Smart Tools</Link>
                <Link href="/calculators" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Calculators</Link>
                <Link href="/score" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Health Score</Link>
                <Link href="/schemes" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Schemes</Link>
                <Link href="/bank-rates" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Bank Rates</Link>
                <Link href="/blog" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Blog</Link>
                <Link href="/sitemap.xml" target="_blank" className="px-3 py-2 text-center text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">Sitemap</Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Environment</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500">Framework</p>
                  <p className="font-medium">Next.js 16 (Turbopack)</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500">Database</p>
                  <p className="font-medium">PostgreSQL</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500">Smart Tools</p>
                  <p className="font-medium">9 tools live</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500">Calculators</p>
                  <p className="font-medium">10 basic + 9 advanced</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
