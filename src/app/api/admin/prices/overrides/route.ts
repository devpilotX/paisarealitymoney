import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/admin-auth';
import { execute, query } from '@/lib/db';
import { cacheClearAll } from '@/lib/cache';
import { updateFuelPricesLive, updateLpgPricesLive } from '@/lib/price-providers';
import { FUEL_BASELINE_AS_OF, FUEL_BASELINE_SOURCE } from '@/lib/fuel-data';
import type { QueryResultRow } from 'pg';

export const dynamic = 'force-dynamic';

interface OverrideRow extends QueryResultRow {
  id: number;
  commodity: string;
  region_key: string;
  payload: Record<string, number | null>;
  as_of: string;
  source: string;
  updated_at: string;
}

const overrideSchema = z.object({
  commodity: z.enum(['fuel', 'lpg']),
  regionKey: z.string().trim().min(2).max(100),
  payload: z
    .object({
      petrol: z.number().positive().max(500).optional(),
      diesel: z.number().positive().max(500).optional(),
      domestic: z.number().positive().max(5000).optional(),
      commercial: z.number().positive().max(10000).optional(),
    })
    .refine((p) => Object.values(p).some((v) => v !== undefined), {
      message: 'payload must contain at least one price component',
    }),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'asOf must be YYYY-MM-DD'),
  source: z.string().trim().min(3).max(300),
});

/** List overrides plus the compiled-in baseline provenance. */
export async function GET(): Promise<NextResponse> {
  const ok = await verifyAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await query<OverrideRow>(
      'SELECT id, commodity, region_key, payload, as_of::text AS as_of, source, updated_at::text AS updated_at FROM price_overrides ORDER BY commodity, region_key'
    );
    return NextResponse.json({
      baseline: { asOf: FUEL_BASELINE_AS_OF, source: FUEL_BASELINE_SOURCE },
      overrides: rows,
    });
  } catch {
    return NextResponse.json(
      { error: 'price_overrides table missing. Run: npm run db:migrate-price-integrity' },
      { status: 500 }
    );
  }
}

/** Upsert an override and refresh today's price rows immediately. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ok = await verifyAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = overrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { commodity, regionKey, payload, asOf, source } = parsed.data;

  try {
    await execute(
      `INSERT INTO price_overrides (commodity, region_key, payload, as_of, source, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (commodity, region_key) DO UPDATE SET
         payload = EXCLUDED.payload, as_of = EXCLUDED.as_of, source = EXCLUDED.source, updated_at = NOW()`,
      [commodity, regionKey, JSON.stringify(payload), asOf, source]
    );

    const refresh = commodity === 'fuel' ? await updateFuelPricesLive() : await updateLpgPricesLive();
    cacheClearAll();

    return NextResponse.json({ ok: true, refreshed: refresh.message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to save override: ${msg}` }, { status: 500 });
  }
}

/** Remove an override so the compiled baseline applies again. */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const ok = await verifyAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const commodity = request.nextUrl.searchParams.get('commodity');
  const regionKey = request.nextUrl.searchParams.get('regionKey');
  if ((commodity !== 'fuel' && commodity !== 'lpg') || !regionKey) {
    return NextResponse.json({ error: 'commodity (fuel|lpg) and regionKey are required' }, { status: 400 });
  }

  try {
    const res = await execute('DELETE FROM price_overrides WHERE commodity = $1 AND region_key = $2', [
      commodity,
      regionKey,
    ]);
    cacheClearAll();
    return NextResponse.json({ ok: true, deleted: res.rowCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to delete override: ${msg}` }, { status: 500 });
  }
}
