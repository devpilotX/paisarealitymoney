import { formatINR, formatDateShort } from '@/lib/constants';

interface PriceRow {
  date: string;
  price: number;
  change: number;
  changePercent: number;
  label?: string;
}

interface PriceTableProps {
  title: string;
  rows: PriceRow[];
  priceLabel?: string;
  unit?: string;
}

export default function PriceTable({
  title,
  rows,
  priceLabel = 'Price',
  unit = 'per gram',
}: PriceTableProps): React.ReactElement {
  return (
    <div className="overflow-x-auto">
      <h3 className="heading-3 mb-4">{title}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-paper-2 border-b border-line">
            <th className="text-left py-3 px-4 text-sm font-semibold text-navy">Date</th>
            {rows[0]?.label !== undefined && (
              <th className="text-left py-3 px-4 text-sm font-semibold text-navy">City</th>
            )}
            <th className="text-right py-3 px-4 text-sm font-semibold text-navy">
              {priceLabel} ({unit})
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-navy">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isPositive = row.change > 0;
            const isNegative = row.change < 0;
            const changeColor = isPositive
              ? 'price-up'
              : isNegative
              ? 'price-down'
              : 'price-neutral';
            const arrow = isPositive ? '\u25B2' : isNegative ? '\u25BC' : '';

            return (
              <tr
                key={`${row.date}-${index}`}
                className="border-b border-line/60 hover:bg-paper-2 transition-colors duration-200"
              >
                <td className="py-3 px-4 text-sm text-ink">
                  {formatDateShort(row.date)}
                </td>
                {row.label !== undefined && (
                  <td className="py-3 px-4 text-sm text-ink">{row.label}</td>
                )}
                <td className="py-3 px-4 text-sm text-ink text-right font-medium">
                  {formatINR(row.price)}
                </td>
                <td className={`py-3 px-4 text-sm text-right font-medium ${changeColor}`}>
                  {arrow} {row.change === 0 ? '-' : `${formatINR(Math.abs(row.change))} (${Math.abs(row.changePercent).toFixed(2)}%)`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-center py-8 text-muted-2">No price data available yet.</p>
      )}
    </div>
  );
}
