import { pageMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for using Paisa Reality. Read our acceptable use policy, limitations, and governing law.',
  path: '/terms',
});

export default function TermsPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Terms of Service' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-4">Terms of Service</h1>
        <p className="text-body text-sm text-gray-500 mb-6">Last updated: June 2026</p>

        <div className="space-y-6 text-body">
          <section>
            <h2 className="heading-2 mb-2">Agreement</h2>
            <p>By using Paisa Reality (paisareality.com), you agree to these terms. If you do not agree, please stop using the site.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">What this site provides</h2>
            <p>Paisa Reality provides financial information, daily commodity prices, government scheme data, calculators, and bank rate comparisons for educational purposes only. This is not financial advice, investment advice, tax advice, or legal advice. See our Disclaimer page for full details.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Acceptable use</h2>
            <p>You may use this site for personal, non-commercial information purposes. You may not:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Scrape, crawl, or systematically download data from this site without written permission.</li>
              <li>Use the site to send spam, phishing, or malicious content.</li>
              <li>Attempt to gain unauthorized access to any part of the site, user accounts, or our servers.</li>
              <li>Reproduce, redistribute, or sell our content, tools, or data without permission.</li>
              <li>Use the site in any way that violates Indian law.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">User accounts</h2>
            <p>If you create an account, you are responsible for keeping your login credentials safe. You are responsible for all activity under your account. Use a strong password and do not share it. If you think someone else has accessed your account, reset your password immediately and contact us.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Accuracy and availability</h2>
            <p>We try to keep the site accurate and available, but we cannot guarantee either. Prices change daily, schemes get revised, and technical issues happen. We may update, change, or remove content at any time without notice.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Intellectual property</h2>
            <p>The site design, code, tools, calculators, and original written content on Paisa Reality are our intellectual property. Government scheme data and commodity prices are sourced from public official sources. You may share links to our pages. You may not copy or republish our content without permission.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Third-party services</h2>
            <p>We use third-party services including Google AdSense (advertising), Google Analytics (usage tracking), and Resend (email delivery). These services have their own terms and privacy policies.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Limitation of liability</h2>
            <p>Paisa Reality is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, we are not liable for any direct, indirect, incidental, or consequential damages arising from your use of this site, including financial losses from decisions made based on information found here.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Governing law</h2>
            <p>These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of courts in India.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Changes to these terms</h2>
            <p>We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:connect@paisareality.com" className="link-internal">connect@paisareality.com</a>.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
