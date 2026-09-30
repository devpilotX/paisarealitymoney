import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import PricingActions from '@/components/PricingActions';
import { pageMetadata } from '@/lib/seo';
import { ALERT_LIMITS } from '@/lib/price-alerts-core';
import { PLAN_PRICES_INR } from '@/lib/razorpay';

export const metadata = pageMetadata({
  title: 'Pricing: Free, With an Optional Ad-Free Plan',
  description: 'Everything on Paisa Reality is free. Premium removes ads and raises the price alert limit. One-time payment through Razorpay, no auto-renewal.',
  path: '/pricing',
});

const FREE = [
  'Daily gold, silver, petrol, diesel and LPG prices',
  'Scheme, scholarship and startup grant finders',
  'Every calculator and smart tool',
  'Bank rate comparison',
  'Saved schemes and the application tracker',
  `${ALERT_LIMITS.free} active price alerts`,
];

const PREMIUM = [
  'Everything in Free',
  'No ads on any page',
  `${ALERT_LIMITS.premium} active price alerts`,
  'Supports keeping the site independent',
];

const FAQS = [
  { question: 'Is anything locked behind Premium?', answer: 'No information is. Every price, scheme, scholarship, grant, calculator and tool is free, with or without an account. Premium only removes ads and lets you keep more price alerts running at once.' },
  { question: 'Does Premium renew automatically?', answer: `No. You pay once for a month (Rs ${PLAN_PRICES_INR.monthly}) or a year (Rs ${PLAN_PRICES_INR.yearly}). When the period ends your account goes back to the free plan, and nothing is charged again unless you choose to pay.` },
  { question: 'How do I pay?', answer: 'Through Razorpay, with UPI, cards, net banking or wallets. Your card or UPI details go to Razorpay, not to us.' },
  { question: 'What if I pay again before my plan ends?', answer: 'The new period is added on top of the time you have left, so you never lose days.' },
];

export default function PricingPage(): React.ReactElement {
  return (
    <div className="container-main py-8">
      <Breadcrumb items={[{ label: 'Pricing' }]} />
      <div className="text-center max-w-2xl mx-auto mt-4">
        <h1 className="heading-1">Free to use. Premium if you want it ad-free.</h1>
        <p className="mt-4 text-lg text-muted">Ads keep Paisa Reality free. If you would rather not see them, Premium turns them off.</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <div className="card-flat !p-8 flex flex-col">
          <h2 className="heading-3">Free</h2>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.02em]">Rs 0</p>
          <p className="text-sm text-muted-2">No card needed</p>
          <ul className="mt-6 space-y-3 flex-1">
            {FREE.map((f) => (
              <li key={f} className="flex gap-3 text-[15px]"><span className="text-navy" aria-hidden="true">&#10003;</span>{f}</li>
            ))}
          </ul>
          <Link href="/signup" className="btn-secondary mt-8">Create a free account</Link>
        </div>

        <div className="card-flat !p-8 border-navy flex flex-col">
          <h2 className="heading-3">Premium</h2>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.02em]">Rs {PLAN_PRICES_INR.monthly}<span className="text-base font-normal text-muted"> a month</span></p>
          <p className="text-sm text-muted-2">or Rs {PLAN_PRICES_INR.yearly} for a year, paid once</p>
          <ul className="mt-6 space-y-3 flex-1">
            {PREMIUM.map((f) => (
              <li key={f} className="flex gap-3 text-[15px]"><span className="text-navy" aria-hidden="true">&#10003;</span>{f}</li>
            ))}
          </ul>
          <div className="mt-8"><PricingActions /></div>
          <p className="mt-3 text-[13px] text-center text-muted-2">Does not renew on its own.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-10"><FAQ items={FAQS} /></div>
    </div>
  );
}
