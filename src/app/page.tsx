import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import FAQ from '@/components/FAQ';

export const metadata: Metadata = {
  title: 'Paisa Reality - Gold Rate, Silver Rate, Petrol Price, Government Schemes, Calculators',
  description:
    'Check today\'s gold rate, silver rate, petrol price. Find 1000+ government schemes. Use free EMI, SIP, FD calculators. Compare bank rates. Updated daily.',
  alternates: {
    canonical: 'https://paisareality.com',
  },
};

interface PillarCard {
  title: string;
  description: string;
  href: string;
  icon: string;
}

const PILLAR_CARDS: PillarCard[] = [
  {
    title: 'Daily Prices',
    description:
      'Gold rate, silver rate, petrol price, diesel price, and LPG price. Updated every day for 50+ Indian cities.',
    href: '/gold-rate',
    icon: '📊',
  },
  {
    title: 'Government Schemes',
    description:
      'Find schemes you qualify for. Fill a simple form and we match you with 1,000+ central and state government schemes.',
    href: '/schemes',
    icon: '🏛️',
  },
  {
    title: 'Financial Calculators',
    description:
      'EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA, and inflation calculators. All free to use.',
    href: '/calculators',
    icon: '🧮',
  },
  {
    title: 'Bank Rate Comparison',
    description:
      'Compare FD rates, savings rates, home loan rates, and personal loan rates across 50+ Indian banks side by side.',
    href: '/bank-rates',
    icon: '🏦',
  },
];

interface QuickPrice {
  label: string;
  href: string;
}

const QUICK_PRICES: QuickPrice[] = [
  { label: 'Gold Rate Today', href: '/gold-rate' },
  { label: 'Silver Rate Today', href: '/silver-rate' },
  { label: 'Petrol Price Today', href: '/petrol-price' },
  { label: 'Diesel Price Today', href: '/diesel-price' },
  { label: 'LPG Price Today', href: '/lpg-price' },
];

interface PopularScheme {
  name: string;
  href: string;
  benefit: string;
}

const POPULAR_SCHEMES: PopularScheme[] = [
  { name: 'PM Awas Yojana', href: '/schemes/pm-awas-yojana', benefit: 'Up to 2.67 lakh subsidy on home loan' },
  { name: 'Ayushman Bharat', href: '/schemes/ayushman-bharat', benefit: 'Free health cover up to 5 lakh per family' },
  { name: 'PM Kisan Samman Nidhi', href: '/schemes/pm-kisan', benefit: 'Rs 6,000 per year for farmers' },
  { name: 'Sukanya Samriddhi Yojana', href: '/schemes/sukanya-samriddhi', benefit: '8.2% interest for girl child savings' },
  { name: 'MUDRA Loan Yojana', href: '/schemes/mudra-loan', benefit: 'Business loans up to 10 lakh without collateral' },
  { name: 'PM Vishwakarma Yojana', href: '/schemes/pm-vishwakarma', benefit: 'Up to 3 lakh loan for artisans and craftsmen' },
];

interface CalculatorShortcut {
  name: string;
  href: string;
}

const CALCULATOR_SHORTCUTS: CalculatorShortcut[] = [
  { name: 'EMI Calculator', href: '/calculators/emi' },
  { name: 'SIP Calculator', href: '/calculators/sip' },
  { name: 'FD Calculator', href: '/calculators/fd' },
  { name: 'PPF Calculator', href: '/calculators/ppf' },
  { name: 'Income Tax Calculator', href: '/calculators/income-tax' },
  { name: 'Home Loan Calculator', href: '/calculators/home-loan' },
];

interface TrustItem {
  icon: string;
  title: string;
  description: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: '✓',
    title: 'Data from Official Sources',
    description: 'All prices and scheme details come from government websites and official publications.',
  },
  {
    icon: '✓',
    title: 'Updated Daily',
    description: 'Prices are refreshed every day. Scheme information is verified regularly.',
  },
  {
    icon: '✓',
    title: '100% Free',
    description: 'All tools, calculators, and information on Paisa Reality are free to use. No hidden charges.',
  },
];

