import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cacheGetOrFetch } from '@/lib/cache';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sanitizeSlug } from '@/lib/sanitize';
import { RowDataPacket } from 'mysql2/promise';

interface FuelPriceRow extends RowDataPacket {
  city_name: string;
  city_slug: string;
  state: string;
  price_date: string;
  petrol_price: number;
  diesel_price: number;
  petrol_change: number;
  diesel_change: number;
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
      const cacheKey = `diesel-${sanitized}-${days}`;
      const data = await cacheGetOrFetch<FuelPriceRow[]>('diesel-prices', cacheKey, async () => {
        return query<FuelPriceRow[]>(
          `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
                  fp.price_date, fp.petrol_price, fp.diesel_price, fp.petrol_change, fp.diesel_change
           FROM fuel_prices fp
           JOIN cities c ON fp.city_id = c.id
           WHERE c.slug = ?
           ORDER BY fp.price_date DESC LIMIT ?`,
          [sanitized, days]
        );
      }, { ttlMinutes: 15 });
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    const cacheKey = `diesel-all-latest`;
    const data = await cacheGetOrFetch<FuelPriceRow[]>('diesel-prices', cacheKey, async () => {
      return query<FuelPriceRow[]>(
        `SELECT c.name AS city_name, c.slug AS city_slug, c.state,
                fp.price_date, fp.petrol_price, fp.diesel_price, fp.petrol_change, fp.diesel_change
         FROM fuel_prices fp
         JOIN cities c ON fp.city_id = c.id
         WHERE fp.price_date = (SELECT MAX(price_date) FROM fuel_prices)
         ORDER BY c.name`
      );
    }, { ttlMinutes: 15 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Diesel price API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, error: 'Price data is temporarily unavailable.' },
      { status: 503 }
    );
  }
}
