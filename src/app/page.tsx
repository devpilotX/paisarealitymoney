import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import FAQ from '@/components/FAQ';

export const metadata: Metadata = {
  title: 'Paisa Reality - Gold Rate Today, Silver Price, Petrol Diesel Price, Government Schemes, Free Calculators',
  description:
    'Check today gold rate, silver rate, petrol price, diesel price and LPG price in India. Find government schemes you qualify for. Use free EMI, SIP, FD, PPF calculators. Compare bank rates. Meet Yojana Mitra, your AI guide to schemes and tools.',
  alternates: { canonical: 'https://paisareality.com' },
  openGraph: {
    title: 'Paisa Reality - India\'s Free Money Hub',
    description: 'Daily gold, silver, petrol, diesel, LPG prices. Government scheme finder. Free financial calculators. Bank rate comparison.',
    url: 'https://paisareality.com',
    siteName: 'Paisa Reality',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paisa Reality - India\'s Free Money Hub',
    description: 'Daily prices, government schemes, free calculators, and bank rate comparison. All in one place.',
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
    description: 'Gold rate, silver rate, petrol price, diesel price, and LPG price for 50+ Indian cities.',
    href: '/gold-rate',
    icon: '📊',
  },
  {
    title: 'Government Schemes',
    description: 'Find schemes you may qualify for. Fill a simple form and we match you with active schemes.',
    href: '/schemes',
    icon: '🏛️',
  },
  {
    title: 'Financial Calculators',
    description: 'EMI, SIP, FD, PPF, income tax, home loan, NPS, gratuity, HRA, and inflation calculators. All free.',
    href: '/calculators',
    icon: '🧮',
  },
  {
    title: 'Bank Rate Comparison',
    description: 'Compare FD rates, savings rates, home loan rates, and personal loan rates across 50+ banks.',
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

const TRUST_ITEMS = [
  {
    icon: '✓',
    title: 'Official Sources',
    description: 'We link to official sources wherever possible. Always verify important details yourself.',
  },
  {
    icon: '✓',
    title: 'Updated Daily',
    description: 'Prices refresh every day. Scheme data is checked regularly.',
  },
  {
    icon: '✓',
    title: '100% Free',
    description: 'Every tool, calculator, and piece of information on Paisa Reality is free. No hidden charges.',
  },
];

const HOME_FAQS = [
  {
    question: 'What is Paisa Reality?',
    answer:
      'Paisa Reality is a free website where you can check today\'s gold, silver, petrol and diesel prices, find government schemes you qualify for, use financial calculators, and compare bank rates. Always verify important info with official sources.',
  },
  {
    question: 'Is Paisa Reality free to use?',
    answer:
      'Yes, completely free. You can check prices, use calculators, find schemes, and compare bank rates without paying anything. We earn through ads shown on the site.',
  },
  {
    question: 'How often are prices updated?',
    answer:
      'Gold and silver prices update daily based on market rates. Petrol and diesel prices update daily as per oil marketing companies. LPG prices update on the 1st of every month.',
  },
  {
    question: 'How does the government scheme finder work?',
    answer:
      'You fill a simple form with your basic details like age, state, income, and category. We check your profile against active schemes and show you the ones you likely qualify for.',
  },
  {
    question: 'Is Paisa Reality a financial advisor?',
    answer:
      'No. We are an informational website only. We give you data and tools to help you make better decisions. Always consult a qualified financial advisor for important money decisions.',
  },
  {
    question: 'What are Smart Tools?',
    answer:
      'Smart Tools are our advanced financial calculators. They handle complex questions like how much you need to retire, whether to prepay a loan or invest, and how to legally pay less tax. They run in your browser and are completely free.',
  },
  {
    question: 'What is Yojana Mitra?',
    answer:
      'Yojana Mitra is our AI assistant built into the site. It helps you find government schemes, understand calculator results, and answer questions about anything on Paisa Reality. It only talks about what is on this website, nothing outside.',
  },
];

export default function HomePage(): React.ReactElement {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Paisa Reality',
    url: 'https://paisareality.com',
    description: 'Check daily prices, find government schemes, use free calculators, and compare bank rates in India.',
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
    logo: 'https://paisareality.com/paisa_reality_logo.png',
    sameAs: [],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <>
      <Script id="website-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <Script id="org-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="bg-white py-10 sm:py-14">
        <div className="container-main text-center px-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
            Your Money Deserves Better.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto mb-6">
            Every Indian family works hard for their money. Now make your own decisions. Everything is in your hands.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/score"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold
                         rounded-lg no-underline min-h-[44px] border-2 border-primary
                         bg-white text-primary
                         transition-all duration-250
                         hover:bg-primary hover:text-white hover:border-primary
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Check your Money Health Score
            </Link>
            <Link href="/schemes" className="btn-secondary no-underline">
              Find Government Schemes
            </Link>
            <Link href="/gold-rate" className="btn-secondary no-underline">
              Check Today&apos;s Prices
            </Link>
          </div>
        </div>
      </section>

      <AdBanner format="horizontal" className="container-main" />

      {/* Smart Tools teaser (compact, no card grid) */}
      <section className="section-spacing">
        <div className="container-main max-w-2xl text-center">
          <h2 className="heading-2 mb-4">Smart Tools</h2>
          <p className="text-gray-600 text-base mb-6">
            Big money questions need more than a basic calculator. Our Smart Tools run thousands of scenarios to help you plan retirement, compare loan prepayment vs investing, and cut your tax bill. Free, instant, no login.
          </p>
          <Link
            href="/smart-tools"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold
                       rounded-lg no-underline min-h-[44px] border-2 border-primary
                       bg-white text-primary
                       transition-all duration-200
                       hover:bg-primary hover:text-white hover:border-primary
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            See all Smart Tools
          </Link>
        </div>
      </section>

      {/* Four Pillars */}
      <section className="section-spacing bg-gray-50">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">Everything You Need, Right Here</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLAR_CARDS.map((card) => (
              <Link key={card.href} href={card.href} className="card text-center no-underline group">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-200">
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
          <h2 className="heading-2 text-center mb-8">Today&apos;s Prices</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {QUICK_PRICES.map((price) => (
              <Link
                key={price.href}
                href={price.href}
                className="card text-center no-underline hover:border-primary transition-colors duration-200"
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
          <h2 className="heading-2 text-center mb-2">Government Schemes for You</h2>
          <p className="text-center text-gray-600 mb-8">
            The government made these for people like you. Check if you qualify.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_SCHEMES.map((scheme) => (
              <Link key={scheme.href} href={scheme.href} className="card no-underline group">
                <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors duration-200">
                  {scheme.name}
                </h3>
                <p className="text-sm text-gray-600">{scheme.benefit}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/schemes"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold
                         rounded-lg no-underline min-h-[44px] border-2 border-primary
                         bg-white text-primary
                         transition-all duration-200
                         hover:bg-primary hover:text-white hover:border-primary
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
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
                className="card text-center no-underline hover:border-primary transition-colors duration-200 py-4"
              >
                <span className="text-sm font-medium text-primary">{calc.name}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/calculators" className="link-internal text-base">View All Calculators</Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="section-spacing bg-gray-50">
        <div className="container-main">
          <h2 className="heading-2 text-center mb-8">Built on Trust</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xl font-bold mb-4">
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
