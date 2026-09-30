import Link from 'next/link';
import { query } from '@/lib/db';
import { CLASS_LEVELS, CATEGORIES, type Scholarship } from '@/lib/scholarships';
import type { QueryResultRow } from 'pg';

const inr = (v: number): string => '\u20B9' + v.toLocaleString('en-IN');
const label = (list: ReadonlyArray<{ value: string; label: string }>, v: string): string => list.find((x) => x.value === v)?.label ?? v;

/**
 * A checklist built from the scholarship's own rules, and other scholarships
 * for the same stage of study. Both come from the record, so each page differs.
 */
export default async function ScholarshipDetails({ s, part }: { s: Scholarship; part: 'glance' | 'similar' }): Promise<React.ReactElement | null> {
  const checks: Array<[string, string]> = [];
  if (s.classLevels.length) checks.push(['Studying in', s.classLevels.map((v) => label(CLASS_LEVELS, v)).join(', ')]);
  checks.push(['Category', s.categories.includes('all') || s.categories.length === 0 ? 'Open to all categories' : s.categories.map((v) => label(CATEGORIES, v)).join(', ')]);
  checks.push(['Gender', s.gender === 'female' ? 'Girls and women only' : s.gender === 'male' ? 'Boys and men only' : 'Any']);
  checks.push(['Family income', s.incomeMax ? `Up to ${inr(s.incomeMax)} a year` : 'No income limit published']);
  checks.push(['Where', s.state ? `Residents of ${s.state}` : 'Anywhere in India']);
  if (s.amountMax) checks.push(['Amount', s.amountMin && s.amountMin !== s.amountMax ? `${inr(s.amountMin)} to ${inr(s.amountMax)}` : `Up to ${inr(s.amountMax)}`]);

  if (part === 'glance') return (
    <section className="mb-8 card-flat !p-0 overflow-hidden">
      <h2 className="heading-3 px-6 pt-6">At a glance</h2>
      <p className="px-6 mt-1 text-sm text-muted">If each line fits you, you are likely eligible. The official rules decide.</p>
      <dl className="mt-4 divide-y divide-line-soft border-t border-line">
        {checks.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] gap-4 px-6 py-3 text-[15px]">
            <dt className="text-muted">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  let similar: Array<{ slug: string; name: string; amount_max: number | null }> = [];
  try {
    similar = await query<QueryResultRow & { slug: string; name: string; amount_max: number | null }>(
      `SELECT slug, name, amount_max FROM scholarships
        WHERE active AND slug <> $1 AND class_levels && $2::text[] AND (state IS NULL OR state = $3)
        ORDER BY (state = $3) DESC NULLS LAST, amount_max DESC NULLS LAST LIMIT 6`,
      [s.slug, s.classLevels, s.state],
    );
  } catch { /* the section is optional */ }

  if (similar.length === 0) return null;
  return (
    <section className="mt-12 mb-4">
      <h2 className="heading-2">Other scholarships at this stage</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {similar.map((x) => (
          <li key={x.slug}>
            <Link href={`/scholarships/${x.slug}`} className="card card-link !p-5 block">
              <span className="block font-semibold leading-snug">{x.name}</span>
              <span className="block mt-1 text-sm text-muted">{x.amount_max ? `Up to ${inr(x.amount_max)}` : 'Amount on the official portal'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
