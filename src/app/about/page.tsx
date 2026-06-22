import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'About Us - Paisa Reality | Free Financial Information for India',
  description: 'Paisa Reality is a free financial information platform for India. Daily prices, government schemes, calculators, and bank rate comparison. Learn who we are and what we do.',
  alternates: { canonical: 'https://paisareality.com/about' },
};

export default function AboutPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'About Us' }]} />

      <div className="max-w-3xl">
        <h1 className="heading-1 mb-4">About Paisa Reality</h1>

        <p className="text-body text-lg mb-8">
          Paisa Reality started with a simple frustration. Checking five different apps just to find today&apos;s gold rate or to compare FD interest across banks. So we put all of it in one place. Free, with no sign-up walls. That is what Paisa Reality is. A single website where you get your daily money information without the noise.
        </p>

        <AdBanner format="horizontal" className="mb-8" />

        <section className="mb-8">
          <h2 className="heading-2 mb-4">What you will find here</h2>
          <ul className="list-disc list-inside space-y-3 text-body">
            <li><strong>Daily prices</strong> for gold, silver, petrol, diesel, and LPG across 50+ Indian cities, updated every day.</li>
            <li><strong>Government scheme finder.</strong> Fill a short form and see which central and state schemes you likely qualify for.</li>
            <li><strong>Financial calculators.</strong> EMI, SIP, FD, PPF, income tax, home loan, plus advanced Smart Tools like retirement planning and debt optimization.</li>
            <li><strong>Bank rate comparison.</strong> FD rates, savings account rates, home loan rates, and personal loan rates across 50+ banks, side by side.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="heading-2 mb-4">Where the data comes from</h2>
          <ul className="list-disc list-inside space-y-2 text-body">
            <li><strong>Gold and silver:</strong> Indian Bullion and Jewellers Association (IBJA) and commodity exchanges.</li>
            <li><strong>Petrol and diesel:</strong> IOCL, BPCL, and HPCL daily price feeds.</li>
            <li><strong>LPG:</strong> Oil marketing companies.</li>
            <li><strong>Government schemes:</strong> myscheme.gov.in, ministry websites, official gazettes.</li>
            <li><strong>Bank rates:</strong> Official bank websites and RBI publications.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="heading-2 mb-4">How we keep this free</h2>
          <p className="text-body">
            Paisa Reality is free for everyone. We earn revenue through advertisements (Google AdSense) on the site. We do not charge users, sell data, or take commissions from any bank or scheme. Your trust matters more than a quick buck.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="heading-2 mb-4">What this site is not</h2>
          <p className="text-body">
            Paisa Reality is not a financial advisor. This site is not registered with SEBI or any regulatory body. We do not recommend any financial product. Everything here is for information only. Always verify with official sources and talk to a qualified advisor before making money decisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="heading-2 mb-4">Say hello</h2>
          <p className="text-body">
            Found an error? Have a suggestion? Just want to chat? Visit the <Link href="/contact" className="link-internal">Contact page</Link> or email us at <a href="mailto:connect@paisareality.com" className="link-internal">connect@paisareality.com</a>. We read every message.
          </p>
        </section>

        <AdBanner format="horizontal" />
      </div>
    </div>
  );
}
