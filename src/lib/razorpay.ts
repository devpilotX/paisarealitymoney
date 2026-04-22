import { createHmac, timingSafeEqual } from 'crypto';

interface RazorpayOrderOptions {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

function getConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export async function createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder | null> {
  const config = getConfig();
  if (!config) {
    console.warn('Razorpay keys not configured. Payment features are disabled.');
    return null;
  }

  try {
    const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: options.amount * 100,
        currency: options.currency ?? 'INR',
        receipt: options.receipt,
        notes: options.notes ?? {},
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Razorpay order creation failed:', error);
      return null;
    }

    const order = await response.json() as RazorpayOrder;
    return order;
  } catch (error) {
    console.error('Razorpay error:', error instanceof Error ? error.message : 'Unknown');
    return null;
  }
}

export function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const config = getConfig();
  if (!config) return false;

  try {
    const generated = createHmac('sha256', config.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return safeCompare(generated, signature);
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  try {
    const generated = createHmac('sha256', secret).update(body).digest('hex');
    return safeCompare(generated, signature);
  } catch {
    return false;
  }
}

function safeCompare(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export default { createOrder, verifySignature, verifyWebhookSignature };
