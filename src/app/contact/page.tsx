import { pageMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';
import ContactForm from '@/components/ContactForm';

export const metadata = pageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with the Paisa Reality team. Report errors, suggest features, or ask questions. We reply within 48 hours.',
  path: '/contact',
});

export default function ContactPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Contact Us' }]} />

      <div className="max-w-3xl">
        <h1 className="heading-1 mb-3">Contact Us</h1>
        <p className="text-body mb-8">
          Got a question, found wrong data, or want to suggest something? Write to us. We read every message.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-5 rounded-xl border border-gray-200 text-center">
            <div className="text-2xl mb-2">✉</div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Email</h2>
            <a href="mailto:connect@paisareality.com" className="text-sm text-primary hover:underline break-all">
              connect@paisareality.com
            </a>
          </div>
          <div className="p-5 rounded-xl border border-gray-200 text-center">
            <div className="text-2xl mb-2">⏱</div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Response time</h2>
            <p className="text-sm text-gray-600">Within 48 hours on working days</p>
          </div>
          <div className="p-5 rounded-xl border border-gray-200 text-center">
            <div className="text-2xl mb-2">🌐</div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Website</h2>
            <a href="https://paisareality.com" className="text-sm text-primary hover:underline">
              paisareality.com
            </a>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 mb-10">
          <h2 className="heading-2 mb-4">Send a message</h2>
          <ContactForm />
        </div>

        <AdBanner format="horizontal" />

        <div className="mt-10 space-y-4">
          <h2 className="heading-2">What you can write about</h2>
          <ul className="list-disc list-inside space-y-2 text-body">
            <li><strong>Data corrections.</strong> Wrong price, outdated scheme info, incorrect bank rate? Tell us and we fix it fast.</li>
            <li><strong>Feature requests.</strong> Want a new calculator, a new city, or a new tool? Let us know.</li>
            <li><strong>Bug reports.</strong> Page not loading, calculator giving wrong numbers, layout broken on your phone? Report it.</li>
            <li><strong>General feedback.</strong> What you like, what you do not like, how we can improve.</li>
            <li><strong>Business inquiries.</strong> Advertising, partnerships, or collaborations.</li>
          </ul>

          <h2 className="heading-2 mt-8">Please note</h2>
          <p className="text-body">
            Paisa Reality is an informational website. We cannot help with government scheme applications, bank account issues, or personal financial advice. For those, please contact the relevant government office or bank directly.
          </p>
        </div>
      </div>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
