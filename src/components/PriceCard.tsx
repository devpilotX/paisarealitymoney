import { formatINR } from '@/lib/constants';

interface PriceCardProps {
  label: string;
  price: number;
  change: number;
  changePercent: number;
  unit?: string;
  size?: 'default' | 'large';
}

export default function PriceCard({
  label,
  price,
  change,
  changePercent,
  unit = 'per gram',
  size = 'default',
}: PriceCardProps): React.ReactElement {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const changeColor = isPositive ? 'price-up' : isNegative ? 'price-down' : 'price-neutral';
  const arrow = isPositive ? '\u25B2' : isNegative ? '\u25BC' : '';

  return (
    <div className="card">
      <p className={`text-sm font-medium text-gray-500 mb-1 ${
        size === 'large' ? 'text-base' : ''
      }`}>
        {label}
      </p>
      <p className={`font-bold text-gray-900 ${
        size === 'large' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
      }`}>
        {formatINR(price)}
      </p>
      <p className="text-xs text-gray-500 mb-2">{unit}</p>
      <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
        {arrow && <span className="text-xs">{arrow}</span>}
        <span>
          {isNeutral
            ? 'No change'
            : `${formatINR(Math.abs(change))} (${Math.abs(changePercent).toFixed(2)}%)`}
        </span>
      </div>
    </div>
  );
}