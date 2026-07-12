import { BANDS } from '@/lib/score-config';
import type { HistoryPoint } from '@/lib/health-score/history-analysis';

const W = 720, H = 300, PAD_L = 44, PAD_R = 16, PAD_T = 16, PAD_B = 34;
const PW = W - PAD_L - PAD_R, PH = H - PAD_T - PAD_B, MIN = 300, MAX = 900;

/** SVG line of total score over time with faint band-threshold guides. Accessible (role=img). */
export default function ScoreLineChart({ points }: { points: readonly HistoryPoint[] }): React.ReactElement {
  if (points.length < 2) return <div className="text-sm text-muted-2 py-8 text-center">Not enough history yet.</div>;
  const n = points.length;
  const x = (i: number): number => PAD_L + (i / (n - 1)) * PW;
  const y = (s: number): number => PAD_T + (1 - (Math.min(MAX, Math.max(MIN, s)) - MIN) / (MAX - MIN)) * PH;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.totalScore).toFixed(1)}`).join(' ');
  const guides = BANDS.slice(1).map((b) => b.min); // 550,650,750,825
  const fmt = (d: string): string => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const ariaLabel = `Score history from ${points[0]!.totalScore} on ${fmt(points[0]!.date)} to ${points[n - 1]!.totalScore} on ${fmt(points[n - 1]!.date)}.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      {[300, 900].concat(guides).map((s, i) => (
        <g key={i}>
          <line x1={PAD_L} y1={y(s)} x2={W - PAD_R} y2={y(s)} stroke="#f0f0f0" strokeWidth={1} />
          <text x={PAD_L - 6} y={y(s) + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{s}</text>
        </g>
      ))}
      <path d={line} fill="none" stroke="#007A78" strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.totalScore)} r={3.5} fill="#007A78" />)}
      <text x={PAD_L} y={H - 10} textAnchor="start" fontSize="10" fill="#6b7280">{fmt(points[0]!.date)}</text>
      <text x={W - PAD_R} y={H - 10} textAnchor="end" fontSize="10" fill="#6b7280">{fmt(points[n - 1]!.date)}</text>
    </svg>
  );
}
