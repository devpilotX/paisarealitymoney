import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { checkUpload } from '@/lib/upload-core';
import { saveUpload } from '@/lib/uploads';

export const runtime = 'nodejs';

/** POST multipart/form-data with field "file". Returns { url: "/media/..." }. Admin only. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    const check = checkUpload(data);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const url = await saveUpload(data, check.kind, file.name || null);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('upload failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Upload failed. Try a smaller image.' }, { status: 500 });
  }
}
