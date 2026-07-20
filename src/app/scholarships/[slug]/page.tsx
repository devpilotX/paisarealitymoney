import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';
import ScholarshipReminderForm from '@/components/ScholarshipReminderForm';
import { pageMetadata } from '@/lib/seo';
import { formatNumber } from '@/lib/constants';
import { getScholarshipBySlug, type Scholarship } from '@/lib/scholarships';
import { breadcrumbSchema, scholarshipSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

interface RouteParams { params: Promise<{ slug: string }>; }

function formatDeadline(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function load(slug: string): Promise<Scholarship | null> {
  try {
    return await getScholarshipBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const s = await load(slug);
  if (!s) {
    return pageMetadata({ title: 'Scholarship', description: 'Scholarship details.', path: `/scholarships/${slug}` });
  }
  const desc = (s.metaDescription ?? s.benefitSummary ?? `${s.name} eligibility, documents and how to apply.`).slice(0, 160);
  return pageMetadata({
    title: s.metaTitle ?? `${s.name}: Eligibility, Documents and How to Apply`,
    description: desc,
    path: `/scholarships/${slug}`,
  });
}

export default async function ScholarshipDetailPage({ params }: RouteParams): Promise<React.ReactElement> {
  const { slug } = await params;
  const s = await load(slug);
  if (!s) notFound();

  const ldDescription = (s.benefitSummary ?? `${s.name}: eligibility, documents and how to apply.`).slice(0, 200);
  const jsonLd = [
    breadcrumbSchema([{ label: 'Scholarships', href: '/scholarships' }, { label: s.name }]),
    scholarshipSchema({
      name: s.name,
      description: ldDescription,
      path: `/scholarships/${s.slug}`,
      provider: s.provider,
      amount: s.amountMax,
      officialUrl: s.officialUrl,
    }),
  ];

  return (
    <div className="container-main py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb items={[{ label: 'Scholarships', href: '/scholarships' }, { label: s.name }]} />

      <div className="max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary">
            {s.level === 'state' ? 'State Govt' : 'Central Govt'}
          </span>
          {s.deadline ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-red/10 text-brand-red">
              Closes {formatDeadline(s.deadline)}
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper-2 text-muted border border-line">
              Dates announced on the portal
            </span>
          )}
        </div>

        <h1 className="heading-1">{s.name}</h1>
        {s.provider && <p className="mt-2 text-muted-2">{s.provider}</p>}

        {s.amountMax != null && s.amountMax > 0 && (
          <div className="mt-6 inline-block rounded-xl bg-primary-50 px-5 py-3">
            <span className="text-xs font-medium text-primary-700">Benefit up to</span>
            <p className="text-3xl font-extrabold text-primary">Rs {formatNumber(s.amountMax)}</p>
          </div>
        )}
      </div>

      <AdBanner format="horizontal" className="my-8" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          {s.benefitSummary && (
            <section className="mb-6">
              <h2 className="heading-2 mb-2">What you get</h2>
              <p className="text-body">{s.benefitSummary}</p>
            </section>
          )}
          {s.eligibilitySummary && (
            <section className="mb-6">
              <h2 className="heading-2 mb-2">Who is eligible</h2>
              <p className="text-body">{s.eligibilitySummary}</p>
            </section>
          )}
          {s.documents.length > 0 && (
            <section className="mb-6">
              <h2 className="heading-2 mb-2">Documents you need</h2>
              <ul className="list-disc pl-6 space-y-1.5 text-muted">
                {s.documents.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
          )}
          {s.howToApply && (
            <section className="mb-6">
              <h2 className="heading-2 mb-2">How to apply</h2>
              <p className="text-body">{s.howToApply}</p>
            </section>
          )}
          {s.officialUrl && (
            <p className="mb-4">
              <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-primary no-underline">
                Apply on the official portal
              </a>
            </p>
          )}
          {s.lastVerified && (
            <p className="text-sm text-muted-2">
              Last verified on {formatDeadline(s.lastVerified)}. Dates and rules can change, so always confirm on the official portal.
            </p>
          )}
        </article>

        <aside className="lg:col-span-1">
          <div className="card lg:sticky lg:top-24">
            <h2 className="font-serif text-xl font-bold text-navy">Do not miss the deadline</h2>
            <p className="mt-1 mb-4 text-sm text-muted">
              We will email you a reminder before this scholarship closes. Free, one email.
            </p>
            <ScholarshipReminderForm slug={s.slug} />
          </div>
        </aside>
      </div>

      <AdBanner format="horizontal" className="mt-10 mb-8" />
    </div>
  );
}
