import { NextRequest, NextResponse } from 'next/server';
import { scrapeGoldPrices, scrapeSilverPrices, scrapeFuelPrices, scrapeLpgPrices } from '@/lib/scraper-prices';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

const VALID_TYPES = ['gold', 'silver', 'fuel', 'lpg', 'all'] as const;
type PriceType = typeof VALID_TYPES[number];

interface ScraperResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'scraper', RATE_LIMITS.scraper);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetIn);
  }

  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  const type = searchParams.get('type') as PriceType | null;

  const secretKey = process.env.SCRAPER_SECRET_KEY;
  if (!secretKey || key !== secretKey) {
    return NextResponse.json({ success: false, error: 'Invalid or missing API key.' }, { status: 401 });
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { success: false, error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const results: Record<string, ScraperResult> = {};

    if (type === 'gold' || type === 'all') {
      results.gold = await scrapeGoldPrices();
    }
    if (type === 'silver' || type === 'all') {
      results.silver = await scrapeSilverPrices();
    }
    if (type === 'fuel' || type === 'all') {
      results.fuel = await scrapeFuelPrices();
    }
    if (type === 'lpg' || type === 'all') {
      results.lpg = await scrapeLpgPrices();
    }

    const success = Object.values(results).every((result) => result.success);
    return NextResponse.json({ success, results }, { status: success ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scraper error';
    console.error('Scraper error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
