import { formatINR } from '@/lib/constants';

interface PriceCardProps {
  label: string;
  price: number | string;
  change: number | string | null;
  changePercent: number | string | null;
  unit?: string;
  size?: 'default' | 'large';
}

/** One price with its day change. Postgres numerics arrive as strings, so everything is coerced. */
export default function PriceCard({ label, price, change, changePercent, unit = 'per gram', size = 'default' }: PriceCardProps): React.ReactElement {
  const ch = Number(change ?? 0);
  const pct = Number(changePercent ?? 0);
  const flat = !Number.isFinite(ch) || Math.abs(ch) < 0.005;
  const up = !flat && ch > 0;
  return (
    <div className={`card ${size === 'large' ? 'border-navy/30' : ''}`}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-1 font-semibold tracking-[-0.02em] text-ink tabular ${size === 'large' ? 'text-3xl sm:text-[34px]' : 'text-2xl'}`}>
        {formatINR(Number(price))}
      </p>
      <p className="text-[13px] text-muted-2">{unit}</p>
      <p className={`mt-3 text-sm font-medium tabular ${flat ? 'text-muted-2' : up ? 'text-green-700' : 'text-brand-red'}`}>
        {flat ? 'No change since yesterday' : (
          <>
            <span aria-hidden="true">{up ? '\u25B2' : '\u25BC'} </span>
            <span className="sr-only">{up ? 'Up' : 'Down'} </span>
            {formatINR(Math.abs(ch))} ({Math.abs(pct).toFixed(2)}%)
          </>
        )}
      </p>
    </div>
  );
}
