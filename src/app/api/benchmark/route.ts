/** GET /api/benchmark?cohort=age:...|city:...|income:... - cohort percentiles, only if size >= 50. */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { getBenchmark } from '@/lib/db/benchmark-repo';

const COHORT_RE = /^age:(<25|25-30|31-40|41-50|51\+)\|city:(metro|tier1|tier2|tier3|unknown)\|income:(<5L|5-10L|10-25L|25L\+)$/;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(request, 'benchmark', RATE_LIMITS.api);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  const cohort = request.nextUrl.searchParams.get('cohort') ?? '';
  if (!COHORT_RE.test(cohort)) {
    return NextResponse.json({ success: false, error: 'Invalid cohort key.' }, { status: 400 });
  }
  try {
    const benchmark = await getBenchmark(cohort); // null when missing or < 50 people
    return NextResponse.json({ success: true, benchmark }, { status: 200 });
  } catch (err) {
    console.error('benchmark fetch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: 'Could not load benchmarks right now.' }, { status: 500 });
  }
}
