import type { Metadata } from 'next';
import Link from 'next/link';
import FAQ from '@/components/FAQ';
import AdSlot from '@/components/AdSlot';
import CommodityIcon from '@/components/CommodityIcon';
import CategoryIcon from '@/components/CategoryIcon';
import { getFeaturedSchemes, getHomeCounts, getHomeRates, getSchemeCategoryCounts, getTopScholarships, type HomeRate } from '@/lib/home-data';
import { getGrants, formatAmount, FUNDING_LABEL } from '@/lib/grants';
import HeroCarousel, { type HeroSlide } from '@/components/HeroCarousel';

export const metadata: Metadata = {
  title: 'Paisa Reality: Live Prices, Government Schemes & Money Tools',
  description:
    'Daily gold, silver and fuel prices for 50 cities, plus the government schemes, scholarships and startup grants you may qualify for, and honest calculators.',
  alternates: {
    canonical: 'https://paisareality.com',
    languages: { 'en-IN': 'https://paisareality.com', 'x-default': 'https://paisareality.com' },
  },
  openGraph: {
    title: 'Paisa Reality: honest numbers for everyday money decisions',
    description: 'Daily prices, government schemes, scholarships, startup grants and money tools for India. Free, dated and sourced.',
    url: 'https://paisareality.com',
    siteName: 'Paisa Reality',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paisa Reality: honest numbers for everyday money decisions',
    description: 'Daily prices, government schemes, scholarships, startup grants and money tools for India.',
  },
};

export const revalidate = 300;

