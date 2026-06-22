import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import crypto from 'crypto';

const EVENT_MAP: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.opened': 'opened',
};

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (secret) {
    const sig = request.headers.get('resend-signature');
    if (!verifySignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    console.warn('RESEND_WEBHOOK_SECRET not set. Accepting webhook without verification.');
  }

  try {
    const payload = JSON.parse(rawBody) as { type?: string; data?: { email_id?: string } };
    const eventType = payload.type || '';
    const resendId = payload.data?.email_id || '';
    const status = EVENT_MAP[eventType];

    if (status && resendId) {
      await execute('UPDATE email_logs SET status = $1 WHERE resend_id = $2', [status, resendId]);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }
}
