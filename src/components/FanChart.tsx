import { formatCompactINR } from '@/lib/constants';
import type { PercentileBand } from '@/lib/retirement-optimizer';

/**
 * FanChart. a dependency-free, accessible SVG fan chart of projected corpus over time.
 * Shows the 10–90th and 25–75th percentile bands plus the median line, with a marker at the
 * retirement age. Pure SVG, scales via viewBox (no layout shift, no charting library).
 */

interface FanChartProps {
  bands: PercentileBand[];
  retirementAge: number;
}

const W = 760;
const H = 380;
const PAD_L = 70;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export default function FanChart({ bands, retirementAge }: FanChartProps): React.ReactElement {
  if (bands.length < 2) {
    return <div className="text-sm text-gray-400 py-8 text-center">Adjust inputs to see the projection.</div>;
  }

  const minAge = bands[0]!.age;
  const maxAge = bands[bands.length - 1]!.age;
  const ageSpan = Math.max(1, maxAge - minAge);

  let yMax = 0;
  for (const b of bands) if (b.p90 > yMax) yMax = b.p90;
  yMax = yMax > 0 ? yMax * 1.08 : 1;

  const x = (age: number): number => PAD_L + ((age - minAge) / ageSpan) * PLOT_W;
  const y = (val: number): number => PAD_T + (1 - Math.min(val, yMax) / yMax) * PLOT_H;

  const bandPolygon = (hi: (b: PercentileBand) => number, lo: (b: PercentileBand) => number): string => {
    const top = bands.map((b) => `${x(b.age).toFixed(1)},${y(hi(b)).toFixed(1)}`);
    const bottom = [...bands].reverse().map((b) => `${x(b.age).toFixed(1)},${y(lo(b)).toFixed(1)}`);
    return [...top, ...bottom].join(' ');
  };

  const linePath = (sel: (b: PercentileBand) => number): string =>
    bands.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(b.age).toFixed(1)} ${y(sel(b)).toFixed(1)}`).join(' ');

  // Y gridlines / ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  // X ticks: every 10 years plus the endpoints
  const xTicks: number[] = [];
  for (let a = minAge; a <= maxAge; a += 10) xTicks.push(a);
  if (xTicks[xTicks.length - 1] !== maxAge) xTicks.push(maxAge);

  const retBand = bands.find((b) => b.age === retirementAge) ?? bands[0]!;
  const endBand = bands[bands.length - 1]!;
  const ariaLabel =
    `Projected corpus from age ${minAge} to ${maxAge}. ` +
    `At retirement (age ${retirementAge}) the median corpus is about ${formatCompactINR(retBand.p50)}, ` +
    `ranging from ${formatCompactINR(retBand.p10)} (pessimistic) to ${formatCompactINR(retBand.p90)} (optimistic). ` +
    `By age ${maxAge} the median is ${formatCompactINR(endBand.p50)} and the pessimistic 10th percentile is ${formatCompactINR(endBand.p10)}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      {/* Y gridlines + labels */}
      {yTicks.map((v, i) => (
        <g key={`y${i}`}>
          <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="#f0f0f0" strokeWidth={1} />
          <text x={PAD_L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
            {formatCompactINR(v)}
          </text>
        </g>
      ))}

      {/* 10–90 band */}
      <polygon points={bandPolygon((b) => b.p90, (b) => b.p10)} fill="#99D7D6" fillOpacity={0.45} />
      {/* 25–75 band */}
      <polygon points={bandPolygon((b) => b.p75, (b) => b.p25)} fill="#33AFAD" fillOpacity={0.45} />
      {/* Median line */}
      <path d={linePath((b) => b.p50)} fill="none" stroke="#006260" strokeWidth={2.5} />

      {/* Retirement marker */}
      <line x1={x(retirementAge)} y1={PAD_T} x2={x(retirementAge)} y2={PAD_T + PLOT_H} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={x(retirementAge)} y={PAD_T + 10} textAnchor="middle" fontSize="11" fill="#dc2626" fontWeight="600">
        Retire @ {retirementAge}
      </text>

      {/* Axis baseline */}
      <line x1={PAD_L} y1={PAD_T + PLOT_H} x2={W - PAD_R} y2={PAD_T + PLOT_H} stroke="#d1d5db" strokeWidth={1} />
      {xTicks.map((a, i) => (
        <text key={`x${i}`} x={x(a)} y={H - 12} textAnchor="middle" fontSize="11" fill="#6b7280">
          {a}
        </text>
      ))}
      <text x={PAD_L + PLOT_W / 2} y={H - 1} textAnchor="middle" fontSize="10" fill="#9ca3af">Age</text>
    </svg>
  );
}
