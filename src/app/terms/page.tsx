import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Terms of Service - Paisa Reality',
  description: 'Terms of service for using Paisa Reality. By using our website you agree to these terms.',
  alternates: { canonical: 'https://paisareality.com/terms' },
};

export default function TermsPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Terms of Service' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Effective date: 1 January 2025. Last updated: 21 June 2026.</p>

        <div className="space-y-8">
          <section>
            <h2 className="heading-2 mb-2">1. Agreement</h2>
            <p className="text-body">By using Paisa Reality (paisareality.com), you agree to these terms. If you do not agree, do not use the website.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">2. What this website is</h2>
            <p className="text-body">Paisa Reality is a free informational website. We provide daily commodity prices, government scheme information, financial calculators, and bank rate comparisons. All content is for informational purposes only.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">3. Not financial advice</h2>
            <p className="text-body">Nothing on this website is financial, investment, tax, or legal advice. We are not registered with SEBI or any regulatory body. Do not make financial decisions based only on information from this website. Always consult a qualified professional.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">4. Accuracy</h2>
            <p className="text-body">We try to keep everything accurate and up to date. However, prices can be delayed, scheme rules can change, and calculator results are estimates. We do not guarantee 100% accuracy at all times. Always verify with official sources.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">5. User accounts</h2>
            <p className="text-body">If you create an account, keep your login details safe. Give accurate information when signing up. We can suspend or delete accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">6. Things you must not do</h2>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li>Scrape or bulk-download data without written permission.</li>
              <li>Try to hack, overload, or disrupt the website.</li>
              <li>Use the website for anything illegal.</li>
              <li>Copy entire pages without attribution.</li>
              <li>Create fake accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">7. Our content</h2>
            <p className="text-body">All original content on Paisa Reality (text, design, code, graphics) is owned by us. You can share links and quote small parts with attribution. You cannot copy large sections without written permission.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">8. External links</h2>
            <p className="text-body">We link to government websites, banks, and other external sites. We are not responsible for their content, accuracy, or privacy practices.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">9. Advertisements</h2>
            <p className="text-body">We show ads through Google AdSense. These are served by Google and subject to Google's policies. An ad appearing on our site does not mean we endorse that product or service.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">10. Limitation of liability</h2>
            <p className="text-body">Paisa Reality is not liable for any losses or damages from using this website. This includes financial losses from investment decisions, missed scheme deadlines, or incorrect calculator results. Use at your own risk.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">11. Changes</h2>
            <p className="text-body">We may update these terms. Changes will be posted here with an updated date. Continuing to use the website after a change means you accept the new terms.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">12. Governing law</h2>
            <p className="text-body">These terms are governed by the laws of India. Disputes are subject to the jurisdiction of Indian courts.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">13. Contact</h2>
            <p className="text-body">Questions about these terms? Email <a href="mailto:connect@paisareality.com" className="text-primary hover:underline">connect@paisareality.com</a>.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
