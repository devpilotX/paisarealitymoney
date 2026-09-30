import { pageMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata = pageMetadata({
  title: 'Privacy Policy: How We Handle Your Data',
  description: 'Privacy policy for Paisa Reality. Learn what data we collect, how we use it, and your rights.',
  path: '/privacy',
});

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-4">Privacy Policy</h1>
        <p className="text-body text-sm text-muted-2 mb-6">Last updated: 30 September 2026</p>

        <div className="space-y-6 text-body">
          <section>
            <h2 className="heading-2 mb-2">Who we are</h2>
            <p>Paisa Reality (paisareality.com) is a free financial information website for India. This policy explains what data we collect when you use our site, why we collect it, and how we handle it.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">What data we collect</h2>
            <p>We collect data only when you actively provide it or when standard web technology logs it automatically:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Account information:</strong> If you create an account, we store your name, email address, phone number (optional), and city (optional).</li>
              <li><strong>Contact form messages:</strong> Your name, email, and the message you send.</li>
              <li><strong>Newsletter subscription:</strong> Your email address when you subscribe.</li>
              <li><strong>Money Health Score data:</strong> The financial details you enter into the score calculator, if you choose to save your result.</li>
              <li><strong>Usage data:</strong> Standard server logs including IP address, browser type, pages visited, and timestamps. Google Analytics collects aggregated browsing data.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Cookies</h2>
            <p>We use cookies for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Authentication:</strong> To keep you logged in (if you have an account).</li>
              <li><strong>Google AdSense:</strong> Advertising cookies to show relevant ads. These are managed by Google.</li>
              <li><strong>Google Analytics:</strong> To understand how people use the site so we can improve it.</li>
            </ul>
            <p className="mt-2">You can disable cookies in your browser settings, but some features (like staying logged in) will not work without them.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">How we use your data</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To provide the services you use (account access, saved scores, scheme matching).</li>
              <li>To reply to your contact form messages.</li>
              <li>To send newsletter emails if you subscribed (you can unsubscribe any time).</li>
              <li>To send account-related emails (verification, password reset, login alerts).</li>
              <li>To improve the site based on aggregated usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">We do not sell your data</h2>
            <p>We do not sell, rent, or trade your personal information to third parties. We do not share your email with advertisers. Google AdSense and Analytics operate under their own privacy policies.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Services that process data for us</h2>
            <p>We rely on a small number of providers to run the site. Each one receives only what it needs for its job:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Amazon Web Services (Mumbai region):</strong> hosts the website and its database.</li>
              <li><strong>Cloudflare:</strong> delivers pages and protects the site from attacks. It sees your IP address and the pages you request.</li>
              <li><strong>Hostinger:</strong> sends our emails, so it handles your email address and the message content.</li>
              <li><strong>Razorpay:</strong> processes premium plan payments. Card and UPI details go to Razorpay directly; we never see or store them.</li>
              <li><strong>Google:</strong> Analytics for aggregated usage, AdSense for ads, and Gemini for the Yojana Mitra assistant when you type a question into it. Do not type personal identifiers such as Aadhaar or bank numbers into the assistant.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Consent and your rights under Indian law</h2>
            <p>We process personal data under the Digital Personal Data Protection Act, 2023, on the basis of the consent you give when you sign up, subscribe, or submit a form. You can withdraw that consent at any time, and withdrawing is as easy as giving it: unsubscribe from any email, or delete your account from Dashboard, My Account.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Data storage and security</h2>
            <p>Your data is stored in a PostgreSQL database. Passwords are hashed with bcrypt and never stored in plain text. We use HTTPS for all connections. While we take reasonable steps to protect your data, no system is perfectly secure.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Data retention</h2>
            <p>We keep your account data for as long as your account exists. You can delete your account yourself from Dashboard, My Account; that removes your profile, saved schemes, alerts and score history immediately, and any copies in backups expire within 30 days. Contact form messages are kept for up to 12 months. Newsletter subscription records are kept until you unsubscribe.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Your rights</h2>
            <p>You can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>View and edit your profile information from your account settings.</li>
              <li>Unsubscribe from the newsletter at any time using the link in any email.</li>
              <li>Request a copy of your data or ask us to delete it by emailing us.</li>
            </ul>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Changes to this policy</h2>
            <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Contact and grievances</h2>
            <p>Questions about your privacy, a request to see or delete your data, or a complaint? Email our grievance contact at <a href="mailto:connect@paisareality.com" className="link-internal">connect@paisareality.com</a>. We acknowledge every request within 72 hours and resolve it within 30 days. If you are not satisfied with our answer, you can complain to the Data Protection Board of India.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
