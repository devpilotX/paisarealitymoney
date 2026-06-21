import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Disclaimer - Paisa Reality',
  description: 'Important disclaimer about information on Paisa Reality. We are an informational website, not a financial advisor.',
  alternates: { canonical: 'https://paisareality.com/disclaimer' },
};

export default function DisclaimerPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Disclaimer' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-2">Disclaimer</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 21 June 2026.</p>

        <div className="space-y-8">
          <section>
            <h2 className="heading-2 mb-2">General</h2>
            <p className="text-body">Paisa Reality (paisareality.com) is a free informational website. Everything here is for general information only. Nothing on this website is financial advice, investment advice, tax advice, or legal advice.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">We are not financial advisors</h2>
            <p className="text-body">Paisa Reality is not registered with SEBI, IRDA, AMFI, or any other financial regulatory body. We do not recommend buying, selling, or holding any financial product. Before making any financial decision, consult a qualified professional who understands your personal situation.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Prices</h2>
            <p className="text-body">Gold, silver, petrol, diesel, and LPG prices shown here are indicative. They come from public data sources and may not match the exact price at your local shop or pump.</p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Gold and silver prices differ from jeweller prices due to making charges and purity.</li>
              <li>Fuel prices may vary slightly at individual stations.</li>
              <li>LPG prices change on the 1st of each month and vary by state.</li>
            </ul>
            <p className="text-body mt-2">Always confirm the actual price before making a purchase.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Government schemes</h2>
            <p className="text-body">Scheme details come from official government sources (myscheme.gov.in, ministry websites). However:</p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Rules and eligibility can change without notice.</li>
              <li>Our scheme finder shows likely matches, not guaranteed eligibility.</li>
              <li>We cannot help you apply. Visit the official portal or your nearest government office.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Calculators and Smart Tools</h2>
            <p className="text-body">Our calculators and Smart Tools use standard financial formulas and simulation models. Results are estimates based on what you enter. Actual outcomes depend on market conditions, fees, taxes, and other factors we cannot predict. Do not rely solely on calculator results for important decisions.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Bank rates</h2>
            <p className="text-body">Bank rates shown are sourced from official bank websites. Banks change rates frequently. The rate you actually get may differ based on your relationship with the bank, loan amount, credit score, and other factors. Always confirm with the bank directly.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">External links</h2>
            <p className="text-body">We link to government portals, bank websites, and other external sites for your convenience. We do not control those websites and are not responsible for their content or accuracy.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">No guarantees</h2>
            <p className="text-body">We make every effort to be accurate, but we cannot guarantee that all information is correct, complete, or current at all times. Use this website at your own risk. We are not liable for any loss or damage from using information on this site.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Contact</h2>
            <p className="text-body">Found something wrong? Email <a href="mailto:connect@paisareality.com" className="text-primary hover:underline">connect@paisareality.com</a> and we will fix it.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
