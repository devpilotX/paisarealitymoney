'use client';

import { useMemo } from 'react';
import { formatINR } from '@/lib/constants';

interface DataPoint {
  date: string;
  price: number;
}

interface PriceChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
}

export default function PriceChart({
  data,
  title,
  color = '#007A78',
  height = 250,
}: PriceChartProps): React.ReactElement {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const prices = sorted.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const padding = 50;
    const chartWidth = 600;
    const chartHeight = height - 40;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - 30;

    const points = sorted.map((d, i) => {
      const x = padding + (i / Math.max(sorted.length - 1, 1)) * plotWidth;
      const y = chartHeight - 15 - ((d.price - minPrice) / priceRange) * plotHeight;
      return { x, y, date: d.date, price: d.price };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    const areaD = `${pathD} L ${points[points.length - 1]?.x.toFixed(1)} ${chartHeight - 15} L ${points[0]?.x.toFixed(1)} ${chartHeight - 15} Z`;

    return { sorted, points, pathD, areaD, minPrice, maxPrice, chartWidth, chartHeight, padding, plotHeight };
  }, [data, height]);

  if (!chartData || data.length === 0) {
    return (
      <div className="card">
        <h3 className="heading-3 mb-4">{title}</h3>
        <p className="text-center py-8 text-gray-500">Not enough data for chart.</p>
      </div>
    );
  }

  const { sorted, points, pathD, areaD, minPrice, maxPrice, chartWidth, chartHeight, padding, plotHeight } = chartData;
  const midPrice = (minPrice + maxPrice) / 2;

  return (
    <div className="card">
      <h3 className="heading-3 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
          className="w-full"
          style={{ minWidth: '300px' }} 
          role="img"
          aria-label={`${title} price chart`}
        >
          {/* Y-axis labels */}
          <text x={padding - 5} y={chartHeight - 15} className="text-[10px]" fill="#9CA3AF" textAnchor="end">
            {formatINR(minPrice)}
          </text>
          <text x={padding - 5} y={chartHeight - 15 - plotHeight / 2} className="text-[10px]" fill="#9CA3AF" textAnchor="end">
            {formatINR(midPrice)}
          </text>
          <text x={padding - 5} y={chartHeight - 15 - plotHeight} className="text-[10px]" fill="#9CA3AF" textAnchor="end">
            {formatINR(maxPrice)}
          </text>

          {/* Grid lines */}
          <line x1={padding} y1={chartHeight - 15} x2={chartWidth - padding} y2={chartHeight - 15} stroke="#E5E7EB" strokeWidth="1" />
          <line x1={padding} y1={chartHeight - 15 - plotHeight / 2} x2={chartWidth - padding} y2={chartHeight - 15 - plotHeight / 2} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
          <line x1={padding} y1={chartHeight - 15 - plotHeight} x2={chartWidth - padding} y2={chartHeight - 15 - plotHeight} stroke="#E5E7EB" strokeWidth="1" />

          {/* Area fill */}
          <path d={areaD} fill={color} opacity="0.1" />

          {/* Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="1.5" />
          ))}

          {/* X-axis labels (first, middle, last) */}
          {sorted.length > 0 && (
            <>
              <text x={padding} y={chartHeight + 10} className="text-[9px]" fill="#9CA3AF" textAnchor="start">
                {new Date(sorted[0]?.date ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </text>
              {sorted.length > 2 && (
                <text x={chartWidth / 2} y={chartHeight + 10} className="text-[9px]" fill="#9CA3AF" textAnchor="middle">
                  {new Date(sorted[Math.floor(sorted.length / 2)]?.date ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </text>
              )}
              <text x={chartWidth - padding} y={chartHeight + 10} className="text-[9px]" fill="#9CA3AF" textAnchor="end">
                {new Date(sorted[sorted.length - 1]?.date ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}