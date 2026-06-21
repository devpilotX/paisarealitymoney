import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Privacy Policy - Paisa Reality',
  description: 'How Paisa Reality collects, uses, and protects your data. We use Google AdSense and Google Analytics. Your calculator data stays in your browser.',
  alternates: { canonical: 'https://paisareality.com/privacy' },
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective date: 1 January 2025. Last updated: 21 June 2026.</p>

        <div className="space-y-8">
          <section>
            <h2 className="heading-2 mb-2">1. Who we are</h2>
            <p className="text-body">Paisa Reality (paisareality.com) is operated by Dipanshu Kumar. This policy explains what data we collect, why, and how we protect it.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">2. Data you give us</h2>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li><strong>Account registration:</strong> Name, email, and password (stored encrypted).</li>
              <li><strong>Scheme finder:</strong> Age, gender, state, income, category, occupation. Used only to match you with relevant schemes.</li>
              <li><strong>Contact form:</strong> Name, email, and your message.</li>
              <li><strong>Health Score:</strong> Financial details you enter. These are processed in your browser. If you save your score, a snapshot is stored on our server linked to your account or an anonymous cookie.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">3. Data collected automatically</h2>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li><strong>Analytics:</strong> Pages visited, time on page, clicks (via Google Analytics 4).</li>
              <li><strong>Device info:</strong> Browser type, OS, screen size.</li>
              <li><strong>IP address:</strong> Used for approximate location (city level) and rate limiting. Not stored permanently.</li>
              <li><strong>Cookies:</strong> Functional cookies for login sessions and preferences. Ad cookies from Google AdSense.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">4. How we use your data</h2>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li>To provide our services (prices, schemes, calculators, bank rates).</li>
              <li>To match you with government schemes.</li>
              <li>To save and show your score history (if you choose to save).</li>
              <li>To understand traffic patterns and improve the website.</li>
              <li>To display advertisements.</li>
              <li>To prevent abuse and spam.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">5. Calculator and Smart Tool data</h2>
            <p className="text-body">All calculator and Smart Tool computations run entirely in your browser. The numbers you type into calculators are never sent to our server. They stay on your device.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">6. Google AdSense</h2>
            <p className="text-body">We use Google AdSense to show ads. Google uses cookies to serve ads based on your browsing history. You can opt out of personalized ads at <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">7. Google Analytics</h2>
            <p className="text-body">We use Google Analytics 4 to understand how people use the website. It collects anonymized usage data. You can opt out using the <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">8. Data sharing</h2>
            <p className="text-body">We do not sell your data. We do not share personal information with third parties except:</p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Google (for analytics and ads, as described above).</li>
              <li>Razorpay (for payment processing if you purchase a premium plan).</li>
              <li>Law enforcement (if legally required).</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">9. Data storage and security</h2>
            <p className="text-body">Account data is stored in encrypted databases. Passwords are hashed with bcrypt. We use HTTPS everywhere. However, no system is 100% secure. Use a strong, unique password for your account.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">10. Your rights</h2>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li>You can delete your account at any time from the dashboard.</li>
              <li>You can request a copy of your data by emailing us.</li>
              <li>You can opt out of marketing emails using the unsubscribe link.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">11. Children</h2>
            <p className="text-body">Paisa Reality is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us data, contact us and we will delete it.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">12. Changes</h2>
            <p className="text-body">We may update this policy. Changes will be posted here with a new date. Continued use means you accept the updated policy.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">13. Contact</h2>
            <p className="text-body">Privacy questions? Email <a href="mailto:connect@paisareality.com" className="text-primary hover:underline">connect@paisareality.com</a>.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
