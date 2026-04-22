'use client';

import Script from 'next/script';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: () => void;
  theme: { color: string };
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): { open: () => void };
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export default function PricingActions(): React.ReactElement {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [message, setMessage] = useState('');

  const startCheckout = useCallback(async (plan: 'monthly' | 'yearly'): Promise<void> => {
    setLoadingPlan(plan);
    setMessage('');

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json() as {
        success: boolean;
        error?: string;
        key?: string;
        order?: { id: string; amount: number; currency: string };
      };

      if (!data.success || !data.order || !data.key) {
        setMessage(data.error ?? 'Unable to start payment. Please try again.');
        return;
      }

      if (!window.Razorpay) {
        setMessage('Payment checkout is still loading. Please try again in a moment.');
        return;
      }

      const checkout = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Paisa Reality Premium',
        description: plan === 'yearly' ? 'Yearly plan' : 'Monthly plan',
        order_id: data.order.id,
        handler: () => {
          setMessage('Payment received. Your premium access will activate shortly.');
          router.refresh();
        },
        theme: { color: '#007A78' },
      });

      checkout.open();
    } catch {
      setMessage('Could not connect to payment checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  }, [router]);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="space-y-3">
        <button
          type="button"
          className="btn-primary w-full"
          disabled={loadingPlan !== null}
          onClick={() => void startCheckout('monthly')}
        >
          {loadingPlan === 'monthly' ? 'Starting payment...' : 'Start Monthly Premium'}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={loadingPlan !== null}
          onClick={() => void startCheckout('yearly')}
        >
          {loadingPlan === 'yearly' ? 'Starting payment...' : 'Pay Yearly - Rs 999'}
        </button>
      </div>
      {message && <p className="text-xs text-center text-gray-600 mt-3">{message}</p>}
    </>
  );
}
