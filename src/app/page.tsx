import type { Metadata } from 'next';
import Link from 'next/link';
import InArticleAd from '@/components/InArticleAd';
import FAQ from '@/components/FAQ';
import AdSlot from '@/components/AdSlot';

export const metadata: Metadata = {
  title: 'Money Health Score and Smart Tools | Paisa Reality',
  description:
    'Check your free Money Health Score and 10 smart tools for retirement, debt, and tax. Plus daily gold and fuel prices, government schemes, calculators, and bank rates.',
  alternates: {
    canonical: 'https://paisareality.com',
    languages: {
      'en-IN': 'https://paisareality.com',
      'hi-IN': 'https://paisareality.com/hi',
      'x-default': 'https://paisareality.com',
    },
  },
  openGraph: {
    title: 'Paisa Reality: Money Health Score and Smart Financial Tools',
    description: 'Check your free Money Health Score and 10 smart tools for retirement, debt, and tax planning. Plus live rates, schemes, and bank rate comparison.',
    url: 'https://paisareality.com',
    siteName: 'Paisa Reality',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paisa Reality: Money Health Score and Smart Financial Tools',
    description: 'Your free Money Health Score and 10 smart tools, plus live prices, schemes, calculators, and bank rates.',
  },
};

function ArrowRight({ className = 'w-4 h-4' }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

interface PopularScheme {
  name: string;
  href: string;
  benefit: string;
}

const POPULAR_SCHEMES: PopularScheme[] = [
  { name: 'PM Awas Yojana', href: '/schemes/pm-awas-yojana', benefit: 'Up to 2.67 lakh subsidy on your home loan.' },
  { name: 'Ayushman Bharat', href: '/schemes/ayushman-bharat', benefit: 'Cashless hospital cover up to 5 lakh a family.' },
  { name: 'PM Kisan Samman Nidhi', href: '/schemes/pm-kisan', benefit: 'Income support of 6,000 a year for farmers.' },
  { name: 'Sukanya Samriddhi', href: '/schemes/sukanya-samriddhi', benefit: 'High interest savings to build a fund for your daughter.' },
  { name: 'MUDRA Loan Yojana', href: '/schemes/mudra-loan', benefit: 'Loans up to 10 lakh for your small business, no collateral.' },
  { name: 'PM Vishwakarma', href: '/schemes/pm-vishwakarma', benefit: 'Tools, training and loans up to 3 lakh for artisans.' },
];

interface ScholarshipTeaser {
  name: string;
  note: string;
  amount: string;
}

const SCHOLARSHIP_TEASERS: ScholarshipTeaser[] = [
  { name: 'Means-cum-Merit', note: 'Class 9 to 12, lower-income homes', amount: '12,000 a year' },
  { name: 'Post-Matric (SC/ST/OBC)', note: 'Support once you finish Class 10', amount: 'Full tuition plus stipend' },
  { name: 'Pragati (Girls in Tech)', note: 'Girls in technical diploma and degree courses', amount: '50,000 a year' },
];

interface ToolLink {
  title: string;
  sub: string;
  href: string;
  icon: React.ReactElement;
}

const TOOLS: ToolLink[] = [
  {
    title: 'Daily Prices',
    sub: 'Gold, silver, fuel, LPG',
    href: '/gold-rate',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 14 3-3 3 3 5-6" /></svg>
    ),
  },
  {
    title: 'Calculators',
    sub: 'EMI, SIP, FD, tax',
    href: '/calculators',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>
    ),
  },
  {
    title: 'Bank Rates',
    sub: 'FD and loan rates',
    href: '/bank-rates',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M4 21V10h16v11M9 21v-6h6v6M4 10l8-6 8 6" /></svg>
    ),
  },
  {
    title: 'Health Score',
    sub: 'Check your money',
    href: '/score',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 9 9M12 3v9l6-3" /></svg>
    ),
  },
];

const TRUST_ITEMS = [
  {
    title: 'Straight from the source',
    description: 'We link out to the real government and bank pages, so you can double-check anything yourself.',
    accent: 'border-t-navy',
    tint: 'text-navy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
    ),
  },
  {
    title: 'Kept current',
    description: 'Prices update daily and scheme details get a regular look, so you are not reading old news.',
    accent: 'border-t-brand-red',
    tint: 'text-brand-red',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    ),
  },
  {
    title: 'Free, and it stays free',
    description: 'No paywalls and no hidden charges. Everything here costs you nothing.',
    accent: 'border-t-brand-yellow',
    tint: 'text-navy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
  },
];

