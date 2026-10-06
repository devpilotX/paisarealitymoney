import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { createOrder, isPremiumPlan, PLAN_PRICES_INR } from '@/lib/razorpay';
import { PAYMENTS_ENABLED } from '@/lib/payments';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Paid plans are switched off: everything is free, and no order can be created.
  if (!PAYMENTS_ENABLED) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const body = await request.json() as { plan?: string };
    const plan = body.plan ?? 'monthly';
    if (!isPremiumPlan(plan)) {
      return NextResponse.json({ success: false, error: 'Invalid plan selected.' }, { status: 400 });
    }

    const amount = PLAN_PRICES_INR[plan];

    const order = await createOrder({
      amount,
      receipt: `pr_${auth.user.userId}_${Date.now()}`,
      notes: { userId: String(auth.user.userId), plan },
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Payment system is not configured yet. Please try again later.',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Payment order error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ success: false, error: 'Could not start the payment. Please try again.' }, { status: 500 });
  }
}
