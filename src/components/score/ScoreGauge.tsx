/** Dependency-free SVG score gauge (300-900), band-coloured. Accessible (role=img). */
import { BAND_COLOR } from '@/lib/score-config';

const MIN = 300, MAX = 900, CX = 140, CY = 150, R = 118, STROKE = 22;

function polar(t: number): { x: number; y: number } {
  const angle = Math.PI * (1 - Math.min(1, Math.max(0, t)));
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}
function arc(from: number, to: number, steps = 72): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) { const t = from + (to - from) * (i / steps); const p = polar(t); pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`); }
  return pts.join(' ');
}

/** Render the score (300-900) as a CIBIL-style arc with the band label. */
export default function ScoreGauge({ score, band }: { score: number; band: string }): React.ReactElement {
  const t = (Math.min(MAX, Math.max(MIN, score)) - MIN) / (MAX - MIN);
  const color = BAND_COLOR[band] ?? '#007A78';
  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox="0 0 280 188" className="w-full h-auto" role="img" aria-label={`Your Money Health Score is ${score} out of 900: ${band}.`}>
        <polyline points={arc(0, 1)} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} strokeLinecap="round" />
        <polyline points={arc(0, Math.max(0.001, t))} fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
        <text x={CX} y={CY - 18} textAnchor="middle" fontSize="52" fontWeight="800" fill={color}>{Math.round(score)}</text>
        <text x={CX} y={CY + 6} textAnchor="middle" fontSize="13" fill="#6b7280">out of 900</text>
        <text x={CX} y={CY + 30} textAnchor="middle" fontSize="17" fontWeight="700" fill={color}>{band}</text>
        <text x={CX - R} y={CY + 24} textAnchor="middle" fontSize="11" fill="#9ca3af">300</text>
        <text x={CX + R} y={CY + 24} textAnchor="middle" fontSize="11" fill="#9ca3af">900</text>
      </svg>
    </div>
  );
}
