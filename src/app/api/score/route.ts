/**
 * POST /api/score - pure compute, no auth, no DB. Identical scoring to the client.
 * Body: ScoreInput -> { totalScore, band, pillars, topActions }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { parseScoreInput } from '@/lib/health-score/validation';
import { computeScore } from '@/lib/health-score/score';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(request, 'score', RATE_LIMITS.api);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseScoreInput(body);
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.message }, { status: 400 });

  const result = computeScore(parsed.value);
  return NextResponse.json({ success: true, ...result }, { status: 200 });
}
