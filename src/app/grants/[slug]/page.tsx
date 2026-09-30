import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import { pageMetadata, fitTitle, buildRecordDescription, absoluteUrl, currentYearIST } from '@/lib/seo';
import {
  getGrantBySlug, getGrantSlugs, getGrants, formatAmount, daysLeft,
  KIND_LABEL, FUNDING_LABEL, STAGE_LABEL, STATUS_LABEL, type Grant,
} from '@/lib/grants';

export const revalidate = 3600;
export const dynamicParams = true;

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return (await getGrantSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGrantBySlug(slug);
  if (!g) return { title: 'Programme not found', robots: { index: false } };
  const year = currentYearIST();
  return pageMetadata({
    title: fitTitle(g.name, [` ${year}: Eligibility, Amount, How to Apply`, ` ${year}: Eligibility and Amount`, ` ${year}: Eligibility`, ` ${year}`]),
    description: buildRecordDescription(g.summary, g.name),
    path: `/grants/${g.slug}`,
    ogType: 'article',
  });
}

function istLong(iso: string): string {
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function applicationLine(g: Grant): string {
  const d = daysLeft(g.deadline);
  if (g.deadline && d !== null) {
    return d === 0 ? 'Applications close today.' : `Applications close on ${istLong(g.deadline)}, ${d} day${d === 1 ? '' : 's'} from now.`;
  }
  switch (g.status) {
    case 'rolling': return 'You can apply at any time. There is no fixed last date.';
    case 'cohort': return 'Selection happens in cohorts. Applications open for each new batch.';
    case 'open': return 'Applications are open now. The official page has the current last date.';
    default: return 'The current round has closed. The programme runs again; check the official page for the next round.';
  }
}

function Check(): React.ReactElement {
  return (
    <svg className="w-5 h-5 text-navy shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}

function External(): React.ReactElement {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export default async function GrantPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;
  const g = await getGrantBySlug(slug);
  if (!g) notFound();

  const amount = formatAmount(g.amountMinInr, g.amountMaxInr);
  const related = (await getGrants())
    .filter((x) => x.slug !== g.slug && (x.region === g.region || x.kind === g.kind))
    .slice(0, 4);
  const where = g.region === 'international' ? 'International' : g.state ?? (g.level === 'central' ? 'Government of India' : 'India');

  const facts: Array<[string, string]> = [
    ['What it is', KIND_LABEL[g.kind] ?? g.kind],
    ['Money', amount ?? 'Decided case by case'],
    ['Equity', g.equityTaken ?? FUNDING_LABEL[g.fundingType] ?? g.fundingType],
    ['Stage', g.stage.map((s) => STAGE_LABEL[s] ?? s).join(', ') || 'Any'],
    ['Sectors', g.sectors.includes('all') ? 'All sectors' : g.sectors.join(', ')],
    ['Run by', g.provider],
  ];

  const faqs = [
    { question: `Who can apply for ${g.name}?`, answer: g.eligibility.join('. ').replace(/\.\./g, '.') + '.' },
    { question: `How much money does ${g.name} give?`, answer: g.amountNote ?? (amount ? `${amount}.` : 'The amount is decided case by case.') },
    { question: `Does ${g.name} take equity?`, answer: g.equityTaken ?? FUNDING_LABEL[g.fundingType] ?? 'See the official page.' },
    { question: `What is the last date to apply for ${g.name}?`, answer: applicationLine(g) + (g.cycleNote ? ` ${g.cycleNote}` : '') },
    { question: `How do I apply for ${g.name}?`, answer: g.howToApply ?? 'Apply on the official page linked above.' },
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MonetaryGrant',
    name: g.name,
    description: g.summary,
    url: absoluteUrl(`/grants/${g.slug}`),
    funder: { '@type': 'Organization', name: g.provider, url: g.officialUrl },
    ...(g.amountMaxInr ? { amount: { '@type': 'MonetaryAmount', currency: 'INR', ...(g.amountMinInr ? { minValue: g.amountMinInr } : {}), maxValue: g.amountMaxInr } } : {}),
    sameAs: g.officialUrl,
  };

  return (
    <div className="container-main py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: 'Startup grants', href: '/grants' }, { label: g.name }]} />

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="min-w-0">
          <p className="text-sm text-muted-2">{KIND_LABEL[g.kind] ?? g.kind} &middot; {where}</p>
          <h1 className="heading-1 mt-2">{g.name}</h1>
          <p className="mt-4 text-lg text-muted leading-relaxed max-w-prose">{g.summary}</p>

          <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 border border-line rounded-xl overflow-hidden">
            {facts.map(([k, v], i) => (
              <div key={k} className={`p-5 ${i % 2 === 1 ? 'sm:border-l' : ''} ${i >= 2 ? 'border-t' : i === 1 ? 'border-t sm:border-t-0' : ''} border-line`}>
                <dt className="text-sm text-muted-2">{k}</dt>
                <dd className="mt-1 font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {g.amountNote && <p className="mt-3 text-sm text-muted leading-relaxed max-w-prose">{g.amountNote}</p>}

          <section className="mt-12">
            <h2 className="heading-2">Do you qualify?</h2>
            <p className="mt-2 text-muted">You should be able to say yes to each of these.</p>
            <ul className="mt-5 space-y-3">
              {g.eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-ink leading-relaxed"><Check /><span>{e}</span></li>
              ))}
            </ul>
          </section>

          {g.documents.length > 0 && (
            <section className="mt-12">
              <h2 className="heading-2">Keep these ready</h2>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2">
                {g.documents.map((d) => (
                  <li key={d} className="rounded-lg border border-line px-4 py-3 text-[15px]">{d}</li>
                ))}
              </ul>
            </section>
          )}

          {g.howToApply && (
            <section className="mt-12">
              <h2 className="heading-2">How to apply</h2>
              <p className="mt-4 text-ink/90 leading-[1.75] max-w-prose">{g.howToApply}</p>
              {g.cycleNote && <p className="mt-3 text-muted max-w-prose">{g.cycleNote}</p>}
            </section>
          )}

          <div className="mt-12 callout-navy max-w-prose">
            <p className="text-[15px] leading-relaxed">
              Applying is free. No programme on this page charges a fee, and nobody can guarantee selection. If someone
              asks for money to get your grant approved, do not pay.
            </p>
          </div>

          <div className="max-w-3xl">
            <FAQ items={faqs} />
          </div>
        </article>

        <aside className="lg:sticky lg:top-28 self-start space-y-4">
          <div className="card !p-6">
            <p className={`${g.status === 'open' || g.status === 'rolling' ? 'badge-green' : 'badge-soft'}`}>{STATUS_LABEL[g.status]}</p>
            <p className="mt-4 text-[15px] text-ink leading-relaxed">{applicationLine(g)}</p>
            <a href={g.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-5">
              Apply on the official site <External />
            </a>
            {g.officialUrl !== g.applyUrl && (
              <a href={g.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full mt-2">
                Read the official guidelines <External />
              </a>
            )}
            <p className="mt-4 text-[13px] text-muted-2 leading-relaxed">
              Checked on the official page on {istLong(g.verifiedOn)}. We recheck the link every day and take this page down
              if the programme closes or the page stops working.
            </p>
          </div>
          <Link href="/grants" className="btn-link text-[15px]">All startup grants</Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 pt-10 border-t border-line">
          <h2 className="heading-2">Similar programmes</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <Link key={r.slug} href={`/grants/${r.slug}`} className="card card-link !p-5">
                <p className="text-[13px] text-muted-2">{KIND_LABEL[r.kind] ?? r.kind}</p>
                <p className="mt-1 font-semibold leading-snug">{r.name}</p>
                <p className="mt-2 text-sm text-muted">{formatAmount(r.amountMinInr, r.amountMaxInr) ?? 'Amount case by case'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
