import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { verifyWebhookSignature, isPremiumPlan, PLAN_PRICES_INR } from '@/lib/razorpay';

interface CapturedPayment {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  notes?: { userId?: string; plan?: string };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const signature = request.headers.get('x-razorpay-signature') ?? '';
    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
    }

    const body = JSON.parse(rawBody) as { event?: string; payload?: { payment?: { entity?: CapturedPayment } } };
    if (body.event !== 'payment.captured') return NextResponse.json({ status: 'ignored' });

    const payment = body.payload?.payment?.entity;
    const userId = Number.parseInt(payment?.notes?.userId ?? '', 10);
    const plan = payment?.notes?.plan;
    if (!payment || !Number.isInteger(userId) || userId <= 0 || !isPremiumPlan(plan)) {
      return NextResponse.json({ status: 'ignored' });
    }

    // Grant only what was paid for: the amount (in paise) and currency must match the plan.
    const expectedPaise = PLAN_PRICES_INR[plan] * 100;
    if (payment.currency !== 'INR' || payment.amount !== expectedPaise) {
      console.error(`Webhook amount mismatch for payment ${payment.id}: got ${payment.amount} ${payment.currency}, expected ${expectedPaise} INR`);
      return NextResponse.json({ status: 'amount_mismatch' });
    }

    // Renewals extend from the current expiry when it is still in the future.
    // The payment id check makes a redelivered webhook a no-op.
    const period = plan === 'yearly' ? '1 year' : '1 month';
    await execute(
      `UPDATE users
          SET plan = 'premium',
              plan_expires_at = GREATEST(COALESCE(plan_expires_at, now()), now()) + $1::interval,
              razorpay_customer_id = $2
        WHERE id = $3
          AND razorpay_customer_id IS DISTINCT FROM $2`,
      [period, payment.id ?? '', userId]
    );

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
