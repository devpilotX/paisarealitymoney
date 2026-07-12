'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { CITIES } from '@/lib/cities';

interface Alert {
  id: number;
  commodity: string;
  city_slug: string;
  city_name: string;
  direction: string;
  target_price: number;
  active: boolean;
  triggered_at: string | null;
  triggered_price: number | null;
}

interface AlertsResponse {
  success: boolean;
  alerts?: Alert[];
  limit?: number;
  active?: number;
  error?: string;
}

const COMMODITY_LABELS: Record<string, string> = {
  gold_24k: '24K Gold /g',
  gold_22k: '22K Gold /g',
  silver: 'Silver /g',
};

const fmtINR = (v: number): string => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function AlertsPage(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [limit, setLimit] = useState(3);
  const [activeCount, setActiveCount] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [commodity, setCommodity] = useState('gold_24k');
  const [citySlug, setCitySlug] = useState('delhi');
  const [direction, setDirection] = useState('below');
  const [target, setTarget] = useState('');

  const load = useCallback((): void => {
    fetch('/api/alerts')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json() as Promise<AlertsResponse>;
      })
      .then((data) => {
        if (!data) return;
        if (data.success && data.alerts) {
          setAlerts(data.alerts);
          setLimit(data.limit ?? 3);
          setActiveCount(data.active ?? 0);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(() => setError('Could not load alerts. Please try again.'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback((e: React.FormEvent): void => {
    e.preventDefault();
    setSaving(true);
    setError('');
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commodity, citySlug, direction, targetPrice: Number(target) }),
    })
      .then((r) => r.json() as Promise<AlertsResponse>)
      .then((data) => {
        if (data.success) { setTarget(''); load(); }
        else setError(data.error ?? 'Could not create the alert.');
      })
      .catch(() => setError('Could not create the alert. Please try again.'))
      .finally(() => setSaving(false));
  }, [commodity, citySlug, direction, target, load]);

  const remove = useCallback((id: number): void => {
    fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
      .then(() => load())
      .catch(() => setError('Could not delete the alert.'));
  }, [load]);

  if (loading) return <div className="container-main py-12 text-center"><p className="text-muted-2">Loading alerts...</p></div>;

  const activeAlerts = alerts.filter((a) => a.active);
  const pastAlerts = alerts.filter((a) => !a.active);

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Price Alerts' }]} />
      <h1 className="heading-1 mb-2">Price Alerts</h1>
      <p className="text-body mb-6 max-w-2xl">
        We check gold and silver prices for your city every day. When your target is hit, you get one email and
        the alert retires. Using {activeCount} of {limit} active alerts.
      </p>

      <form onSubmit={create} className="card max-w-2xl mb-8">
        <h2 className="heading-3 mb-4">New alert</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="commodity" className="block text-sm font-medium text-ink mb-1">Metal</label>
            <select id="commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} className="input-field">
              <option value="gold_24k">24K Gold (per gram)</option>
              <option value="gold_22k">22K Gold (per gram)</option>
              <option value="silver">Silver (per gram)</option>
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-ink mb-1">City</label>
            <select id="city" value={citySlug} onChange={(e) => setCitySlug(e.target.value)} className="input-field">
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="direction" className="block text-sm font-medium text-ink mb-1">Alert me when the price is</label>
            <select id="direction" value={direction} onChange={(e) => setDirection(e.target.value)} className="input-field">
              <option value="below">At or below my target (buy signal)</option>
              <option value="above">At or above my target (sell signal)</option>
            </select>
          </div>
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-ink mb-1">Target price (₹ per gram)</label>
            <input id="target" type="number" min={1} step="0.01" required value={target} onChange={(e) => setTarget(e.target.value)} placeholder={commodity === 'silver' ? 'e.g. 190' : 'e.g. 11500'} className="input-field" />
          </div>
        </div>
        {error && <p className="text-sm text-brand-red mt-4">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary mt-4 disabled:opacity-60">
          {saving ? 'Saving...' : 'Create alert'}
        </button>
      </form>

      <h2 className="heading-2 mb-4">Active ({activeAlerts.length})</h2>
      {activeAlerts.length > 0 ? (
        <div className="space-y-3 max-w-2xl mb-10">
          {activeAlerts.map((a) => (
            <div key={a.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy">{COMMODITY_LABELS[a.commodity] ?? a.commodity} in {a.city_name}</p>
                <p className="text-sm text-muted">Email me when the price is {a.direction === 'below' ? 'at or below' : 'at or above'} <strong>{fmtINR(a.target_price)}</strong></p>
              </div>
              <button onClick={() => remove(a.id)} className="text-sm text-brand-red hover:underline flex-shrink-0">Delete</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-2 mb-10">No active alerts. Create one above. It takes ten seconds.</p>
      )}

      {pastAlerts.length > 0 && (
        <>
          <h2 className="heading-2 mb-4">Triggered</h2>
          <div className="space-y-3 max-w-2xl">
            {pastAlerts.map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-4 bg-paper-2">
                <div>
                  <p className="font-medium text-ink">{COMMODITY_LABELS[a.commodity] ?? a.commodity} in {a.city_name}</p>
                  <p className="text-sm text-muted-2">
                    Hit {a.triggered_price != null ? fmtINR(a.triggered_price) : 'target'} (target {a.direction === 'below' ? '≤' : '≥'} {fmtINR(a.target_price)})
                  </p>
                </div>
                <button onClick={() => remove(a.id)} className="text-sm text-muted-2 hover:text-brand-red hover:underline flex-shrink-0">Clear</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
