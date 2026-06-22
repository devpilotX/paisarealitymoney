'use client';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

type Tab = 'subscribers' | 'compose' | 'logs' | 'templates';
interface Sub { id: number; email: string; status: string; source: string; created_at: string; }
interface Log { id: number; to_email: string; subject: string; kind: string; status: string; created_at: string; }
interface Tpl { id: number; key: string; name: string; subject: string; html_body: string; }

export default function AdminEmailsPage(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('subscribers');
  const [subs, setSubs] = useState<Sub[]>([]);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [editTpl, setEditTpl] = useState<Tpl | null>(null);
  const [tplMsg, setTplMsg] = useState('');
  const loadSubs = useCallback(async (q = '') => {
    const res = await fetch(`/api/admin/emails?tab=subscribers&q=${encodeURIComponent(q)}`);
    if (!res.ok) { setError('Unauthorized'); return; }
    const d = await res.json() as { subscribers: Sub[]; total: number };
    setSubs(d.subscribers || []); setTotal(d.total || 0);
  }, []);

  const loadLogs = useCallback(async () => {
    const res = await fetch('/api/admin/emails?tab=logs');
    if (!res.ok) return;
    const d = await res.json() as { logs: Log[] };
    setLogs(d.logs || []);
  }, []);

  useEffect(() => { void loadSubs(); }, [loadSubs]);

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/emails/templates');
    if (!res.ok) return;
    const d = await res.json() as { templates: Tpl[] };
    setTemplates(d.templates || []);
  }, []);

  const saveTpl = useCallback(async () => {
    if (!editTpl) return;
    setTplMsg('');
    const res = await fetch('/api/admin/emails/templates', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTpl.id, subject: editTpl.subject, html_body: editTpl.html_body }),
    });
    if ((await res.json() as { success?: boolean }).success) {
      setTplMsg('Saved.'); void loadTemplates();
    } else setTplMsg('Failed.');
  }, [editTpl, loadTemplates]);

  const removeSub = useCallback(async (id: number) => {
    if (!window.confirm('Remove this subscriber?')) return;
    await fetch(`/api/admin/emails?id=${id}`, { method: 'DELETE' });
    setSubs(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleSend = useCallback(async () => {
    setSending(true); setSendMsg('');
    const res = await fetch('/api/admin/emails/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, html: body }),
    });
    const d = await res.json() as { success?: boolean; sent?: number; failed?: number; error?: string };
    setSending(false); setConfirm(false);
    if (d.success) setSendMsg(`Sent to ${d.sent} subscribers. ${d.failed ? d.failed + ' failed.' : ''}`);
    else setSendMsg(d.error || 'Failed.');
  }, [subject, body]);

  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-600">{error}</p></div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'subscribers', label: `Subscribers (${total})` },
    { id: 'compose', label: 'Compose' },
    { id: 'logs', label: 'Logs' },
    { id: 'templates', label: 'Templates' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-lg font-bold text-primary hover:opacity-80">Paisa</Link>
            <span className="text-lg font-bold text-gray-900">Reality</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Emails</span>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-primary">Back to Admin</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'logs') void loadLogs(); if (t.id === 'templates') void loadTemplates(); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'subscribers' && (
          <div>
            <div className="flex gap-3 mb-4">
              <input placeholder="Search by email..." value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void loadSubs(search); }}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:outline-none" />
              <button onClick={() => void loadSubs(search)} className="px-4 py-2 text-sm bg-primary text-white rounded-lg">Search</button>
              <a href="/api/admin/emails?format=csv" className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Export CSV</a>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {subs.length === 0 ? <p className="p-6 text-sm text-gray-500 text-center">No subscribers yet.</p> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subs.map(s => (
                      <tr key={s.id}>
                        <td className="px-4 py-3">{s.email}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => void removeSub(s.id)} className="text-xs text-red-600 hover:underline">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:outline-none" placeholder="Newsletter subject" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body (HTML)</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={14}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:outline-none font-mono" placeholder="<h2>Your content here</h2><p>...</p>" />
              </div>
              <p className="text-xs text-gray-500">Recipients: {total} active subscribers. An unsubscribe link is added automatically.</p>
              {!confirm ? (
                <button onClick={() => setConfirm(true)} disabled={!subject || !body} className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-800 disabled:opacity-50">
                  Send to {total} subscribers
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => void handleSend()} disabled={sending} className="px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
                    {sending ? 'Sending...' : 'Confirm Send'}
                  </button>
                  <button onClick={() => setConfirm(false)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                </div>
              )}
              {sendMsg && <p className="text-sm text-green-700">{sendMsg}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
              <div className="bg-white border border-gray-200 rounded-xl p-6 min-h-[300px] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: body || '<p class="text-gray-400">Your preview will appear here...</p>' }} />
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {logs.length === 0 ? <p className="p-6 text-sm text-gray-500 text-center">No logs yet.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">To</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 truncate max-w-[150px]">{l.to_email}</td>
                      <td className="px-4 py-3 truncate max-w-[200px] hidden sm:table-cell">{l.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          l.status === 'delivered' || l.status === 'sent' ? 'bg-green-100 text-green-700' :
                          l.status === 'opened' ? 'bg-blue-100 text-blue-700' :
                          l.status === 'bounced' || l.status === 'complained' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{new Date(l.created_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Templates</h3>
              <div className="space-y-2">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { setEditTpl(t); setTplMsg(''); }}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm ${editTpl?.id === t.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <span className="font-medium">{t.name}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Key: {t.key}</span>
                  </button>
                ))}
              </div>
            </div>
            {editTpl && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input value={editTpl.subject} onChange={e => setEditTpl({ ...editTpl, subject: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HTML Body</label>
                  <textarea value={editTpl.html_body} onChange={e => setEditTpl({ ...editTpl, html_body: e.target.value })} rows={12}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-primary focus:outline-none font-mono" />
                </div>
                <p className="text-xs text-gray-500">Variables: {'{{name}}, {{verify_url}}, {{reset_url}}, {{dashboard_url}}, {{button:Label:url}}'}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => void saveTpl()} className="px-4 py-2 bg-primary text-white text-sm rounded-lg">Save</button>
                  {tplMsg && <span className="text-sm text-green-700">{tplMsg}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: editTpl.html_body }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
