'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AD_PLACEMENTS, AD_TYPES, type AdType } from '@/lib/ads-constants';
import type { AdCreative } from '@/lib/ads';

interface FormState {
  name: string;
  placement: string;
  type: AdType;
  imageUrl: string;
  videoUrl: string;
  html: string;
  linkUrl: string;
  altText: string;
  priority: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
}

const EMPTY: FormState = {
  name: '', placement: AD_PLACEMENTS[0].value, type: 'image',
  imageUrl: '', videoUrl: '', html: '', linkUrl: '', altText: '',
  priority: '0', active: true, startsAt: '', endsAt: '',
};

function toLocalInput(value: string | null): string {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
}

export default function AdminAdsPage(): React.ReactElement {
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // null = create
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads');
      if (res.status === 401) { setAuthed(false); return; }
      const data = (await res.json()) as { ads?: AdCreative[] };
      setAds(data.ads ?? []);
      setAuthed(true);
    } catch {
      setMsg('Could not load ads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const startNew = useCallback((): void => {
    setForm(EMPTY); setEditingId(null); setShowForm(true); setMsg('');
  }, []);

  const startEdit = useCallback((a: AdCreative): void => {
    setForm({
      name: a.name, placement: a.placement, type: a.type,
      imageUrl: a.imageUrl ?? '', videoUrl: a.videoUrl ?? '', html: a.html ?? '',
      linkUrl: a.linkUrl ?? '', altText: a.altText ?? '', priority: String(a.priority),
      active: a.active, startsAt: toLocalInput(a.startsAt), endsAt: toLocalInput(a.endsAt),
    });
    setEditingId(a.id); setShowForm(true); setMsg('');
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (!form.name.trim() || !form.placement) { setMsg('Name and placement are required.'); return; }
    setSaving(true); setMsg('');
    const payload = {
      ...form,
      priority: Number(form.priority) || 0,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };
    const url = editingId == null ? '/api/admin/ads' : `/api/admin/ads/${editingId}`;
    const method = editingId == null ? 'POST' : 'PUT';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (res.ok) { setShowForm(false); await load(); } else { setMsg(data.error || 'Failed to save.'); }
    } catch {
      setMsg('Network error.');
    } finally {
      setSaving(false);
    }
  }, [editingId, form, load]);

  const remove = useCallback(async (id: number): Promise<void> => {
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
    setConfirmId(null);
    await load();
  }, [load]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-700 mb-3">Please sign in to the admin dashboard first.</p>
          <Link href="/admin" className="btn-primary no-underline">Go to Admin login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ad Manager</h1>
            <p className="text-sm text-gray-500">Add and update image, video, or HTML ads. Empty slots fall back to AdSense.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-primary hover:underline">Back to Admin</Link>
            <button onClick={startNew} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-800">
              New ad
            </button>
          </div>
        </div>

        {msg && <p className="mb-4 text-sm text-red-600">{msg}</p>}

        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{editingId == null ? 'New ad' : 'Edit ad'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Name</span>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className="input-field" placeholder="Diwali gold banner" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Placement</span>
                <select value={form.placement} onChange={(e) => set('placement', e.target.value)} className="input-field">
                  {AD_PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Type</span>
                <select value={form.type} onChange={(e) => set('type', e.target.value as AdType)} className="input-field">
                  {AD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Priority (higher wins)</span>
                <input type="number" value={form.priority} onChange={(e) => set('priority', e.target.value)} className="input-field" />
              </label>
            </div>

            {form.type === 'image' && (
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Image URL</span>
                <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} className="input-field" placeholder="https://.../banner.png" />
              </label>
            )}
            {form.type === 'video' && (
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Video URL (mp4 or webm)</span>
                <input value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} className="input-field" placeholder="https://.../ad.mp4" />
              </label>
            )}
            {form.type === 'html' && (
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">HTML (sanitized on render)</span>
                <textarea value={form.html} onChange={(e) => set('html', e.target.value)} className="input-field h-32 font-mono text-sm" placeholder="<a href=...><img src=... /></a>" />
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Click-through URL</span>
                <input value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} className="input-field" placeholder="https://advertiser.example" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Alt text / label</span>
                <input value={form.altText} onChange={(e) => set('altText', e.target.value)} className="input-field" placeholder="Sponsor name and offer" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Starts at (optional)</span>
                <input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} className="input-field" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Ends at (optional)</span>
                <input type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} className="input-field" />
              </label>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-5 h-5" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => void save()} disabled={saving} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-800 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save ad'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-gray-500">Loading...</p>
          ) : ads.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No ads yet. Click New ad to add your first creative.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Placement</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Views</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Clicks</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{a.placement}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{a.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {a.active ? 'Active' : 'Off'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{a.impressions}</td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{a.clicks}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(a)} className="text-primary hover:underline mr-3">Edit</button>
                      {confirmId === a.id ? (
                        <button onClick={() => void remove(a.id)} className="text-red-600 font-semibold hover:underline">Confirm</button>
                      ) : (
                        <button onClick={() => setConfirmId(a.id)} className="text-red-600 hover:underline">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
