'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TickerItem {
  label: string;
  value: number;
  unit: string;
  change: number | null;
  href: string;
  decimals: number;
}

function formatValue(item: TickerItem): string {
  const n = item.value.toLocaleString('en-IN', { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals });
  return item.unit === '%' ? `${n}%` : `\u20B9${n}${item.unit}`;
}

function Change({ value }: { value: number | null }): React.ReactElement | null {
  if (value === null) return null;
  if (Math.abs(value) < 0.005) return <span className="text-white/50">0.00%</span>;
  const up = value > 0;
  return (
    <span className={up ? 'text-emerald-300' : 'text-red-300'}>
      <span aria-hidden="true">{up ? '\u25B2' : '\u25BC'}</span>
      <span className="sr-only">{up ? 'up' : 'down'}</span> {Math.abs(value).toFixed(2)}%
    </span>
  );
}

/**
 * Site-wide rate strip. Loads after the page, so it never delays the first paint,
 * and simply stays empty if the rates cannot be fetched.
 */
export default function RateTicker(): React.ReactElement {
  const [items, setItems] = useState<TickerItem[] | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Prices change up to five times a day; refetch every 10 minutes while the tab is open.
    const load = (): void => { fetch('/api/ticker', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: TickerItem[]; asOf?: string | null } | null) => {
        if (!alive || !d) return;
        setItems(d.items ?? []);
        setAsOf(d.asOf ?? null);
      })
      .catch(() => setItems((prev) => prev ?? [])); };
    load();
    const t = setInterval(load, 10 * 60 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const date = asOf
    ? new Date(`${asOf}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
    : null;

  return (
    <div className="bg-navy-deep text-white text-[13px]">
      <div title={date ? `Rates as of ${date}` : undefined} className="container-main flex items-center h-9 gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items === null && <span className="text-white/40">Loading today&apos;s rates</span>}
        {items?.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="shrink-0 inline-flex items-center gap-2 no-underline text-white/90 hover:text-white tabular"
          >
            <span className="text-white/60">{item.label}</span>
            <span className="font-semibold">{formatValue(item)}</span>
            <Change value={item.change} />
          </Link>
        ))}
      </div>
    </div>
  );
}
