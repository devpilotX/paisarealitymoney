import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { sendContactNotification } from '@/lib/email';
import { sanitizeString, sanitizeEmail } from '@/lib/sanitize';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = sanitizeString(body.name);
    const email = sanitizeEmail(body.email);
    const message = sanitizeString(body.message);

    if (!name || name.length < 2) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    if (!email) return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    if (!message || message.length < 5) return NextResponse.json({ error: 'Message is required.' }, { status: 400 });

    await execute(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );

    // Best-effort email - do not block on failure
    sendContactNotification(name, email, message).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
