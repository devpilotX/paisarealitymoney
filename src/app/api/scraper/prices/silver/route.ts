import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cacheGetOrFetch } from '@/lib/cache';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizeSlug } from '@/lib/sanitize';
import { RowDataPacket } from 'mysql2/promise';

interface SilverPriceRow extends RowDataPacket {
  city_name: string;
  city_slug: string;
  state: string;
  price_date: string;
  silver_per_gram: number;
  silver_per_kg: number;
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
      const cacheKey = `silver-${sanitized}-${days}`;
      const data = await cacheGetOrFetch<SilverPriceRow[]>('silver-prices', cacheKey, async () => {
        return query<SilverPriceRow[]>(
          `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
                  sp.price_date, sp.silver_per_gram, sp.silver_per_kg, sp.change_amount, sp.change_percent
           FROM silver_prices sp
           JOIN cities c ON sp.city_id = c.id
           WHERE c.slug = ?
           ORDER BY sp.price_date DESC LIMIT ?`,
          [sanitized, days]
        );
      }, { ttlMinutes: 15 });
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    const cacheKey = `silver-all-latest`;
    const data = await cacheGetOrFetch<SilverPriceRow[]>('silver-prices', cacheKey, async () => {
      return query<SilverPriceRow[]>(
        `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
                sp.price_date, sp.silver_per_gram, sp.silver_per_kg, sp.change_amount, sp.change_percent
         FROM silver_prices sp
         JOIN cities c ON sp.city_id = c.id
         WHERE sp.price_date = (SELECT MAX(price_date) FROM silver_prices)
         ORDER BY c.name`
      );
    }, { ttlMinutes: 15 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}