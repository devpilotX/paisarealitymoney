import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllAds, createAd } from '@/lib/ads';
import { validateAd } from '@/lib/ads-constants';

export async function GET(): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ads = await getAllAds();
  return NextResponse.json({ success: true, ads });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const v = validateAd((await request.json()) as Record<string, unknown>);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const id = await createAd(v.value);
    // Pages are statically cached; refresh them so the new creative appears without a deploy.
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('ad create failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}
