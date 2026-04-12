import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'Contact Paisa Reality - Get in Touch',
  description:
    'Contact the Paisa Reality team for questions, feedback, or corrections. We respond to all emails within 48 hours.',
  alternates: {
    canonical: 'https://paisareality.com/contact',
  },
};

const CONTACT_FAQS = [
  {
    question: 'How quickly will I get a reply?',
    answer:
      'We try to respond to all messages within 48 hours on working days. If your question is about a price error or scheme detail, we prioritize those for faster correction.',
  },
  {
    question: 'Can I suggest a new feature?',
    answer:
      'Yes, we welcome suggestions. If there is a calculator, price, or feature you want us to add, send us a message through the contact form and we will consider it.',
  },
  {
    question: 'I found wrong information on the website. How do I report it?',
    answer:
      'Please email us at contact@paisareality.com with the page URL and the correct information. We verify and fix errors as quickly as possible.',
  },
];

export default function ContactPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Contact Us' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-6">Contact Us</h1>

        <AdBanner format="horizontal" />

        <div className="prose max-w-none">
          <p className="text-body mb-6">
            We would love to hear from you. Whether you have a question about the website, found an error in our data, or want to suggest a new feature, please reach out to us.
          </p>

          <div className="card mb-8">
            <h2 className="heading-3 mb-4">How to Reach Us</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Email</h3>
                <p className="text-body">
                  <a href="mailto:contact@paisareality.com" className="link-internal">
                    contact@paisareality.com
                  </a>
                </p>
                <p className="text-sm text-gray-500 mt-1">We respond within 48 hours on working days.</p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Website</h3>
                <p className="text-body">
                  <a href="https://paisareality.com" className="link-internal">
                    paisareality.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <h2 className="heading-2 mt-8 mb-4">What You Can Write to Us About</h2>
          <ul className="list-disc list-inside space-y-2 text-body mb-4">
            <li><strong>Data corrections</strong> - If you notice a wrong price, incorrect scheme detail, or outdated bank rate, let us know and we will fix it.</li>
            <li><strong>Feature requests</strong> - Want a new calculator, a new city for prices, or a new scheme category? Tell us.</li>
            <li><strong>Technical issues</strong> - If any page is not loading properly or a calculator is giving wrong results, please report it.</li>
            <li><strong>General feedback</strong> - Tell us what you like, what you do not like, and how we can make the website better for you.</li>
            <li><strong>Business inquiries</strong> - For advertising, partnerships, or collaboration proposals.</li>
          </ul>

          <h2 className="heading-2 mt-8 mb-4">Response Time</h2>
          <p className="text-body mb-4">
            We aim to reply to all emails within 48 hours on working days (Monday to Friday). If your message is about incorrect data that could mislead users, we prioritize those and try to respond within 24 hours.
          </p>

          <p className="text-body mb-4">
            Please note that Paisa Reality is an informational website. We cannot provide personalized financial advice, help with government scheme applications, or resolve issues with banks. For those, please contact the relevant government department or bank directly.
          </p>
        </div>

        <FAQ items={CONTACT_FAQS} />
      </article>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}