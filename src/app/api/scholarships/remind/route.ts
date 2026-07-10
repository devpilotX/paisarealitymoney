import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getScholarshipBySlug, addScholarshipReminder } from '@/lib/scholarships';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email().max(320),
  slug: z.string().min(1).max(120),
  daysBefore: z.number().int().min(1).max(60).optional().default(7),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { email, slug, daysBefore } = parsed.data;

  try {
    const scholarship = await getScholarshipBySlug(slug);
    if (!scholarship) {
      return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 });
    }
    await addScholarshipReminder(email, scholarship.id, daysBefore);
    const message = scholarship.deadline
      ? `Done. We will email you about ${daysBefore} days before the deadline.`
      : 'Saved. We will email you once the deadline is announced and is near.';
    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json(
      { error: 'Could not save the reminder. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
