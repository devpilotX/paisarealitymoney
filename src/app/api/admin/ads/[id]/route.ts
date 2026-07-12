import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAdById, updateAd, deleteAd, AD_TYPES, type AdType } from '@/lib/ads';

interface Ctx { params: Promise<{ id: string }>; }

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function GET(_request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const ad = await getAdById(Number(id));
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, ad });
}

export async function PUT(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const numId = Number(id);
    const b = (await request.json()) as Record<string, unknown>;
    const name = str(b.name);
    const placement = str(b.placement);
    if (!name || !placement) {
      return NextResponse.json({ error: 'Name and placement are required' }, { status: 400 });
    }
    const type: AdType = (AD_TYPES as readonly string[]).includes(String(b.type)) ? (b.type as AdType) : 'image';
    await updateAd(numId, {
      name,
      placement,
      type,
      imageUrl: str(b.imageUrl),
      videoUrl: str(b.videoUrl),
      html: str(b.html),
      linkUrl: str(b.linkUrl),
      altText: str(b.altText),
      active: b.active === undefined ? true : Boolean(b.active),
      priority: Number.isFinite(Number(b.priority)) ? Number(b.priority) : 0,
      startsAt: str(b.startsAt),
      endsAt: str(b.endsAt),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update ad' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    await deleteAd(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete ad' }, { status: 500 });
  }
}
