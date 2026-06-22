'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessagesPage(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/messages');
    if (!res.ok) { setError('Not authorized or failed to load.'); setLoading(false); return; }
    const data = await res.json() as { messages?: Message[] };
    setMessages(data.messages || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleRead = useCallback(async (id: number, current: boolean) => {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_read: !current }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: !current } : m));
  }, []);

  const remove = useCallback(async (id: number) => {
    if (!window.confirm('Delete this message?')) return;
    await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-lg font-bold text-primary hover:opacity-80">Paisa</Link>
            <span className="text-lg font-bold text-gray-900">Reality</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Messages</span>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-primary">Back to Admin</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Contact Messages {unreadCount > 0 && <span className="text-sm font-normal text-primary">({unreadCount} unread)</span>}
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`bg-white rounded-xl border p-5 ${m.is_read ? 'border-gray-200' : 'border-primary/30 bg-primary/[0.02]'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!m.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                      <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                      <a href={`mailto:${m.email}`} className="text-xs text-primary hover:underline truncate">{m.email}</a>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{m.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(m.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => void toggleRead(m.id, m.is_read)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      {m.is_read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button
                      onClick={() => void remove(m.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
