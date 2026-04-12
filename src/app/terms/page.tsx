import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Terms of Service - Paisa Reality',
  description:
    'Read the terms of service for using Paisa Reality. By accessing our website, you agree to these terms.',
  alternates: {
    canonical: 'https://paisareality.com/terms',
  },
};

export default function TermsPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Terms of Service' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: April 2026</p>

        <AdBanner format="horizontal" />

        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="heading-2 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p className="text-body">
              By accessing and using Paisa Reality (paisareality.com), you agree to these terms of service. If you do not agree with any part of these terms, please do not use the website.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">2. What This Website Does</h2>
            <p className="text-body">
              Paisa Reality is an informational website that provides daily commodity prices (gold, silver, petrol, diesel, LPG), government scheme information, financial calculators, and bank rate comparisons. All content is for informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">3. Not Financial Advice</h2>
            <p className="text-body">
              The information on this website does not constitute financial, investment, tax, or legal advice. Paisa Reality is not a registered financial advisor. Do not make financial decisions based solely on information from this website. Always consult a qualified financial professional and verify data with official sources.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">4. Accuracy of Information</h2>
            <p className="text-body">
              We make every effort to provide accurate and up-to-date information. However, we cannot guarantee that all prices, rates, scheme details, or calculator results are 100% accurate at all times. Data may be delayed, incomplete, or may have changed since the last update. Prices shown are indicative and may differ from actual market prices.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">5. User Accounts</h2>
            <p className="text-body">
              If you create an account on Paisa Reality, you are responsible for keeping your login details safe. You must provide accurate information when signing up. We reserve the right to suspend or delete accounts that violate these terms or are used for fraudulent purposes.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">6. Acceptable Use</h2>
            <p className="text-body">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Use automated tools to scrape or download large amounts of data from the website without permission.</li>
              <li>Attempt to hack, disrupt, or overload the website or its servers.</li>
              <li>Use the website for any illegal purpose.</li>
              <li>Copy, reproduce, or redistribute our content without attribution.</li>
              <li>Create fake accounts or misrepresent your identity.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">7. Intellectual Property</h2>
            <p className="text-body">
              All original content on Paisa Reality, including text, design, code, and graphics, is owned by Paisa Reality. You may share links to our pages and quote small portions of our content with proper attribution. You may not copy entire pages or large sections without written permission.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">8. Third-Party Links</h2>
            <p className="text-body">
              Our website may contain links to official government websites, bank websites, and other external sites. We are not responsible for the content, accuracy, or privacy practices of these external websites.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">9. Advertisements</h2>
            <p className="text-body">
              Paisa Reality displays advertisements through Google AdSense. These ads are served by Google and are subject to Google's advertising policies. We do not control which specific ads are shown. The presence of an ad does not mean we endorse the advertised product or service.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">10. Limitation of Liability</h2>
            <p className="text-body">
              Paisa Reality and its team shall not be held liable for any losses, damages, or expenses that arise from using this website or relying on information provided here. This includes but is not limited to financial losses from investment decisions, missed scheme deadlines, or incorrect calculator results.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">11. Changes to Terms</h2>
            <p className="text-body">
              We may update these terms from time to time. Changes will be posted on this page with an updated date. Continued use of the website after changes means you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">12. Governing Law</h2>
            <p className="text-body">
              These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">13. Contact</h2>
            <p className="text-body">
              If you have questions about these terms, email us at{' '}
              <a href="mailto:contact@paisareality.com" className="link-internal">contact@paisareality.com</a>.
            </p>
          </section>
        </div>
      </article>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}