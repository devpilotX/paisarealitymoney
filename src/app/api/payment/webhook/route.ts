import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
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

      if (userId) {
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
