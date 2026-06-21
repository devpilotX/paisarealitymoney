/**
 * SuccessGauge. a dependency-free, accessible semicircular probability gauge.
 * Pure SVG (no charting library). Scales with its container (viewBox) so there is no
 * layout shift. The arc is drawn as a sampled polyline to avoid SVG arc-flag pitfalls.
 */

interface SuccessGaugeProps {
  /** Probability in 0..1. */
  probability: number;
  /** Optional target probability in 0..1, shown as a tick on the dial. */
  target?: number;
  label?: string;
}

const CX = 100;
const CY = 105;
const R = 82;
const STROKE = 18;

function polar(t: number): { x: number; y: number } {
  // t in 0..1 maps to the left-to-right semicircle (180deg -> 0deg).
  const angle = Math.PI * (1 - t);
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

function arcPoints(fromT: number, toT: number, steps = 64): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = fromT + (toT - fromT) * (i / steps);
    const { x, y } = polar(t);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

function colorFor(p: number): string {
  if (p >= 0.85) return '#16a34a'; // green-600
  if (p >= 0.7) return '#d97706'; // amber-600
  return '#dc2626'; // red-600
}

function verdict(p: number): string {
  if (p >= 0.9) return 'Very strong';
  if (p >= 0.8) return 'On track';
  if (p >= 0.7) return 'Borderline';
  if (p >= 0.5) return 'At risk';
  return 'Off track';
}

export default function SuccessGauge({ probability, target, label }: SuccessGaugeProps): React.ReactElement {
  const p = Math.min(1, Math.max(0, probability));
  const color = colorFor(p);
  const pctText = `${Math.round(p * 100)}%`;
  const targetPoint = target !== undefined ? polar(Math.min(1, Math.max(0, target))) : null;

  return (
    <div className="w-full max-w-[280px] mx-auto">
      <svg
        viewBox="0 0 200 140"
        className="w-full h-auto"
        role="img"
        aria-label={`Probability of your money lasting: ${pctText}. ${verdict(p)}.${target !== undefined ? ` Target ${Math.round(target * 100)}%.` : ''}`}
      >
        {/* Background track */}
        <polyline
          points={arcPoints(0, 1)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <polyline
          points={arcPoints(0, Math.max(0.001, p))}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Target tick */}
        {targetPoint && (
          <circle cx={targetPoint.x} cy={targetPoint.y} r={4} fill="#1f2937">
            <title>Target {Math.round((target ?? 0) * 100)}%</title>
          </circle>
        )}
        {/* Central readout */}
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize="34" fontWeight="700" fill={color}>
          {pctText}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="12" fill="#6b7280">
          {verdict(p)}
        </text>
        {/* End labels */}
        <text x={CX - R} y={CY + 22} textAnchor="middle" fontSize="10" fill="#9ca3af">0%</text>
        <text x={CX + R} y={CY + 22} textAnchor="middle" fontSize="10" fill="#9ca3af">100%</text>
      </svg>
      {label && <p className="text-center text-sm text-gray-500 mt-1">{label}</p>}
    </div>
  );
}