function Arrow({ className = 'w-4 h-4' }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const inr = (v: number, decimals = 0): string =>
  '\u20B9' + v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function istDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(`${iso.slice(0, 10)}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function istStamp(ts: string): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toUpperCase();
  return `${date}, ${time} IST`;
}

function RateCard({ rate }: { rate: HomeRate }): React.ReactElement {
  const decimals = rate.unit === 'per litre' ? 2 : 0;
  const c = rate.changePct;
  const flat = c === null || Math.abs(c) < 0.005;
  return (
    <Link href={rate.href} className="card card-link !p-5 group">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3"><CommodityIcon kind={rate.kind} /><span className="text-[15px] font-medium text-ink">{rate.label}</span></span>
        {c !== null && (
          <span className={`text-[13px] font-medium tabular ${flat ? 'text-muted-2' : c > 0 ? 'text-green-700' : 'text-brand-red'}`}>
            {flat ? 'No change' : `${c > 0 ? '\u25B2' : '\u25BC'} ${Math.abs(c).toFixed(2)}%`}
          </span>
        )}
      </div>
      <p className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-ink tabular">{inr(rate.value, decimals)}</p>
      <p className="text-[13px] text-muted-2">{rate.unit}</p>
      <p className="mt-3 pt-3 border-t border-line-soft text-[13px] text-muted-2 flex items-center justify-between">
        <span>{rate.note}</span>
        <Arrow className="w-4 h-4 text-muted-2 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
      </p>
    </Link>
  );
}

const WHO = [
  { slug: 'agriculture', label: 'Farmers' },
  { slug: 'women', label: 'Women and girls' },
  { slug: 'education', label: 'Students' },
  { slug: 'senior-citizen', label: 'Senior citizens' },
  { slug: 'business', label: 'Small business' },
  { slug: 'housing', label: 'Home buyers' },
  { slug: 'healthcare', label: 'Health cover' },
  { slug: 'employment', label: 'Job seekers' },
  { slug: 'disability', label: 'People with disabilities' },
  { slug: 'pension', label: 'Pensions' },
];

const GUIDES = [
  { href: '/guides/old-vs-new-tax-regime', a: 'Old', b: 'New', title: 'Old or new tax regime', text: 'Which one leaves more of your salary with you this year.', tone: 'from-[#1C3A5E] to-[#2E5A8A]' },
  { href: '/guides/sip-vs-fd', a: 'SIP', b: 'FD', title: 'SIP or fixed deposit', text: 'Growth against certainty, and how tax changes the answer.', tone: 'from-[#2C6E6E] to-[#3E8C8C]' },
  { href: '/guides/ppf-vs-nps', a: 'PPF', b: 'NPS', title: 'PPF or NPS', text: 'Two long-term savings options compared on return, lock-in and tax.', tone: 'from-[#6A45A6] to-[#8763C2]' },
  { href: '/guides/22k-vs-24k-gold', a: '22K', b: '24K', title: '22K or 24K gold', text: 'Which purity to buy for jewellery, and which to hold as savings.', tone: 'from-[#94670A] to-[#B8860B]' },
];

const HOME_FAQS = [
  {
    question: 'What is Paisa Reality?',
    answer:
      'A free website for Indian families: daily prices for gold, silver, fuel and LPG, the government schemes, scholarships and startup grants you may qualify for, bank rate comparisons, and calculators. We give you information and tools. We are not financial advisers and we do not sell financial products.',
  },
  {
    question: 'Is it free? Do I need an account?',
    answer:
      'Everything is free and most of it works without an account. An account lets you save schemes, track applications and get an email when gold or silver reaches a price you set.',
  },
  {
    question: 'Where do the prices come from?',
    answer:
      'Gold and silver are computed from the international spot price, the rupee exchange rate, import duty and GST, then checked every day against published Indian dealer rates. Petrol, diesel and LPG come from the rates the oil companies publish. Every price page shows the date it was verified and the source. The full method is on our methodology page.',
  },
  {
    question: 'How do you decide which schemes I qualify for?',
    answer:
      'You answer a few questions about your age, state, work, income and family. We check those answers against the published eligibility rules of each scheme and show the ones that fit, along with the documents you will need and a link to the official portal. The official rules are always the final word.',
  },
  {
    question: 'Do you apply on my behalf or charge a fee?',
    answer:
      'No. We never apply for you and never ask for money to apply. Government schemes and most scholarships are free to apply for on their official portals. If anyone asks you for a fee to get a scheme sanctioned, treat it as a scam.',
  },
];

export default async function HomePage(): Promise<React.ReactElement> {
  const [counts, { asOf, updatedAt, rates }, schemes, cats, topSch, grantList] = await Promise.all([
    getHomeCounts(), getHomeRates(), getFeaturedSchemes(), getSchemeCategoryCounts(20), getTopScholarships(3), getGrants(),
  ]);
  const topGrants = [...grantList].sort((a, b) => (b.amountMaxInr ?? 0) - (a.amountMaxInr ?? 0)).filter((g) => g.fundingType !== 'in-kind').slice(0, 3);

  const catCount = (slug: string): number => cats.find((x) => x.category === slug)?.n ?? 0;
  const slides: HeroSlide[] = [
    {
      id: 'schemes',
      title: 'Find the government schemes your family can claim.',
      text: 'Answer a few questions about age, state, work and income. We check them against the published rules of every central and state scheme and show what fits, with the documents to keep ready.',
      cta: { href: '/schemes', label: 'Find your schemes' },
      panel: {
        caption: 'How it works',
        rows: [
          { label: '1. Answer a few questions', value: '2 minutes', sub: 'No sign-up, no documents' },
          { label: '2. See what you qualify for', value: `${counts.schemes} schemes`, sub: 'Central and state' },
          { label: '3. Apply on the official portal', value: 'Free', sub: 'We never charge or apply for you' },
        ],
        foot: 'The official rules are always the final word.',
      },
    },
    {
      id: 'scholarships',
      title: 'Scholarships that fit your class, course and family income.',
      text: 'Government and private scholarships in one list, filtered for you, with a reminder email before the last date so a deadline never slips past.',
      cta: { href: '/scholarships', label: 'See scholarships' },
      panel: {
        caption: `Some of the ${counts.scholarships} scholarships listed`,
        rows: topSch.map((x) => ({ label: x.name, value: x.amountMax ? `Up to ${inr(x.amountMax)}` : '' , sub: x.level === 'state' ? undefined : 'All India' })),
        foot: 'Amounts are the published maximum per year.',
      },
    },
    {
      id: 'grants',
      title: 'Startup grants and programmes open to Indian founders.',
      text: 'Government seed funds, state idea grants and global accelerators, with how much you can get, whether they take equity and who qualifies. Closed or broken listings are removed automatically.',
      cta: { href: '/grants', label: 'Browse startup grants' },
      panel: {
        caption: `${counts.grants} programmes checked on their official pages`,
        rows: topGrants.map((g) => ({ label: g.name.replace(/\s*\(.*?\)\s*/g, ' ').trim(), value: formatAmount(g.amountMinInr, g.amountMaxInr) ?? 'Case by case', sub: FUNDING_LABEL[g.fundingType] })),
        foot: 'Links are rechecked every day.',
      },
    },
    {
      id: 'real-return',
      title: 'Before you sign that policy, check its real return.',
      text: 'Insurance savings plans are sold on the total you get back. Type in the offer as it was pitched and see the one number the pitch leaves out: the yearly return.',
      cta: { href: '/calculators/real-return', label: 'Check an offer' },
      panel: {
        caption: 'A typical pitch, worked out',
        rows: [
          { label: 'You pay', value: `${inr(50000)} a year`, sub: 'for 15 years' },
          { label: 'You get', value: inr(1400000), sub: 'after 20 years' },
          { label: 'Yearly return', value: '4.8%', sub: 'less than a 5-year post office deposit' },
        ],
        foot: 'Worked out with XIRR, the method banks and mutual funds use.',
      },
    },
  ];

  return (
    <>
      <HeroCarousel slides={slides} />

      {/* Today's rates */}
      {rates.length > 0 && (
        <section className="section-band">
          <div className="container-main py-14 sm:py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div className="max-w-2xl">
                <h2 className="section-title">Today&apos;s rates</h2>
                <p className="mt-3 text-muted leading-relaxed">
                  Gold and silver are averages of the 50 cities we track, before 3% GST and making charges. Fuel and LPG are
                  the oil companies&apos; published Delhi rates. Open any card for your city.
                </p>
              </div>
              {(updatedAt || asOf) && (
                <p className="shrink-0 text-sm text-muted-2 tabular">As of {updatedAt ? istStamp(updatedAt) : istDate(asOf)}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rates.map((r) => <RateCard key={r.label} rate={r} />)}
            </div>
            <p className="mt-5 text-[13px] text-muted-2">
              Sources: international spot price and USD/INR for metals; IOCL, BPCL and HPCL for fuel and LPG.{' '}
              <Link href="/methodology" className="link-internal">Methodology</Link>
            </p>
          </div>
        </section>
      )}

      <AdSlot placement="home-top" format="horizontal" className="container-main my-6" />

      {/* Browse by who you are */}
      {cats.length > 0 && (
        <section>
          <div className="container-main py-16 sm:py-20">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="section-title">Schemes for people like you</h2>
              <p className="section-lead mx-auto">Start from who you are. Each list shows every central and state scheme in that group.</p>
            </div>
            <ul className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {WHO.filter((w) => catCount(w.slug) > 0).map((w) => (
                <li key={w.slug}>
                  <Link href={`/category/${w.slug}`} className="card card-link !p-5 h-full flex flex-col items-start gap-4 group">
                    <CategoryIcon category={w.slug} />
                    <span>
                      <span className="block font-semibold text-ink group-hover:text-navy transition-colors">{w.label}</span>
                      <span className="block mt-0.5 text-sm text-muted-2">{catCount(w.slug)} schemes</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Popular schemes */}
      {schemes.length > 0 && (
        <section className="section-band">
          <div className="container-main py-16 sm:py-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
              <div>
                <h2 className="section-title">Schemes people check most</h2>
                <p className="mt-2 text-muted">Eligibility, benefits, documents and the official link on every page.</p>
              </div>
              <Link href="/schemes" className="btn-link text-[15px] shrink-0">All {counts.schemes || ''} schemes <Arrow /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemes.map((s) => (
                <Link key={s.slug} href={`/schemes/${s.slug}`} className="card card-link !p-6 group flex flex-col">
                  <span className="flex items-center gap-3"><CategoryIcon category={s.category} className="w-9 h-9" /><span className="text-[13px] text-muted-2 capitalize">{s.category.replace(/-/g, ' ')}</span></span>
                  <h3 className="mt-4 text-[17px] font-semibold leading-snug">{s.name}</h3>
                  <p className="mt-2 text-[15px] text-muted leading-relaxed line-clamp-2 flex-1">{s.benefit}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-navy">
                    Eligibility and how to apply <Arrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="section-title">Why you can trust these numbers</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center">
            {[
              {
                title: 'Every number has a date and a source',
                text: 'Price pages say when the figure was verified and where it came from. Scheme pages link to the official portal.',
                href: '/methodology',
                link: 'Our methodology',
              },
              {
                title: 'Nothing to sell you',
                text: 'We do not sell insurance, loans or funds, and no bank or insurer pays to be listed or ranked higher.',
                href: '/editorial-policy',
                link: 'Editorial policy',
              },
              {
                title: 'Mistakes get fixed fast',
                text: 'Spot a wrong figure and tell us. We check it against the source and aim to correct it within 48 hours.',
                href: '/contact',
                link: 'Report an error',
              },
            ].map((t) => (
              <div key={t.title} className="max-w-sm mx-auto">
                <h3 className="text-lg font-semibold">{t.title}</h3>
                <p className="mt-3 text-muted leading-relaxed">{t.text}</p>
                <Link href={t.href} className="btn-link mt-4 text-[15px]">{t.link} <Arrow /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="section-band">
        <div className="container-main py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
            <div>
              <h2 className="section-title">Decide with the numbers in front of you</h2>
              <p className="mt-2 text-muted">Plain-language comparisons for the choices people ask us about most.</p>
            </div>
            <Link href="/guides" className="btn-link text-[15px] shrink-0">All guides <Arrow /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GUIDES.map((g) => (
              <Link key={g.href} href={g.href} className="group rounded-xl border border-line bg-white overflow-hidden no-underline text-ink shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200">
                <div className={`relative h-32 bg-gradient-to-br ${g.tone} flex items-center justify-center gap-4 text-white`}>
                  <span className="text-[34px] font-semibold tracking-[-0.03em]">{g.a}</span>
                  <span className="text-sm text-white/70">or</span>
                  <span className="text-[34px] font-semibold tracking-[-0.03em]">{g.b}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold group-hover:text-navy transition-colors">{g.title}</h3>
                  <p className="mt-1.5 text-[15px] text-muted leading-relaxed">{g.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="container-main py-16 sm:py-20 max-w-3xl">
          <FAQ items={HOME_FAQS} title="Common questions" />
        </div>
      </section>

      <AdSlot placement="home-mid" format="horizontal" className="container-main my-8" />
    </>
  );
}
