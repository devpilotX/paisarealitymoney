import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { secretMatches } from '@/lib/secret-compare';
import { publishWeeklyWrap } from '@/lib/market-wrap';
import { getAppUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Publishes (or refreshes) this week's price wrap on /newsletter. Called by n8n on
 * Sunday evening. Emailing subscribers is a separate step the owner approves from
 * Telegram (/api/cron/weekly-wrap/email). Bearer CRON_SECRET only.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secretMatches(bearer, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const wrap = await publishWeeklyWrap();
    if (!wrap) return NextResponse.json({ success: true, skipped: 'not enough price history for a full week' });
    revalidatePath('/newsletter');
    revalidatePath(`/newsletter/${wrap.slug}`);
    revalidatePath('/sitemap.xml');
    return NextResponse.json({ success: true, slug: wrap.slug, title: wrap.title, url: `${getAppUrl()}/newsletter/${wrap.slug}` });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
