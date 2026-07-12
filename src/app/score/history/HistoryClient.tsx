'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ScoreLineChart from '@/components/score/ScoreLineChart';
import { scoreDelta, pillarTrends, bandCrossingUp, type HistoryPoint, type Direction } from '@/lib/health-score/history-analysis';
import { PILLAR_NAMES, PILLAR_LABEL, type PillarName } from '@/lib/score-config';

const ARROW: Record<Direction, string> = { up: '\u25B2', down: '\u25BC', flat: '\u25AC' };
const ARROW_CLS: Record<Direction, string> = { up: 'text-green-700', down: 'text-brand-red', flat: 'text-muted-2' };

type State = { kind: 'loading' } | { kind: 'unauth' } | { kind: 'error' } | { kind: 'ok'; points: HistoryPoint[] };

export default function HistoryClient(): React.ReactElement {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch('/api/history');
        if (res.status === 401) { if (active) setState({ kind: 'unauth' }); return; }
        const data = await res.json() as { success: boolean; history?: HistoryPoint[] };
        if (active) setState(data.success && data.history ? { kind: 'ok', points: data.history } : { kind: 'error' });
      } catch { if (active) setState({ kind: 'error' }); }
    })();
    return () => { active = false; };
  }, []);

  if (state.kind === 'loading') return <p className="text-muted-2">Loading...</p>;
  if (state.kind === 'unauth') return (
    <div className="card text-center"><p className="text-ink mb-3">Sign in to keep and track your score history across devices.</p>
      <Link href="/login" className="btn-primary no-underline">Sign in</Link></div>
  );
  if (state.kind === 'error') return <p className="text-red-600">Could not load your history. Please try again.</p>;

  const { points } = state;
  if (points.length === 0) return (
    <div className="card text-center"><p className="text-ink mb-3">No saved scores yet.</p><Link href="/score" className="btn-primary no-underline">Calculate your score</Link></div>
  );
  if (points.length === 1) return (
    <div className="card text-center">
      <p className="text-2xl font-bold text-primary mb-1">{points[0]!.totalScore}<span className="text-base font-normal text-muted-2"> / 900</span></p>
      <p className="text-ink mb-3">That&apos;s your first snapshot. Refine an input or use a tool, then come back to watch your score move.</p>
      <Link href="/calculators/budget-optimizer" className="btn-secondary no-underline">Use a money tool</Link>
    </div>
  );

  const delta = scoreDelta(points);
  const trends = pillarTrends(points);
  const crossed = bandCrossingUp(points);
  const latest = points[points.length - 1]!;

  return (
    <div className="space-y-6">
      {crossed && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-green-800 font-semibold">&#127881; You moved up from {crossed.from} to {crossed.to}!</p>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div><span className="text-3xl font-bold text-primary">{latest.totalScore}</span><span className="text-muted-2"> / 900 &middot; {latest.band}</span></div>
          {delta && delta.direction !== 'flat' && (
            <span className={`text-sm font-semibold ${delta.direction === 'up' ? 'text-green-700' : 'text-red-700'}`}>
              {delta.direction === 'up' ? '\u2191' : '\u2193'} {delta.direction === 'up' ? '+' : ''}{delta.delta} since last snapshot
            </span>
          )}
        </div>
        <ScoreLineChart points={points} />
      </div>

      <div className="card">
        <h2 className="heading-3 mb-3">Pillar movement vs last snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PILLAR_NAMES.map((n: PillarName) => { const d = trends[n] ?? 'flat'; return (
            <div key={n} className="flex items-center justify-between text-sm border border-line/60 rounded-lg px-3 py-2">
              <span className="text-ink">{PILLAR_LABEL[n]}</span><span className={`font-semibold ${ARROW_CLS[d]}`}>{ARROW[d]}</span>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
