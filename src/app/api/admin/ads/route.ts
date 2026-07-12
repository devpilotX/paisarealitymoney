import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getAllAds, createAd, AD_TYPES, type AdType } from '@/lib/ads';

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function GET(): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ads = await getAllAds();
  return NextResponse.json({ success: true, ads });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const b = (await request.json()) as Record<string, unknown>;
    const name = str(b.name);
    const placement = str(b.placement);
    if (!name || !placement) {
      return NextResponse.json({ error: 'Name and placement are required' }, { status: 400 });
    }
    const type: AdType = (AD_TYPES as readonly string[]).includes(String(b.type)) ? (b.type as AdType) : 'image';
    const id = await createAd({
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
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create ad' }, { status: 500 });
  }
}
