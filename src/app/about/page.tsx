import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';

export const metadata = pageMetadata({
  title: 'About Us: Who We Are and How We Work',
  description: 'Paisa Reality is a free financial information platform for India: daily prices, government schemes, calculators and bank rate comparison.',
  path: '/about',
});

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
            <li><strong>Daily prices</strong> for gold, silver, petrol and diesel in 50 cities, and LPG in every state, refreshed five times a day.</li>
            <li><strong>Government scheme finder.</strong> Answer a short set of questions and see which central and state schemes you are likely to qualify for.</li>
            <li><strong>Scholarships and startup grants.</strong> Government and private scholarships by class and income, and grants and programmes open to Indian founders, each checked on its official page.</li>
            <li><strong>Financial calculators.</strong> EMI, SIP, FD, PPF, income tax, home loan, plus advanced Smart Tools like retirement planning and debt optimization.</li>
            <li><strong>Bank rate comparison.</strong> FD, savings, home loan and personal loan rates for 51 banks side by side, each with the date it was checked.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="heading-2 mb-4">Where the data comes from</h2>
          <ul className="list-disc list-inside space-y-2 text-body">
            <li><strong>Gold and silver:</strong> computed from the international spot price and the USD to INR rate, with import duty and GST, then checked each day against published Indian dealer rates.</li>
            <li><strong>Petrol and diesel:</strong> the rates Indian Oil, BPCL and HPCL publish each morning.</li>
            <li><strong>LPG:</strong> the monthly cylinder rates the same oil companies publish.</li>
            <li><strong>Schemes, scholarships and grants:</strong> ministry and state department websites and the official scheme portals, linked on every page.</li>
            <li><strong>Bank rates:</strong> each bank&apos;s own website.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="heading-2 mb-4">How we keep this free</h2>
          <p className="text-body">
            Everything on Paisa Reality is free to use, with or without an account. The site is paid for by ads, through Google AdSense and a small number of clearly labelled sponsor slots. We do not sell your data, and no bank, insurer or scheme pays us to be listed or ranked.
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
