import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const signature = request.headers.get('x-razorpay-signature') ?? '';
    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
    }

    const body = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            status?: string;
            notes?: { userId?: string; plan?: string };
          };
        };
      };
    };

    if (body.event === 'payment.captured') {
      const payment = body.payload?.payment?.entity;
      if (!payment) return NextResponse.json({ status: 'ignored' });

      const userId = payment.notes?.userId;
      const plan = payment.notes?.plan ?? 'monthly';

      if (userId && Number.isInteger(Number.parseInt(userId, 10))) {
        const expiresAt = new Date();
        if (plan === 'yearly') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        else expiresAt.setMonth(expiresAt.getMonth() + 1);

        await execute(
          'UPDATE users SET plan = ?, plan_expires_at = ?, razorpay_customer_id = ? WHERE id = ?',
          ['premium', expiresAt, payment.id ?? '', parseInt(userId, 10)]
        );
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
