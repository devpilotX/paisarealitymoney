import { NextRequest, NextResponse } from 'next/server';
import { secretMatches } from '@/lib/secret-compare';
import { runLinkBatch } from '@/lib/official-links';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

/**
 * Checks a batch of official scheme and scholarship links. Called by n8n every hour,
 * 30 at a time (Cloudflare ends requests after 100 seconds); each record is due once
 * a day, so the whole catalogue is covered daily.
 * Bearer CRON_SECRET only (never the query string, to keep it out of logs).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secretMatches(bearer, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 30, 1), 60);
  try {
    const result = await runLinkBatch(limit);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
