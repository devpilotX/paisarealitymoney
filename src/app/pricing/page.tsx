import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Pricing - Paisa Reality Premium',
  description: 'Upgrade to Paisa Reality Premium for saved schemes, application tracker, email alerts, and ad-free experience.',
  alternates: { canonical: 'https://paisareality.com/pricing' },
};

const PRICING_FAQS = [
  { question: 'What do I get with the free plan?', answer: 'Everything on Paisa Reality is free: daily prices, scheme finder, all calculators, and bank rate comparisons. The free plan shows ads.' },
  { question: 'What extra features does Premium offer?', answer: 'Premium includes: save unlimited schemes, track applications, email alerts for new matching schemes, ad-free browsing, and priority support.' },
  { question: 'How do I pay?', answer: 'We accept all major payment methods through Razorpay: UPI, credit/debit cards, net banking, and wallets. Payment is secure and encrypted.' },
  { question: 'Can I cancel anytime?', answer: 'Yes. You can cancel your premium subscription anytime. Your premium features will remain active until the end of the billing period.' },
];

export default function PricingPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Pricing' }]} />
      <div className="text-center mb-12">
        <h1 className="heading-1 mb-3">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600">Everything is free. Premium adds extra convenience features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
          <p className="text-3xl font-bold text-gray-900 mb-4">Rs 0 <span className="text-base font-normal text-gray-500">forever</span></p>
          <ul className="space-y-3 mb-6">
            {['Daily gold, silver, fuel prices', 'Government scheme finder', 'All 10 financial calculators', 'Bank rate comparison', 'Blog articles'].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm"><span className="text-green-600 font-bold mt-0.5">\u2713</span>{f}</li>
            ))}
            {['Ads shown on pages'].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-400"><span>-</span>{f}</li>
            ))}
          </ul>
          <Link href="/signup" className="btn-secondary w-full no-underline text-center">Create Free Account</Link>
        </div>

        {/* Premium Plan */}
        <div className="card border-2 border-primary relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Popular</span>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Premium</h2>
          <p className="text-3xl font-bold text-primary mb-4">Rs 99 <span className="text-base font-normal text-gray-500">/ month</span></p>
          <ul className="space-y-3 mb-6">
            {['Everything in Free plan', 'Save unlimited schemes', 'Application status tracker', 'Email alerts for new schemes', 'Ad-free browsing', 'Priority email support', 'PDF export of scheme details'].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm"><span className="text-green-600 font-bold mt-0.5">\u2713</span>{f}</li>
            ))}
          </ul>
          <Link href="/signup" className="btn-primary w-full no-underline text-center">Start Premium</Link>
          <p className="text-xs text-center text-gray-500 mt-2">Cancel anytime. 7-day money back guarantee.</p>
        </div>
      </div>

      <FAQ items={PRICING_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}