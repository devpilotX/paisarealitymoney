import type { Metadata } from 'next';
import Link from 'next/link';
import FAQ from '@/components/FAQ';
import AdSlot from '@/components/AdSlot';
import { getFeaturedSchemes, getHomeCounts, getHomeRates, type HomeRate } from '@/lib/home-data';

export const metadata: Metadata = {
  title: 'Paisa Reality: Live Prices, Government Schemes & Money Tools',
  description:
    'Daily gold, silver and fuel prices for 50 cities, government schemes, scholarships and startup grants you can check, and calculators that show the real maths.',
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

function RateCard({ rate }: { rate: HomeRate }): React.ReactElement {
  const decimals = rate.unit === 'per litre' ? 2 : 0;
  const c = rate.changePct;
  const flat = c === null || Math.abs(c) < 0.005;
  return (
    <Link href={rate.href} className="card card-link !p-5 group">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium text-muted">{rate.label}</span>
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
  {
    question: 'What if I find a wrong number?',
    answer:
      'Tell us through the contact page with a link to the page. We check it against the source and aim to correct genuine errors within 48 hours.',
  },
];

export default async function HomePage(): Promise<React.ReactElement> {
  const [counts, { asOf, rates }, schemes] = await Promise.all([getHomeCounts(), getHomeRates(), getFeaturedSchemes()]);

  const paths = [
    {
      title: 'Government schemes',
      text: 'Answer a few questions and see the central and state schemes you are likely to qualify for, with the documents to keep ready.',
      stat: counts.schemes ? `${counts.schemes} schemes` : null,
      href: '/schemes',
      cta: 'Find your schemes',
    },
    {
      title: 'Scholarships',
      text: 'Government and private scholarships by class, course, category and family income, with a reminder before the last date.',
      stat: counts.scholarships ? `${counts.scholarships} scholarships` : null,
      href: '/scholarships',
      cta: 'See scholarships',
    },
    {
      title: 'Startup grants',
      text: 'Grants, seed funds and accelerators open to Indian founders, with who qualifies, what they give and how to apply.',
      stat: counts.grants ? `${counts.grants} open programmes` : null,
      href: '/grants',
      cta: 'Browse grants',
    },
    {
      title: 'Money Health Score',
      text: 'A few minutes, no sign-up. A score out of 900 across savings, debt, insurance and retirement, with the next step for each.',
      stat: 'Free, private',
      href: '/score',
      cta: 'Check your score',
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="container-main pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <h1 className="display text-balance max-w-4xl mx-auto">
            Money information you can check for yourself.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed text-pretty">
            Today&apos;s gold and fuel prices, the schemes, scholarships and grants you may qualify for, and
            calculators that show the real maths. Every number is dated and sourced.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link href="/schemes" className="btn-primary !px-6 !min-h-[48px]">
              Find schemes for you <Arrow />
            </Link>
            <Link href="/gold-rate" className="btn-secondary !px-6 !min-h-[48px]">
              See today&apos;s gold rate
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted">
            {counts.schemes > 0 && <li><strong className="text-ink font-semibold">{counts.schemes}</strong> government schemes</li>}
            {counts.scholarships > 0 && <li><strong className="text-ink font-semibold">{counts.scholarships}</strong> scholarships</li>}
            {counts.cities > 0 && <li>Prices in <strong className="text-ink font-semibold">{counts.cities}</strong> cities</li>}
            <li>No sign-up needed</li>
          </ul>
        </div>
      </section>

      {/* Today's rates */}
      {rates.length > 0 && (
        <section className="section-band">
          <div className="container-main py-14 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
              <div>
                <h2 className="section-title">Today&apos;s rates</h2>
                <p className="mt-2 text-muted">
                  {asOf ? `As of ${istDate(asOf)}. ` : ''}Gold and silver are India averages before GST and making charges.
                </p>
              </div>
              <Link href="/methodology" className="btn-link text-[15px] shrink-0">How we compute these <Arrow /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rates.map((r) => <RateCard key={r.label} rate={r} />)}
            </div>
          </div>
        </section>
      )}

      {/* Paths */}
      <section className="section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="section-title">Start with what you need</h2>
            <p className="section-lead mx-auto">Four places most people begin. Each one takes a few minutes and costs nothing.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
            {paths.map((p) => (
              <Link key={p.href} href={p.href} className="card card-link !p-7 flex flex-col group">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold tracking-[-0.01em]">{p.title}</h3>
                  {p.stat && <span className="badge-soft shrink-0">{p.stat}</span>}
                </div>
                <p className="mt-3 text-muted leading-relaxed flex-1">{p.text}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-navy">
                  {p.cta} <Arrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AdSlot placement="home-top" format="horizontal" className="container-main mb-4" />

      {/* Real return spotlight */}
      <section className="container-main pb-16 sm:pb-20">
        <div className="rounded-2xl bg-navy-deep text-white px-6 py-12 sm:px-14 sm:py-16 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <h2 className="text-white font-semibold tracking-[-0.025em] leading-[1.12] text-[30px] sm:text-[40px]">
              Before you sign that policy, check its real return.
            </h2>
            <p className="mt-5 text-white/75 text-lg leading-relaxed max-w-xl">
              Insurance savings plans are sold on the total you get back. Type in the offer exactly as the agent
              pitched it and see the one number the pitch leaves out: the yearly return.
            </p>
            <Link href="/calculators/real-return" className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-white text-navy-deep font-semibold no-underline hover:bg-white/90 hover:text-navy-deep transition-colors">
              Check an offer <Arrow />
            </Link>
          </div>
          <div className="rounded-xl bg-white/[0.06] border border-white/10 p-6 sm:p-8">
            <p className="text-white/60 text-sm">The pitch</p>
            <p className="mt-1 text-xl font-medium">Pay {inr(50000)} a year for 15 years. Get {inr(1400000)} after 20.</p>
            <div className="my-6 border-t border-white/10" />
            <p className="text-white/60 text-sm">The yearly return</p>
            <p className="mt-1 text-[44px] font-semibold tracking-[-0.03em] leading-none tabular">4.8%</p>
            <p className="mt-3 text-sm text-white/60">Less than a 5-year post office deposit pays today.</p>
          </div>
        </div>
      </section>

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
                  <span className="text-[13px] text-muted-2 capitalize">{s.category.replace(/-/g, ' ')}</span>
                  <h3 className="mt-1.5 text-[17px] font-semibold leading-snug">{s.name}</h3>
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
            <h2 className="section-title">Why you can rely on what you read here</h2>
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

      {/* Calculators */}
      <section className="border-t border-line">
        <div className="container-main py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="heading-2">Quick calculators</h2>
              <p className="mt-2 text-muted">They run in your browser. Nothing you type leaves your device.</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {[
                ['/calculators/emi', 'EMI'],
                ['/calculators/sip', 'SIP'],
                ['/calculators/income-tax', 'Income tax'],
                ['/calculators/fd', 'FD'],
                ['/calculators/ppf', 'PPF'],
                ['/calculators/home-loan', 'Home loan'],
                ['/calculators/gratuity', 'Gratuity'],
                ['/calculators/hra', 'HRA'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href!} className="inline-flex items-center h-10 px-4 rounded-full border border-line text-[15px] font-medium text-ink no-underline hover:border-navy hover:text-navy transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-band">
        <div className="container-main py-16 sm:py-20 max-w-3xl">
          <FAQ items={HOME_FAQS} title="Common questions" />
        </div>
      </section>

      <AdSlot placement="home-mid" format="horizontal" className="container-main my-8" />
    </>
  );
}
