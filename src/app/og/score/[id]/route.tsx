import { ImageResponse } from 'next/og';
import { getPublicScoreById } from '@/lib/db/score-repo';
import { strengthLabel } from '@/lib/health-score/share';
import { BAND_COLOR } from '@/lib/score-config';

export const runtime = 'nodejs';

/** GET /og/score/[id] - share-card image: score, band (coloured), one strength, one fix, brand. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  let score: number | null = null;
  let band = 'At Risk';
  let strength = '\u2014';
  let fix = '\u2014';
  try {
    const s = await getPublicScoreById(id);
    if (s) { score = s.totalScore; band = s.band; strength = strengthLabel(s.pillarScores); fix = s.topActions[0]?.label ?? 'Build an emergency fund'; }
  } catch { /* fall through to a generic card */ }
  const color = BAND_COLOR[band] ?? '#007A78';

  return new ImageResponse(
    (
      <div style={{ width: '1200px', height: '630px', display: 'flex', flexDirection: 'column', background: '#ffffff', padding: '64px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', color: '#007A78', fontSize: 34, fontWeight: 800 }}>Paisa Reality</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 30, color: '#6b7280' }}>Money Health Score</div>
          <div style={{ display: 'flex', fontSize: 200, fontWeight: 800, color, lineHeight: 1 }}>{score ?? '\u2014'}</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#9ca3af' }}>out of 900</div>
          <div style={{ display: 'flex', marginTop: 16, padding: '10px 28px', background: color, color: '#fff', fontSize: 32, fontWeight: 700, borderRadius: 999 }}>{band}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26 }}>
          <div style={{ display: 'flex', color: '#16a34a' }}>Strength: {strength}</div>
          <div style={{ display: 'flex', color: '#dc2626' }}>Next: {fix}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
