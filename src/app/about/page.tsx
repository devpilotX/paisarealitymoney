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

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-6">About Paisa Reality</h1>

        <AdBanner format="horizontal" />

        <div className="space-y-6 mt-6">
          <p className="text-body">
            Paisa Reality is a free financial information website built for Indians. We put all your everyday money information in one place so you do not have to hunt across ten different websites.
          </p>

          <h2 className="heading-2">What we do</h2>
          <p className="text-body">We cover four things:</p>
          <ul className="list-disc list-inside space-y-2 text-body">
            <li><strong>Daily prices</strong> for gold, silver, petrol, diesel, and LPG across 50+ Indian cities. Updated every day.</li>
            <li><strong>Government scheme finder.</strong> You fill a simple form. We show you the central and state schemes you likely qualify for.</li>
            <li><strong>Financial calculators.</strong> EMI, SIP, FD, PPF, income tax, home loan, plus advanced Smart Tools like retirement planning and debt optimization.</li>
            <li><strong>Bank rate comparison.</strong> FD rates, savings account rates, home loan rates, and personal loan rates across 50+ banks side by side.</li>
          </ul>

          <h2 className="heading-2">Where our data comes from</h2>
          <ul className="list-disc list-inside space-y-2 text-body">
            <li>Gold and silver: Indian Bullion and Jewellers Association (IBJA) and commodity exchanges.</li>
            <li>Petrol and diesel: IOCL, BPCL, and HPCL daily price feeds.</li>
            <li>LPG: Oil marketing companies.</li>
            <li>Government schemes: myscheme.gov.in, ministry websites, official gazettes.</li>
            <li>Bank rates: Official bank websites and RBI publications.</li>
          </ul>

          <h2 className="heading-2">How we make money</h2>
          <p className="text-body">
            Paisa Reality is free for everyone. We earn revenue through advertisements (Google AdSense) displayed on the website. We do not charge users, sell data, or take commissions from any bank or scheme.
          </p>

          <h2 className="heading-2">What we are not</h2>
          <p className="text-body">
            We are not financial advisors. We are not registered with SEBI or any regulatory body. We do not recommend any financial product. Everything on this website is for information only. Always verify with official sources and talk to a qualified advisor before making money decisions.
          </p>

          <h2 className="heading-2">Get in touch</h2>
          <p className="text-body">
            Found an error? Have a suggestion? Want to say hello? Visit our <Link href="/contact" className="text-primary hover:underline">Contact page</Link> or email us at <a href="mailto:connect@paisareality.com" className="text-primary hover:underline">connect@paisareality.com</a>.
          </p>
        </div>
      </article>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