const STEPS = [
  { n: '01', title: 'Tell us about you', text: 'A handful of simple questions. No papers, no login, nothing to pay.' },
  { n: '02', title: 'See your matches', text: 'We hand you a shortlist of what you actually qualify for.' },
  { n: '03', title: 'Apply the safe way', text: 'Follow the checklist and go straight to the real government site.' },
];

const HOME_FAQS = [
  {
    question: 'What is Paisa Reality?',
    answer:
      'Paisa Reality is a free website that helps Indian families find the government schemes and scholarships they can get, along with daily prices, bank rates and simple calculators. We share information. We are not financial advisors.',
  },
  {
    question: 'Is Paisa Reality free to use?',
    answer:
      'Yes, all of it. Every scheme, scholarship, calculator and price is free, and you do not need an account.',
  },
  {
    question: 'How does the government scheme finder work?',
    answer:
      'You tell us a few basics like your work, your state and what you need help with. We check that against each scheme published rules and show the ones that fit.',
  },
  {
    question: 'How often is the information updated?',
    answer:
      'Gold and silver prices update daily. Petrol and diesel update daily as per oil marketing companies, and LPG on the 1st of each month. Scheme and scholarship details are reviewed on a regular basis.',
  },
  {
    question: 'Do you apply for me?',
    answer:
      'No. We show you what fits, list the documents you will need, and then send you to the official government portal to apply safely.',
  },
  {
    question: 'Is Paisa Reality a financial advisor?',
    answer:
      'No. We are an informational website only. We give you data and tools to help you make better decisions. Always consult a qualified financial advisor for important money decisions.',
  },
];

export const revalidate = 300;

