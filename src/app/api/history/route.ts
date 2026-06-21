/** GET /api/history - the caller's score time series (auth required). */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { getScoreHistory } from '@/lib/db/score-repo';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(request, 'history', RATE_LIMITS.api);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse('Sign in to see your score history.');

  try {
    const history = await getScoreHistory(String(auth.user.userId));
    return NextResponse.json({ success: true, history }, { status: 200 });
  } catch (err) {
    console.error('history fetch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: 'Could not load your history right now.' }, { status: 500 });
  }
}