const HOME_FAQS = [
  {
    question: 'What is Paisa Reality?',
    answer:
      'Paisa Reality is a free website where you can check daily gold, silver, petrol and diesel prices, find government schemes you qualify for, use financial calculators, and compare bank rates. All information comes from official sources and is updated regularly.',
  },
  {
    question: 'Is Paisa Reality free to use?',
    answer:
      'Yes, Paisa Reality is completely free. You can check prices, use calculators, find schemes, and compare bank rates without paying anything. We earn through advertisements shown on the website.',
  },
  {
    question: 'How often are the prices updated?',
    answer:
      'Gold and silver prices are updated daily based on market rates. Petrol and diesel prices are updated daily as per oil marketing companies. LPG prices are updated on the 1st of every month.',
  },
  {
    question: 'How does the government scheme finder work?',
    answer:
      'You fill a simple form with your basic details like age, state, income, and category. Our system checks your profile against 1,000+ central and state government schemes and shows you the ones you are eligible for.',
  },
  {
    question: 'Is Paisa Reality a financial advisor?',
    answer:
      'No. Paisa Reality is an informational website only. We provide data and tools to help you make informed decisions. Always verify information with official sources and consult a qualified financial advisor before making important money decisions.',
  },
];

export default function HomePage(): React.ReactElement {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Paisa Reality',
    url: 'https://paisareality.com',
    description: "India's one-stop money hub. Live prices, government schemes, financial calculators, and bank rate comparisons.",
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://paisareality.com/schemes?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Paisa Reality',
    url: 'https://paisareality.com',
    logo: 'https://paisareality.com/logo.png',
    sameAs: [],
  };

  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} 
      />
      <Script
        id="org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} 
      />

      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="container-main text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            India's One-Stop Money Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Live prices, government schemes, financial calculators, and bank rate comparisons.
            All free. All real. All in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/schemes" className="btn-primary no-underline">
              Find Government Schemes
            </Link>
            <Link href="/gold-rate" className="btn-secondary no-underline">
              Check Today's Prices
            </Link>
          </div>
        </div>
      </section>

      <AdBanner format="horizontal" className="container-main" />

      {/* Four Pillars */}
      <section className="section-spacing bg-gray-50">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">What You Can Do on Paisa Reality</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLAR_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="card text-center no-underline group"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary
                              transition-colors duration-200">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Prices */}
      <section className="section-spacing">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">Today's Prices</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {QUICK_PRICES.map((price) => (
              <Link
                key={price.href}
                href={price.href}
                className="card text-center no-underline hover:border-primary
                           transition-colors duration-200"
              >
                <span className="text-base font-medium text-primary">{price.label}</span>
                <span className="block mt-1 text-xs text-gray-500">Click to view</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <InArticleAd className="container-main" />

      {/* Popular Schemes */}
      <section className="section-spacing bg-gray-50">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-2">Popular Government Schemes</h2>
          <p className="text-center text-gray-600 mb-8">
            These are some of the most searched government schemes in India.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_SCHEMES.map((scheme) => (
              <Link
                key={scheme.href}
                href={scheme.href}
                className="card no-underline group"
              >
                <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-primary
                              transition-colors duration-200">
                  {scheme.name}
                </h3>
                <p className="text-sm text-gray-600">{scheme.benefit}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/schemes" className="btn-primary no-underline">
              Find Schemes for You
            </Link>
          </div>
        </div>
      </section>

      {/* Calculator Shortcuts */}
      <section className="section-spacing">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">Free Financial Calculators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CALCULATOR_SHORTCUTS.map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                className="card text-center no-underline hover:border-primary
                           transition-colors duration-200 py-4"
              >
                <span className="text-sm font-medium text-primary">{calc.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/calculators" className="link-internal text-base">
              View All Calculators
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="section-spacing bg-gray-50">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">Why Trust Paisa Reality?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full
                              bg-primary text-white text-xl font-bold mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-spacing">
        <div className="container-main max-w-3xl">
          <FAQ items={HOME_FAQS} />
        </div>
      </section>

      <AdBanner format="horizontal" className="container-main mb-8" />
    </>
  );
}