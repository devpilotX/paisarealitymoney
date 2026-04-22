import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cacheGetOrFetch } from '@/lib/cache';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizeSlug } from '@/lib/sanitize';
import { RowDataPacket } from 'mysql2/promise';

interface GoldPriceRow extends RowDataPacket {
  city_name: string;
  city_slug: string;
  state: string;
  price_date: string;
  gold_24k_per_gram: number;
  gold_22k_per_gram: number;
  gold_18k_per_gram: number;
  gold_24k_per_10gram: number;
  gold_22k_per_10gram: number;
  change_amount: number;
  change_percent: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rateCheck = checkRateLimit(request, 'api', RATE_LIMITS.api);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.resetIn);
  }

  const searchParams = request.nextUrl.searchParams;
  const citySlug = searchParams.get('city');
  const days = Math.min(parseInt(searchParams.get('days') ?? '1', 10) || 1, 30);

  try {
    if (citySlug) {
      const sanitized = sanitizeSlug(citySlug);
      if (!sanitized) {
        return NextResponse.json({ success: false, error: 'Invalid city slug.' }, { status: 400 });
      }

      const cacheKey = `gold-${sanitized}-${days}`;
      const data = await cacheGetOrFetch<GoldPriceRow[]>('gold-prices', cacheKey, async () => {
        return query<GoldPriceRow[]>(
          `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
                  gp.price_date, gp.gold_24k_per_gram, gp.gold_22k_per_gram, gp.gold_18k_per_gram,
                  gp.gold_24k_per_10gram, gp.gold_22k_per_10gram, gp.change_amount, gp.change_percent
           FROM gold_prices gp
           JOIN cities c ON gp.city_id = c.id
           WHERE c.slug = ?
           ORDER BY gp.price_date DESC
           LIMIT ?`,
          [sanitized, days]
        );
      }, { ttlMinutes: 15 });

      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    const cacheKey = `gold-all-latest`;
    const data = await cacheGetOrFetch<GoldPriceRow[]>('gold-prices', cacheKey, async () => {
      return query<GoldPriceRow[]>(
        `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
                gp.price_date, gp.gold_24k_per_gram, gp.gold_22k_per_gram, gp.gold_18k_per_gram,
                gp.gold_24k_per_10gram, gp.gold_22k_per_10gram, gp.change_amount, gp.change_percent
         FROM gold_prices gp
         JOIN cities c ON gp.city_id = c.id
         WHERE gp.price_date = (SELECT MAX(price_date) FROM gold_prices)
         ORDER BY c.name`
      );
    }, { ttlMinutes: 15 });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Gold price API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, error: 'Price data is temporarily unavailable.' },
      { status: 503 }
    );
  }
}
