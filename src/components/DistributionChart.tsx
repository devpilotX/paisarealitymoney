import { formatCompactINR } from '@/lib/constants';
import type { HistogramBin } from '@/lib/prepay-vs-invest';

/**
 * DistributionChart. dependency-free, accessible SVG histogram of the simulated invest
 * outcomes, with a vertical reference line at the guaranteed prepay value and a median marker.
 * Bars are tinted by whether that outcome beats prepaying (teal) or not (rose). Pure SVG,
 * scales via viewBox (no layout shift, no charting library).
 */

interface DistributionChartProps {
  histogram: HistogramBin[];
  prepayValue: number;
  median: number;
  probInvestBeats: number; // 0..1, for the accessible summary
}

const W = 760;
const H = 320;
const PAD_L = 16;
const PAD_R = 16;
const PAD_T = 24;
const PAD_B = 40;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export default function DistributionChart({ histogram, prepayValue, median, probInvestBeats }: DistributionChartProps): React.ReactElement {
  if (histogram.length === 0) {
    return <div className="text-sm text-muted-2 py-8 text-center">Adjust inputs to see the distribution.</div>;
  }

  const dataMin = histogram[0]!.start;
  const dataMax = histogram[histogram.length - 1]!.end;
  const xMin = Math.min(dataMin, prepayValue);
  const xMax = Math.max(dataMax, prepayValue, median);
  const xSpan = Math.max(1, xMax - xMin);

  let maxCount = 0;
  for (const b of histogram) if (b.count > maxCount) maxCount = b.count;
  maxCount = Math.max(1, maxCount);

  const x = (v: number): number => PAD_L + ((v - xMin) / xSpan) * PLOT_W;
  const y = (count: number): number => PAD_T + (1 - count / maxCount) * PLOT_H;

  const xPrepay = x(prepayValue);
  const xMedian = x(median);

  // X-axis ticks (5 evenly spaced)
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => xMin + f * xSpan);

  const ariaLabel =
    `Distribution of simulated investment outcomes after tax. The median outcome is about ${formatCompactINR(median)}. ` +
    `The guaranteed prepay outcome is ${formatCompactINR(prepayValue)}. ` +
    `Investing finishes ahead of prepaying in ${Math.round(probInvestBeats * 100)}% of simulated scenarios.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      {/* Bars */}
      {histogram.map((b, i) => {
        const bx = x(b.start);
        const bw = Math.max(1, x(b.end) - x(b.start) - 1);
        const by = y(b.count);
        const bh = PAD_T + PLOT_H - by;
        const mid = (b.start + b.end) / 2;
        const beats = mid >= prepayValue;
        return (
          <rect
            key={i}
            x={bx}
            y={by}
            width={bw}
            height={Math.max(0, bh)}
            fill={beats ? '#33AFAD' : '#fb7185'}
            fillOpacity={0.7}
          />
        );
      })}

      {/* Baseline */}
      <line x1={PAD_L} y1={PAD_T + PLOT_H} x2={W - PAD_R} y2={PAD_T + PLOT_H} stroke="#d1d5db" strokeWidth={1} />

      {/* Prepay reference line */}
      <line x1={xPrepay} y1={PAD_T - 6} x2={xPrepay} y2={PAD_T + PLOT_H} stroke="#dc2626" strokeWidth={2} />
      <text x={Math.min(W - PAD_R - 4, Math.max(PAD_L + 4, xPrepay))} y={PAD_T - 10} textAnchor="middle" fontSize="11" fill="#dc2626" fontWeight="600">
        Prepay {formatCompactINR(prepayValue)}
      </text>

      {/* Median marker */}
      <line x1={xMedian} y1={PAD_T} x2={xMedian} y2={PAD_T + PLOT_H} stroke="#006260" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={Math.min(W - PAD_R - 4, Math.max(PAD_L + 4, xMedian))} y={PAD_T + PLOT_H + 28} textAnchor="middle" fontSize="11" fill="#006260" fontWeight="600">
        Median {formatCompactINR(median)}
      </text>

      {/* X ticks */}
      {xTicks.map((v, i) => (
        <text key={i} x={x(v)} y={PAD_T + PLOT_H + 14} textAnchor="middle" fontSize="10" fill="#9ca3af">
          {formatCompactINR(v)}
        </text>
      ))}
    </svg>
  );
}
