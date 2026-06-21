/**
 * POST /api/snapshot - auth optional. Validates, computes, persists an immutable snapshot + score,
 * and returns the new score id (used to deep-link the share card). Sets the anon cookie if new.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { scoreInputSchema } from '@/lib/health-score/validation';
import { computeScore } from '@/lib/health-score/score';
import { saveScore, type ScoreSource } from '@/lib/db/score-repo';
import { resolveIdentity, anonCookieOptions } from '@/lib/db/identity';

const bodySchema = scoreInputSchema.extend({
  source: z.string().regex(/^(onboarding|tool:[a-z0-9_-]+)$/).default('onboarding'),
  taxRegime: z.enum(['old', 'new']).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(request, 'snapshot', RATE_LIMITS.api);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return NextResponse.json({ success: false, error: i ? `${i.path.join('.') || 'body'}: ${i.message}` : 'Invalid input.' }, { status: 400 });
  }

  const { source, taxRegime, ...input } = parsed.data;
  const result = computeScore(input);
  const { identity, setAnonCookie } = resolveIdentity(request);

  try {
    const { scoreId } = await saveScore(input, result, identity, source as ScoreSource, { taxRegime });
    const res = NextResponse.json({ success: true, scoreId, totalScore: result.totalScore, band: result.band }, { status: 200 });
    if (setAnonCookie) res.cookies.set({ ...anonCookieOptions(), value: identity.anonId });
    return res;
  } catch (err) {
    console.error('snapshot save failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: 'Could not save your score right now. Please try again.' }, { status: 500 });
  }
}
