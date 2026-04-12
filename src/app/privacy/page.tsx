import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Privacy Policy - Paisa Reality',
  description:
    'Read how Paisa Reality collects, uses, and protects your data. We use Google AdSense and Google Analytics.',
  alternates: {
    canonical: 'https://paisareality.com/privacy',
  },
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: April 2026</p>

        <AdBanner format="horizontal" />

        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="heading-2 mt-8 mb-3">1. Introduction</h2>
            <p className="text-body">
              Paisa Reality ("we", "our", "us") operates the website paisareality.com. This Privacy Policy explains what information we collect when you visit our website, how we use it, and how we protect it. We respect your privacy and are committed to being transparent about our data practices.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">2. Information We Collect</h2>
            <h3 className="heading-3 mt-4 mb-2">Information you provide</h3>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li><strong>Account registration:</strong> If you create an account, we collect your name, email address, and a password (stored in encrypted form).</li>
              <li><strong>Scheme finder profile:</strong> If you use the government scheme finder, you provide details like age, gender, state, income, category, and occupation. This information is used only to match you with relevant schemes.</li>
              <li><strong>Contact form:</strong> If you contact us, we collect your name, email, and message content.</li>
            </ul>

            <h3 className="heading-3 mt-4 mb-2">Information collected automatically</h3>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li><strong>Usage data:</strong> Pages visited, time spent on pages, clicks, and navigation patterns.</li>
              <li><strong>Device information:</strong> Browser type, operating system, screen size, and device type.</li>
              <li><strong>IP address:</strong> Your approximate location (city/region level) for analytics purposes.</li>
              <li><strong>Cookies:</strong> Small files stored on your device to remember preferences and improve your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-body">
              <li>To provide and improve our services (prices, schemes, calculators, bank rates).</li>
              <li>To match you with government schemes based on your profile details.</li>
              <li>To send you scheme alerts and updates if you have opted in.</li>
              <li>To analyze website traffic and improve user experience.</li>
              <li>To display relevant advertisements.</li>
              <li>To prevent fraud and ensure website security.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">4. Google AdSense</h2>
            <p className="text-body">
              We use Google AdSense to display advertisements on our website. Google AdSense uses cookies and web beacons to serve ads based on your prior visits to our website and other websites on the internet. Google may use the DART cookie to serve ads based on your browsing activity.
            </p>
            <p className="text-body mt-2">
              You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="link-internal" target="_blank" rel="noopener noreferrer">Google's Ads Settings</a>. You can also opt out of third-party cookies by visiting the <a href="https://www.aboutads.info/choices/" className="link-internal" target="_blank" rel="noopener noreferrer">Network Advertising Initiative opt-out page</a>.
            </p>
            <p className="text-body mt-2">
              For more information about how Google uses data, please visit <a href="https://policies.google.com/privacy" className="link-internal" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">5. Google Analytics</h2>
            <p className="text-body">
              We use Google Analytics 4 (GA4) to understand how visitors use our website. Google Analytics collects information such as how often you visit, which pages you view, what actions you take, and what other sites you used before coming to our website.
            </p>
            <p className="text-body mt-2">
              Google Analytics uses cookies to collect this data. The information collected is anonymous and aggregated. We do not link Google Analytics data to your personal information. You can opt out of Google Analytics by installing the <a href="https://tools.google.com/dlpage/gaoptout" className="link-internal" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">6. Cookies</h2>
            <p className="text-body">We use the following types of cookies:</p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li><strong>Essential cookies:</strong> Required for the website to function (login sessions, preferences).</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors use our website (Google Analytics).</li>
              <li><strong>Advertising cookies:</strong> Used by Google AdSense to show relevant ads.</li>
            </ul>
            <p className="text-body mt-2">
              You can control cookies through your browser settings. Disabling cookies may affect some features of the website.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">7. Data Sharing</h2>
            <p className="text-body">
              We do not sell your personal information to anyone. We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li><strong>Google:</strong> Through AdSense (advertising) and Analytics (traffic analysis).</li>
              <li><strong>Email service provider (Resend):</strong> To send you emails if you have opted in.</li>
              <li><strong>Payment processor (Razorpay):</strong> If you purchase a premium plan, your payment details are handled by Razorpay. We do not store your card details.</li>
              <li><strong>Law enforcement:</strong> If required by law or to protect our legal rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">8. Data Security</h2>
            <p className="text-body">
              We take reasonable measures to protect your information. Passwords are encrypted using bcrypt hashing. All data transmission is encrypted using HTTPS/TLS. We use parameterized database queries to prevent SQL injection attacks.
            </p>
            <p className="text-body mt-2">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">9. Your Rights</h2>
            <p className="text-body">Under applicable Indian law (Information Technology Act, 2000 and related rules), you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-body mt-2">
              <li>Access your personal data that we hold.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent for data processing.</li>
              <li>Opt out of marketing emails at any time.</li>
            </ul>
            <p className="text-body mt-2">
              To exercise any of these rights, email us at <a href="mailto:contact@paisareality.com" className="link-internal">contact@paisareality.com</a>.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">10. Children's Privacy</h2>
            <p className="text-body">
              Paisa Reality is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">11. Changes to This Policy</h2>
            <p className="text-body">
              We may update this privacy policy from time to time. Changes will be posted on this page with an updated date. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="heading-2 mt-8 mb-3">12. Contact</h2>
            <p className="text-body">
              If you have questions about this privacy policy or your data, contact us at:
            </p>
            <p className="text-body mt-2">
              Email: <a href="mailto:contact@paisareality.com" className="link-internal">contact@paisareality.com</a><br />
              Website: <a href="https://paisareality.com" className="link-internal">paisareality.com</a>
            </p>
          </section>
        </div>
      </article>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}