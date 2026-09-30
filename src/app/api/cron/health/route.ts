import { NextRequest, NextResponse } from 'next/server';
import { secretMatches } from '@/lib/secret-compare';
import { gatherHealth } from '@/lib/data-health';

export const dynamic = 'force-dynamic';

/** Daily data-health report for n8n. Bearer CRON_SECRET only. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secretMatches(bearer, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await gatherHealth());
  } catch (e) {
    return NextResponse.json({ ok: false, issues: [{ level: 'fix', text: 'Health check failed: ' + (e instanceof Error ? e.message : 'error') }] }, { status: 500 });
  }
}
