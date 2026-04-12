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
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
            {rows[0]?.label !== undefined && (
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">City</th>
            )}
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              {priceLabel} ({unit})
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isPositive = row.change > 0;
            const isNegative = row.change < 0;
            const changeColor = isPositive
              ? 'text-green-600'
              : isNegative
              ? 'text-red-600'
              : 'text-gray-500';
            const arrow = isPositive ? '\u25B2' : isNegative ? '\u25BC' : '';

            return (
              <tr
                key={`${row.date}-${index}`}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="py-3 px-4 text-sm text-gray-900">
                  {formatDateShort(row.date)}
                </td>
                {row.label !== undefined && (
                  <td className="py-3 px-4 text-sm text-gray-900">{row.label}</td>
                )}
                <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
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
        <p className="text-center py-8 text-gray-500">No price data available yet.</p>
      )}
    </div>
  );
}