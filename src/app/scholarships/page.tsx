import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import { pageMetadata } from '@/lib/seo';
import { formatNumber } from '@/lib/constants';
import {
  getAllScholarships,
  matchScholarships,
  CLASS_LEVELS,
  CATEGORIES,
  GENDERS,
  type Scholarship,
  type EligibilityProfile,
} from '@/lib/scholarships';

export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: 'Scholarship Finder: Find Scholarships You Qualify For',
  description:
    'Answer a few questions and see the government scholarships you are eligible for, with documents, how to apply, deadlines, and a free reminder before each one closes.',
  path: '/scholarships',
});

const STATES = [
  'All India', 'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha',
  'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const SCHOLARSHIP_FAQS = [
  {
    question: 'How does the scholarship finder work?',
    answer:
      'You answer a few simple questions like your class or course, category, state, and family income. We check your answers against each scholarship and show only the ones you are likely eligible for. Always confirm the final details on the official portal.',
  },
  {
    question: 'Is this free?',
    answer:
      'Yes. Finding scholarships and setting a deadline reminder are completely free. We never charge you and never ask for payment to apply.',
  },
  {
    question: 'How do the deadline reminders work?',
    answer:
      'Open any scholarship, enter your email, and choose how many days before the deadline you want to be reminded. We email you once before it closes so you do not miss it.',
  },
  {
    question: 'Are the dates and amounts guaranteed?',
    answer:
      'No. Scholarship dates, amounts, and rules change, and the official portal is always the final word. We show a last-verified date and link to the official source on every scholarship.',
  },
];

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

function formatDeadline(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ScholarshipCard({ s }: { s: Scholarship }): React.ReactElement {
  return (
    <div className="card flex h-full flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary">
          {s.level === 'state' ? 'State Govt' : 'Central Govt'}
        </span>
        {s.deadline ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-red/10 text-brand-red">
            Closes {formatDeadline(s.deadline)}
          </span>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper-2 text-muted border border-line">
            Dates on portal
          </span>
        )}
      </div>
      <Link href={`/scholarships/${s.slug}`} className="no-underline">
        <h3 className="mb-1 font-serif text-lg font-bold text-navy hover:text-brand-red transition-colors">{s.name}</h3>
      </Link>
      {s.provider && <p className="mb-2 text-sm text-muted-2">{s.provider}</p>}
      {s.benefitSummary && <p className="mb-3 line-clamp-2 text-sm text-muted leading-relaxed">{s.benefitSummary}</p>}
      {s.amountMax != null && s.amountMax > 0 && (
        <div className="mb-3 rounded-xl bg-primary-50 px-3 py-2">
          <span className="text-xs font-medium text-primary-700">Benefit up to</span>
          <p className="text-lg font-extrabold text-primary">Rs {formatNumber(s.amountMax)}</p>
        </div>
      )}
      <Link
        href={`/scholarships/${s.slug}`}
        className="link-internal mt-auto inline-flex items-center gap-1 text-sm font-semibold"
      >
        View details, documents and deadline
      </Link>
    </div>
  );
}

export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const classLevel = str(sp.class);
  const category = str(sp.category);
  const state = str(sp.state);
  const gender = str(sp.gender);
  const incomeRaw = str(sp.income);
  const income = incomeRaw ? Number(incomeRaw) : null;
  const submitted = Boolean(classLevel || category || state || gender || incomeRaw);

  const profile: EligibilityProfile = {
    classLevel: classLevel || undefined,
    category: category || undefined,
    state: state && state !== 'All India' ? state : undefined,
    gender: gender || undefined,
    income: income && income > 0 ? income : null,
  };

  let results: Scholarship[] = [];
  let dbReady = true;
  try {
    results = submitted ? await matchScholarships(profile) : await getAllScholarships();
  } catch {
    dbReady = false;
  }

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Scholarships' }]} />

      <div className="text-center mb-8">
        <h1 className="heading-1 mb-3">Scholarship Finder</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Answer a few questions and see the scholarships you are eligible for, with the documents you
          need, how to apply, and a free reminder before each deadline. All free.
        </p>
      </div>

      <AdBanner format="horizontal" />

      {/* Eligibility form */}
      <form method="get" action="/scholarships" className="card grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 my-8">
        <label className="block">
          <span className="text-sm font-medium text-ink">Class or course</span>
          <select name="class" defaultValue={classLevel} className="input-field mt-1">
            <option value="">Any</option>
            {CLASS_LEVELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Category</span>
          <select name="category" defaultValue={category} className="input-field mt-1">
            <option value="">Any</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">State</span>
          <select name="state" defaultValue={state} className="input-field mt-1">
            <option value="">Any</option>
            {STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Gender</span>
          <select name="gender" defaultValue={gender} className="input-field mt-1">
            <option value="">Any</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Family income (per year)</span>
          <input
            type="number"
            name="income"
            min={0}
            defaultValue={incomeRaw}
            placeholder="e.g. 250000"
            className="input-field mt-1"
          />
        </label>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">Show my scholarships</button>
        </div>
      </form>

      {/* Results */}
      <div className="mt-10">
        <h2 className="heading-2 mb-1">
          {submitted ? 'Scholarships you may qualify for' : 'All scholarships'}
        </h2>
        <p className="text-sm text-muted-2 mb-6">
          {dbReady
            ? `${results.length} ${results.length === 1 ? 'scholarship' : 'scholarships'} listed. Verify final details on the official portal.`
            : 'Scholarship data is being set up. Please check back shortly.'}
        </p>

        {dbReady && results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => (
              <ScholarshipCard key={s.slug} s={s} />
            ))}
          </div>
        ) : dbReady ? (
          <div className="card text-center">
            <p className="text-body">
              No scholarships matched those answers. Try widening a filter, for example set income or
              state to Any.
            </p>
          </div>
        ) : null}
      </div>

      <InArticleAd className="my-10" />

      <div className="max-w-3xl mx-auto my-8">
        <FAQ items={SCHOLARSHIP_FAQS} />
      </div>

      <AdBanner format="horizontal" className="mb-8" />
    </div>
  );
}