export default function HomePage(): React.ReactElement {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-paper border-b border-line">
        <div className="bg-paper-dots absolute inset-0" aria-hidden="true" />
        <div className="container-main relative py-12 sm:py-16">
          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 items-center">
            <div>
              <h1 className="font-serif font-bold text-navy leading-[1.12] text-[clamp(29px,4vw,44px)]">
                Get the government schemes and <span className="mark">scholarships</span> your family has a right to.
              </h1>
              <p className="font-sans text-[16.5px] leading-relaxed text-muted max-w-[490px] mt-4">
                Answer a few quick questions and see exactly what you can apply for. Plus daily gold and fuel prices,
                free calculators, and your Money Health Score. No cost, no sign up.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/schemes" className="btn-primary no-underline">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  Find my schemes
                </Link>
                <Link href="/scholarships" className="btn-secondary no-underline">
                  See scholarships <ArrowRight />
                </Link>
              </div>
              <div className="flex flex-wrap gap-8 mt-6 pt-5 border-t border-line">
                <div>
                  <div className="font-serif text-2xl font-bold text-navy">350+</div>
                  <div className="font-sans text-xs text-muted">Schemes tracked</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-navy">50+</div>
                  <div className="font-sans text-xs text-muted">Cities for prices</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-navy">Free</div>
                  <div className="font-sans text-xs text-muted">Always, no sign up</div>
                </div>
              </div>
            </div>

            {/* Front-page clipping card */}
            <div className="rounded-[5px] border border-line bg-paper-2 p-6 shadow-[0_16px_34px_rgba(30,20,10,0.10)]">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-bold text-navy">Today at a glance</span>
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-muted-2">Updated daily</span>
              </div>
              <hr className="rule-double my-4" />
              <ul className="space-y-3">
                <li>
                  <Link href="/gold-rate" className="group flex items-center justify-between no-underline">
                    <span className="font-sans text-[15px] font-semibold text-ink">Gold rate today</span>
                    <span className="text-navy group-hover:text-brand-red transition-colors"><ArrowRight /></span>
                  </Link>
                </li>
                <li>
                  <Link href="/schemes/pm-awas-yojana" className="group flex items-center justify-between no-underline">
                    <span className="font-sans text-[15px] font-semibold text-ink">Popular: PM Awas Yojana</span>
                    <span className="text-navy group-hover:text-brand-red transition-colors"><ArrowRight /></span>
                  </Link>
                </li>
                <li>
                  <Link href="/scholarships" className="group flex items-center justify-between no-underline">
                    <span className="font-sans text-[15px] font-semibold text-ink">Scholarships open now</span>
                    <span className="text-brand-red group-hover:text-navy transition-colors"><ArrowRight /></span>
                  </Link>
                </li>
                <li>
                  <Link href="/score" className="group flex items-center justify-between no-underline">
                    <span className="font-sans text-[15px] font-semibold text-ink">Your Money Health Score</span>
                    <span className="text-navy group-hover:text-brand-red transition-colors"><ArrowRight /></span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <AdSlot placement="home-top" format="horizontal" className="container-main" />

      {/* Priority: the two headline products */}
      <section className="section-spacing bg-paper-2 border-y border-line">
        <div className="container-main">
          <div className="text-center">
            <span className="eyebrow">What we focus on</span>
            <h2 className="section-title">Two things we do <span className="mark">really well</span></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="card group flex flex-col">
              <div className="h-1 w-12 bg-navy mb-5" />
              <span className="font-serif text-[13px] uppercase tracking-[0.15em] text-muted-2">Priority I</span>
              <h3 className="font-serif text-2xl font-bold text-navy mt-1 mb-2.5">Government Schemes</h3>
              <p className="font-sans text-[14.5px] leading-relaxed text-muted">
                Central and state schemes sit on dozens of portals. We bring them into one place, read the rules,
                and tell you in plain words what you can actually apply for.
              </p>
              <div className="flex flex-wrap gap-2 my-5">
                {['Housing', 'Farmers', 'Business', 'Health', 'Women'].map((c) => (
                  <span key={c} className="font-sans text-[12.5px] font-semibold text-ink border border-line bg-paper-2 px-2.5 py-1 rounded-[3px]">{c}</span>
                ))}
              </div>
              <Link href="/schemes" className="mt-auto inline-flex items-center gap-2 font-sans font-bold text-[14.5px] text-navy no-underline group-hover:gap-3 transition-all">
                Check what I qualify for <ArrowRight />
              </Link>
            </div>

            <div className="card group flex flex-col">
              <div className="h-1 w-12 bg-brand-red mb-5" />
              <span className="font-serif text-[13px] uppercase tracking-[0.15em] text-muted-2">Priority II</span>
              <h3 className="font-serif text-2xl font-bold text-navy mt-1 mb-2.5">Scholarships</h3>
              <p className="font-sans text-[14.5px] leading-relaxed text-muted">
                Every year students lose money simply because they missed a date. We keep an eye on the deadlines
                and put the award amount right up front, so nothing gets past you.
              </p>
              <div className="flex flex-wrap gap-2 my-5">
                {['Pre-matric', 'Post-matric', 'Girl child', 'Merit', 'Minority'].map((c) => (
                  <span key={c} className="font-sans text-[12.5px] font-semibold text-ink border border-line bg-paper-2 px-2.5 py-1 rounded-[3px]">{c}</span>
                ))}
              </div>
              <Link href="/scholarships" className="mt-auto inline-flex items-center gap-2 font-sans font-bold text-[14.5px] text-brand-red no-underline group-hover:gap-3 transition-all">
                See open scholarships <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured schemes */}
      <section className="section-spacing">
        <div className="container-main">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="max-w-[640px]">
              <span className="eyebrow">Popular government schemes</span>
              <h2 className="section-title">The ones families look up most</h2>
            </div>
            <Link href="/schemes" className="inline-flex items-center gap-2 font-sans font-bold text-sm text-navy no-underline border-b-2 border-transparent hover:border-brand-yellow pb-0.5 transition-colors">
              See all schemes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <hr className="rule-double my-7" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_SCHEMES.map((s) => (
              <Link key={s.href} href={s.href} className="card no-underline group flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-[5px] border border-line bg-paper-2 text-navy">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" /></svg>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-sans text-[11.5px] font-bold text-navy">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> Open
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-navy mb-1 group-hover:text-brand-red transition-colors">{s.name}</h3>
                <p className="font-sans text-sm text-muted leading-snug">{s.benefit}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-[14px] font-bold text-navy group-hover:gap-2.5 transition-all">
                  View details <ArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Finder band */}
      <section className="pb-8 sm:pb-12">
        <div className="container-main">
          <div className="relative overflow-hidden rounded-[5px] border border-navy-deep bg-navy p-8 sm:p-10">
            <div
              className="absolute inset-0 opacity-[0.07]"
              aria-hidden="true"
              style={{ backgroundImage: 'radial-gradient(#F3EAD6 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <div className="relative max-w-2xl">
              <span className="eyebrow eyebrow-on-dark">Takes about a minute</span>
              <h2 className="font-serif text-paper font-bold text-[clamp(22px,2.4vw,28px)] mt-2 mb-1.5">
                Not sure where to start? Just tell us a few things.
              </h2>
              <p className="font-sans text-paper/80 text-[14.5px] mb-6">
                Give us a little about yourself and we will pull up the schemes and scholarships you can apply for right now.
              </p>
              <Link href="/schemes" className="btn-yellow no-underline">
                Show my matches <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Scholarships closing soon */}
      <section className="section-spacing bg-paper-2 border-y border-line">
        <div className="container-main">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="max-w-[640px]">
              <span className="eyebrow">Worth a look</span>
              <h2 className="section-title">Scholarships to <span className="mark">grab in time</span></h2>
            </div>
            <Link href="/scholarships" className="inline-flex items-center gap-2 font-sans font-bold text-sm text-navy no-underline border-b-2 border-transparent hover:border-brand-yellow pb-0.5 transition-colors">
              See all scholarships <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <hr className="rule-double my-7" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SCHOLARSHIP_TEASERS.map((s) => (
              <Link key={s.name} href="/scholarships" className="card no-underline group flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-[5px] border border-line bg-paper-2 text-brand-red">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5" /></svg>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-sans text-[11.5px] font-bold text-brand-red">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" /> Open
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-navy mb-1 group-hover:text-brand-red transition-colors">{s.name}</h3>
                <p className="font-sans text-sm text-muted leading-snug">{s.note}</p>
                <div className="mt-4 pt-3 border-t border-dashed border-line font-sans text-sm font-bold text-ink">
                  <span className="text-brand-red">{s.amount}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-spacing">
        <div className="container-main">
          <div className="text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">Three steps, nothing complicated</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-0 mt-8">
            {STEPS.map((step, i) => (
              <div key={step.n} className={`md:px-8 ${i > 0 ? 'md:border-l md:border-line' : ''}`}>
                <div className="font-serif text-4xl font-bold text-brand-yellow leading-none">{step.n}</div>
                <h3 className="font-serif text-lg font-bold text-navy mt-2.5 mb-1.5">{step.title}</h3>
                <p className="font-sans text-sm text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="section-spacing bg-paper-2 border-y border-line">
        <div className="container-main">
          <div className="text-center">
            <span className="eyebrow">Why people trust us</span>
            <h2 className="section-title">Honest, and easy to check</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className={`border-t-[3px] ${item.accent} pt-5`}>
                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-[5px] border border-line bg-paper mb-4 ${item.tint}`}>
                  <span className="w-6 h-6">{item.icon}</span>
                </span>
                <h3 className="font-serif text-lg font-bold text-navy mb-1.5">{item.title}</h3>
                <p className="font-sans text-sm text-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Handy tools */}
      <section className="section-spacing">
        <div className="container-main">
          <div className="max-w-[640px]">
            <span className="eyebrow">Also here</span>
            <h2 className="section-title">A few handy money tools</h2>
            <p className="section-lead">For when you just need a quick number or today rate.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="group flex items-center gap-3.5 rounded-[5px] border border-line bg-paper p-4 no-underline hover:border-navy hover:-translate-y-0.5 transition-all">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-[5px] border border-line bg-paper-2 text-muted group-hover:text-navy transition-colors">
                  <span className="w-5 h-5">{tool.icon}</span>
                </span>
                <span>
                  <span className="block font-serif text-[15.5px] font-bold text-navy leading-tight">{tool.title}</span>
                  <span className="block font-sans text-xs text-muted">{tool.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <InArticleAd className="container-main" />

      {/* FAQ */}
      <section className="section-spacing">
        <div className="container-main max-w-3xl">
          <div className="text-center mb-2">
            <span className="eyebrow">Good to know</span>
          </div>
          <FAQ items={HOME_FAQS} title="Questions people ask us" />
        </div>
      </section>

      <AdSlot placement="home-mid" format="horizontal" className="container-main mb-8" />
    </>
  );
}
