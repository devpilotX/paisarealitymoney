import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { createOrder } from '@/lib/razorpay';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = authenticateRequest(request);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);

  try {
    const body = await request.json() as { plan?: string };
    const plan = body.plan ?? 'monthly';
    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json({ success: false, error: 'Invalid plan selected.' }, { status: 400 });
    }

    const amount = plan === 'yearly' ? 999 : 99;

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
