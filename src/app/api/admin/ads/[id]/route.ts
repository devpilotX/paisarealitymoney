import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAdById, updateAd, deleteAd } from '@/lib/ads';
import { validateAd } from '@/lib/ads-constants';

interface Ctx { params: Promise<{ id: string }>; }

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = parseId((await params).id);
  const ad = id ? await getAdById(id) : null;
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, ad });
}

export async function PUT(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = parseId((await params).id);
    if (!id || !(await getAdById(id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const v = validateAd((await request.json()) as Record<string, unknown>);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    await updateAd(id, v.value);
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ad update failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await deleteAd(id);
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ad delete failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
  }
}
