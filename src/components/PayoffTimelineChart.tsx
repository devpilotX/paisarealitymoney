import { formatCompactINR } from '@/lib/constants';

/**
 * PayoffTimelineChart. dependency-free, accessible multi-line SVG of the total outstanding
 * debt balance over time for each strategy. Pure SVG, scales via viewBox (no layout shift).
 */

export interface TimelineSeries {
  label: string;
  color: string;
  timeline: number[]; // total balance at each month (index 0 = today)
}

interface PayoffTimelineChartProps {
  series: TimelineSeries[];
  xLabel?: string;
  xTickStepOverride?: number;
  emptyMessage?: string;
}

const W = 760;
const H = 340;
const PAD_L = 64;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 52;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export default function PayoffTimelineChart({ series, xLabel = 'Months from today', xTickStepOverride, emptyMessage = 'Add loans and a budget to see the payoff timeline.' }: PayoffTimelineChartProps): React.ReactElement {
  const active = series.filter((s) => s.timeline.length > 1);
  if (active.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center">{emptyMessage}</div>;
  }

  let maxMonths = 0;
  let maxBalance = 0;
  for (const s of active) {
    maxMonths = Math.max(maxMonths, s.timeline.length - 1);
    for (const v of s.timeline) if (v > maxBalance) maxBalance = v;
  }
  maxMonths = Math.max(1, maxMonths);
  maxBalance = maxBalance > 0 ? maxBalance * 1.05 : 1;

  const x = (month: number): number => PAD_L + (month / maxMonths) * PLOT_W;
  const y = (bal: number): number => PAD_T + (1 - Math.min(bal, maxBalance) / maxBalance) * PLOT_H;

  const linePath = (timeline: number[]): string =>
    timeline.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(b).toFixed(1)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxBalance);
  const xTickStep = xTickStepOverride ?? (maxMonths <= 24 ? 6 : maxMonths <= 60 ? 12 : 24);
  const xTicks: number[] = [];
  for (let mo = 0; mo <= maxMonths; mo += xTickStep) xTicks.push(mo);

  const ariaLabel =
    'Total outstanding debt over time for each strategy. ' +
    active.map((s) => `${s.label} clears in about ${Math.round((s.timeline.length - 1) / 12 * 10) / 10} years`).join('; ') + '.';

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
        {yTicks.map((v, i) => (
          <g key={`y${i}`}>
            <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="#f0f0f0" strokeWidth={1} />
            <text x={PAD_L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{formatCompactINR(v)}</text>
          </g>
        ))}
        <line x1={PAD_L} y1={PAD_T + PLOT_H} x2={W - PAD_R} y2={PAD_T + PLOT_H} stroke="#d1d5db" strokeWidth={1} />
        {xTicks.map((mo, i) => (
          <text key={`x${i}`} x={x(mo)} y={H - PAD_B + 20} textAnchor="middle" fontSize="11" fill="#6b7280">{mo}</text>
        ))}
        <text x={PAD_L + PLOT_W / 2} y={H - PAD_B + 38} textAnchor="middle" fontSize="10" fill="#9ca3af">{xLabel}</text>

        {active.map((s) => (
          <path key={s.label} d={linePath(s.timeline)} fill="none" stroke={s.color} strokeWidth={2.25} strokeLinejoin="round" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 justify-center mt-2">
        {active.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block w-3 h-1.5 rounded" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
