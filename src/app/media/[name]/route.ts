import { NextResponse } from 'next/server';
import { parseMediaName } from '@/lib/upload-core';
import { getUpload } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Serves an uploaded image. Files never change once uploaded, so they are cached for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }): Promise<Response> {
  const parsed = parseMediaName((await params).name);
  if (!parsed) return new NextResponse('Not found', { status: 404 });
  try {
    const file = await getUpload(parsed.id, parsed.token);
    if (!file) return new NextResponse('Not found', { status: 404 });
    return new Response(new Uint8Array(file.data), {
      headers: {
        'Content-Type': file.mime,
        'Content-Length': String(file.data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    console.error('media read failed:', error instanceof Error ? error.message : error);
    return new NextResponse('Unavailable', { status: 503 });
  }
}
