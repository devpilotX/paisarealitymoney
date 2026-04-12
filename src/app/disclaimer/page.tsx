import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Disclaimer - Paisa Reality',
  description:
    'Important disclaimer about the information provided on Paisa Reality. We are an informational website, not a financial advisor.',
  alternates: {
    canonical: 'https://paisareality.com/disclaimer',
  },
};

const DISCLAIMER_FAQS = [
  {
    question: 'Is Paisa Reality a financial advisor?',
    answer:
      'No. Paisa Reality is a free informational website. We provide data and tools to help you make informed decisions, but we do not offer financial, investment, or legal advice. Always consult a qualified professional before making financial decisions.',
  },
  {
    question: 'Are the gold and silver prices on Paisa Reality accurate?',
    answer:
      'Prices shown are indicative and sourced from publicly available data. They may not match the exact price offered by your local jeweller or dealer. Actual prices can vary based on making charges, purity, and local market conditions. Always confirm with the seller before making a purchase.',
  },
  {
    question: 'Can I apply for government schemes through Paisa Reality?',
    answer:
      'No. Paisa Reality only provides information about government schemes and helps you check your eligibility. To actually apply for a scheme, you must visit the official government website or the nearest government office. We provide links to official application portals where available.',
  },
];

export default function DisclaimerPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Disclaimer' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-6">Disclaimer</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: April 2026</p>

        <AdBanner format="horizontal" />

        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="heading-2 mt-8 mb-3">General Disclaimer</h2>
            <p className="text-body">
              Paisa Reality (paisareality.com) is a free informational website. All content, data, tools, and resources on this website are provided for general information purposes only. Nothing on this website should be considered as financial advice, investment advice, tax advice, or legal advice.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">Not a Financial Advisor</h2>
            <p className="text-body">
              Paisa Reality is not a registered financial advisor, investment advisor, tax consultant, or legal professional under the Securities and Exchange Board of India (SEBI) or any other regulatory body. We do not recommend buying, selling, or holding any financial product.
            </p>
            <p className="text-body mt-2">
              Before making any financial decision, including investments, loans, insurance, or government scheme applications, please consult with a qualified financial advisor who understands your personal financial situation.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">Price Information</h2>
            <p className="text-body">
              Gold, silver, petrol, diesel, and LPG prices shown on this website are indicative and sourced from publicly available information. These prices may not reflect the exact price in your specific location at the exact moment you check them.
            </p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Gold and silver prices may differ from actual jeweller prices due to making charges, purity variations, and local market conditions.</li>
              <li>Petrol and diesel prices are updated based on oil marketing company data but may have minor variations at individual fuel stations.</li>
              <li>LPG prices may change on the 1st of every month and may vary by state and distributor.</li>
            </ul>
            <p className="text-body mt-2">
              Always confirm prices with the actual seller, fuel station, or distributor before making a purchase.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">Government Scheme Information</h2>
            <p className="text-body">
              Government scheme details on this website are sourced from official government websites including myscheme.gov.in, ministry websites, and government gazettes. However:
            </p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Scheme details, eligibility criteria, and benefits may change without notice.</li>
              <li>Our eligibility matching is based on the criteria we have recorded and may not cover every condition or exception.</li>
              <li>Some state-level schemes may not be included in our database.</li>
              <li>Application deadlines and availability may have changed since we last verified the information.</li>
            </ul>
            <p className="text-body mt-2">
              Always verify scheme details and eligibility with the official government website or the nearest government office before applying.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">Calculator Results</h2>
            <p className="text-body">
              Financial calculators on this website (EMI, SIP, FD, PPF, tax, etc.) provide approximate results based on the inputs you provide and standard mathematical formulas. These results are for illustrative purposes only.
            </p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Actual EMI amounts may differ based on processing fees, insurance, and bank-specific terms.</li>
              <li>Tax calculations may not account for all deductions, exemptions, or recent changes in tax laws.</li>
              <li>Investment returns shown are projections and not guaranteed.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">Bank Rate Information</h2>
            <p className="text-body">
              Bank interest rates shown on this website are sourced from official bank websites. Rates change frequently and the rates shown may not be the latest. Always check the official bank website or visit your nearest bank branch for the most current rates and terms.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">External Links</h2>
            <p className="text-body">
              This website contains links to external websites including government portals, bank websites, and other resources. We are not responsible for the content, accuracy, privacy practices, or availability of these external websites.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">Limitation of Liability</h2>
            <p className="text-body">
              Paisa Reality, its owners, contributors, and affiliates shall not be held liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use of this website or reliance on any information provided here. This includes but is not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Financial losses from investment or purchase decisions.</li>
              <li>Missed deadlines for government scheme applications.</li>
              <li>Incorrect tax filing based on calculator results.</li>
              <li>Any decision made based on price data shown on this website.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">Contact</h2>
            <p className="text-body">
              If you find any incorrect information on our website, please report it to us at{' '}
              <a href="mailto:contact@paisareality.com" className="link-internal">contact@paisareality.com</a>.
              We take data accuracy seriously and will investigate and correct errors as quickly as possible.
            </p>
          </section>
        </div>

        <FAQ items={DISCLAIMER_FAQS} />
      </article>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}