import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ScoreGauge from '@/components/score/ScoreGauge';
import ShareScore from '@/components/score/ShareScore';
import { getPublicScoreById } from '@/lib/db/score-repo';
import { shareText } from '@/lib/health-score/share';
import { SITE_URL } from '@/lib/constants';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = await getPublicScoreById(id).catch(() => null);
  const title = s ? `Money Health Score: ${s.totalScore}/900 (${s.band})` : 'Money Health Score';
  const og = `${SITE_URL}/og/score/${id}`;
  return {
    title,
    description: 'See this Money Health Score and calculate your own - free, no login.',
    openGraph: { title, images: [{ url: og, width: 1200, height: 630 }], type: 'website' },
    twitter: { card: 'summary_large_image', title, images: [og] },
    robots: { index: false }, // per-result page, not for indexing
  };
}

/** Public summary: score, band and the three generic fixes only. No rupee amounts or inputs. */
export default async function PublicScorePage({ params }: { params: Promise<{ id: string }> }): Promise<React.ReactElement> {
  const { id } = await params;
  const s = await getPublicScoreById(id).catch(() => null);
  if (!s) notFound();

  return (
    <div className="container-main py-10 max-w-2xl">
      <div className="card text-center">
        <ScoreGauge score={s.totalScore} band={s.band} />
        <p className="text-gray-600 mt-2">A Money Health Score on Paisa Reality</p>

        <div className="mt-6 text-left">
          <h2 className="heading-3 mb-2">Top things to improve</h2>
          <ul className="space-y-2">
            {s.topActions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-700 font-semibold">+{a.pointsRecoverable}</span><span>{a.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="/score" className="btn-primary no-underline">Calculate my own score</Link>
          <ShareScore text={shareText(s.totalScore)} />
        </div>
        <p className="text-xs text-gray-400 mt-4">Educational only, not financial advice. No personal financial details are shown on this page.</p>
      </div>
    </div>
  );
}
