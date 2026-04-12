import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';

export const metadata: Metadata = {
  title: 'About Paisa Reality - Free Financial Information for India',
  description:
    'Paisa Reality provides free daily prices, government scheme finder, financial calculators, and bank rate comparisons for all Indians.',
  alternates: {
    canonical: 'https://paisareality.com/about',
  },
};

const ABOUT_FAQS = [
  {
    question: 'Who runs Paisa Reality?',
    answer:
      'Paisa Reality is an independent informational website built to help Indians access financial information easily. We are not affiliated with any government body, bank, or financial institution.',
  },
  {
    question: 'Is the information on Paisa Reality accurate?',
    answer:
      'We source all data from official government websites, Reserve Bank of India publications, and oil marketing company bulletins. While we work hard to keep information accurate and up to date, we recommend verifying critical data with the original source before making financial decisions.',
  },
  {
    question: 'Does Paisa Reality charge any fees?',
    answer:
      'No. All tools, calculators, prices, and scheme information on Paisa Reality are completely free. We earn revenue through advertisements displayed on the website.',
  },
];

export default function AboutPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'About Us' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-6">About Paisa Reality</h1>

        <AdBanner format="horizontal" />

        <div className="prose max-w-none">
          <p className="text-body mb-4">
            Paisa Reality is a free website built for every Indian who wants to understand money better. Whether you want to check today's gold rate in your city, find government schemes you qualify for, calculate your EMI, or compare bank interest rates, you can do it all here in one place.
          </p>

          <h2 className="heading-2 mt-8 mb-4">Our Mission</h2>
          <p className="text-body mb-4">
            India has over 100 crore internet users, but finding reliable financial information is still difficult. Government scheme details are scattered across hundreds of websites. Gold and fuel prices change every day but are hard to find for smaller cities. Bank rates vary widely but no one compares them clearly.
          </p>
          <p className="text-body mb-4">
            We built Paisa Reality to solve these problems. Our goal is simple: put all the money information an Indian person needs in one place, written in plain language that anyone can understand.
          </p>

          <h2 className="heading-2 mt-8 mb-4">What We Offer</h2>
          <ul className="list-disc list-inside space-y-2 text-body mb-4">
            <li><strong>Daily Prices</strong> - Gold rate, silver rate, petrol price, diesel price, and LPG price for 50+ Indian cities, updated every day.</li>
            <li><strong>Government Scheme Finder</strong> - Fill a simple form with your details and we show you all the central and state government schemes you are eligible for.</li>
            <li><strong>Financial Calculators</strong> - Free EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA, and inflation calculators.</li>
            <li><strong>Bank Rate Comparison</strong> - Compare fixed deposit rates, savings account rates, and loan rates across 50+ Indian banks.</li>
          </ul>

          <h2 className="heading-2 mt-8 mb-4">Where We Get Our Data</h2>
          <p className="text-body mb-4">
            All information on Paisa Reality comes from official sources:
          </p>
          <ul className="list-disc list-inside space-y-2 text-body mb-4">
            <li>Gold and silver prices from the Indian Bullion and Jewellers Association (IBJA) and commodity exchanges.</li>
            <li>Petrol and diesel prices from Indian Oil Corporation (IOCL), Bharat Petroleum (BPCL), and Hindustan Petroleum (HPCL).</li>
            <li>LPG prices from oil marketing companies.</li>
            <li>Government scheme details from myscheme.gov.in, ministry websites, and official government gazettes.</li>
            <li>Bank rates from official bank websites and Reserve Bank of India data.</li>
          </ul>

          <h2 className="heading-2 mt-8 mb-4">Important Disclaimer</h2>
          <p className="text-body mb-4">
            Paisa Reality is an informational website. We are not financial advisors, and we do not provide financial advice. The prices, rates, and scheme details shown on this website are for informational purposes only. Always verify information with official sources before making any financial decisions.
          </p>

          <h2 className="heading-2 mt-8 mb-4">Contact Us</h2>
          <p className="text-body mb-4">
            Have a question, suggestion, or found an error? We would love to hear from you. Visit our <a href="/contact" className="link-internal">Contact page</a> to reach us.
          </p>
        </div>

        <FAQ items={ABOUT_FAQS} />
      </article>

      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}