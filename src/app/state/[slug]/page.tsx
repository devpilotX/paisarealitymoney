import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageMetadata, fitTitle, currentYearIST, brandMetadata } from '@/lib/seo';
import { ALL_INDIAN_STATES } from '@/lib/cities';
import { getStateProfile, type StateScheme } from '@/lib/state-profile';
import Breadcrumb from '@/components/Breadcrumb';
import CategoryIcon from '@/components/CategoryIcon';
import FAQ from '@/components/FAQ';
import AdBanner from '@/components/AdBanner';

interface PageProps { params: Promise<{ slug: string }>; }

const toSlug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const fromSlug = (slug: string): string | undefined => ALL_INDIAN_STATES.find((s) => toSlug(s) === slug);
const inr = (v: number, d = 0): string => '\u20B9' + v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const lakh = (v: number): string => (v >= 1_00_00_000 ? `\u20B9${+(v / 1_00_00_000).toFixed(2)} crore` : v >= 1_00_000 ? `\u20B9${+(v / 1_00_000).toFixed(2)} lakh` : inr(v));
const catLabel = (s: string): string => s.replace(/-/g, ' ').replace(/^./, (m) => m.toUpperCase());

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return ALL_INDIAN_STATES.map((s) => ({ slug: toSlug(s) }));
}

async function buildMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const state = fromSlug(slug);
  if (!state) return { title: 'State not found', robots: { index: false } };
  const p = await getStateProfile(state);
  const year = currentYearIST();
  return pageMetadata({
    title: fitTitle(`${state} Government Schemes`, [` ${year}: State and Central List`, ` ${year}: Full List`, ` ${year}`, '']),
    description: p.stateSchemes.length > 0
      ? `${p.stateSchemes.length} ${state} government schemes plus ${p.centralCount} central schemes open to residents, with eligibility, benefits and how to apply.`
      : `Central government schemes open to residents of ${state}, with eligibility, benefits, documents and how to apply on the official portal.`,
    path: `/state/${slug}`,
  });
}

export const revalidate = 3600;

function SchemeRow({ s }: { s: StateScheme }): React.ReactElement {
  return (
    <li>
      <Link href={`/schemes/${s.slug}`} className="card card-link !p-5 h-full flex gap-4 group">
        <CategoryIcon category={s.category} className="w-10 h-10" />
        <span className="min-w-0">
          <span className="block font-semibold leading-snug group-hover:text-navy transition-colors">{s.name}</span>
          {s.benefit && <span className="block mt-1 text-[15px] text-muted leading-relaxed line-clamp-2">{s.benefit}</span>}
          {s.amountMax ? <span className="block mt-2 text-sm font-medium text-ink">Up to {lakh(s.amountMax)}</span> : null}
        </span>
      </Link>
    </li>
  );
}

export default async function StatePage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const state = fromSlug(slug);
  if (!state) notFound();
  const p = await getStateProfile(state);
  const total = p.stateSchemes.length + p.centralCount;

  const faqs = [
    {
      question: `How many government schemes can people in ${state} apply for?`,
      answer: p.stateSchemes.length > 0
        ? `We list ${total}: ${p.stateSchemes.length} run by the ${state} government and ${p.centralCount} central schemes open to residents of every state. Whether you qualify depends on age, income, work and category, which the scheme finder checks for you.`
        : `We list ${p.centralCount} central schemes open to residents of ${state}. We have not yet verified any scheme run by the ${state} government itself; the state government portal lists them.`,
    },
    {
      question: `Where do I apply for ${state} government schemes?`,
      answer: 'Each scheme page links to the official portal named in its guidelines. Most schemes also accept applications at a Common Service Centre (CSC) or the block or district office. Applying is free; nobody can charge you a fee to get a scheme sanctioned.',
    },
    {
      question: `Do central schemes work the same way in ${state}?`,
      answer: 'The rules are set centrally, but the state usually runs the scheme on the ground, so the office you visit and sometimes the portal differ by state. The scheme page names the official portal; confirm local details there.',
    },
  ];

  return (
    <div className="container-main py-8">
      <Breadcrumb items={[{ label: 'Schemes', href: '/schemes' }, { label: 'By state', href: '/state' }, { label: state }]} />

      <header className="mt-4 max-w-3xl">
        <h1 className="heading-1">Government schemes in {state}</h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          {p.stateSchemes.length > 0
            ? <>Schemes run by the {state} government, the central schemes open to its residents, and what things cost in the state today.</>
            : <>The central schemes open to residents of {state}, and what things cost in the state today.</>}
        </p>
      </header>

      <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 border border-line rounded-xl overflow-hidden">
        {[
          ['State schemes', String(p.stateSchemes.length)],
          ['Central schemes', String(p.centralCount)],
          ['State scholarships', String(p.scholarships.length)],
          ['Cities we price', String(p.cities.length)],
        ].map(([k, v], i) => (
          <div key={k} className={`p-5 ${i > 0 ? 'border-l' : ''} ${i === 2 ? 'max-sm:border-l-0 max-sm:border-t' : ''} ${i === 3 ? 'max-sm:border-t' : ''} border-line`}>
            <dt className="text-sm text-muted-2">{k}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      {p.stateSchemes.length > 0 && (
        <section className="mt-14">
          <h2 className="heading-2">Run by the {state} government</h2>
          <p className="mt-2 text-muted">Only residents of {state} can apply for these.</p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">{p.stateSchemes.map((s) => <SchemeRow key={s.slug} s={s} />)}</ul>
        </section>
      )}

      {(p.cities.length > 0 || p.lpg) && (
        <section className="mt-14">
          <h2 className="heading-2">Prices in {state} today</h2>
          <p className="mt-2 text-muted">Fuel prices differ by state because of VAT, so these are {state}&apos;s own rates.</p>
          <div className="mt-6 overflow-x-auto border border-line rounded-xl">
            <table className="table-clean">
              <thead><tr><th>City</th><th className="!text-right">Gold 22K / g</th><th className="!text-right">Petrol / L</th><th className="!text-right">Diesel / L</th></tr></thead>
              <tbody>
                {p.cities.map((c) => (
                  <tr key={c.slug}>
                    <td className="font-medium">{c.name}</td>
                    <td className="text-right"><Link href={`/gold-rate/${c.slug}`} className="link-internal">{c.gold22 ? inr(c.gold22) : 'n/a'}</Link></td>
                    <td className="text-right"><Link href={`/petrol-price/${c.slug}`} className="link-internal">{c.petrol ? inr(c.petrol, 2) : 'n/a'}</Link></td>
                    <td className="text-right"><Link href={`/diesel-price/${c.slug}`} className="link-internal">{c.diesel ? inr(c.diesel, 2) : 'n/a'}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {p.lpg && (
            <p className="mt-3 text-sm text-muted">
              LPG in {state}: {inr(p.lpg.domestic)} for a 14.2 kg domestic cylinder
              {p.lpg.commercial ? `, ${inr(p.lpg.commercial)} for a 19 kg commercial one` : ''}. <Link href="/lpg-price" className="link-internal">All states</Link>
            </p>
          )}
        </section>
      )}

      {(p.scholarships.length > 0 || p.grants.length > 0) && (
        <section className="mt-14 grid gap-8 md:grid-cols-2">
          {p.scholarships.length > 0 && (
            <div>
              <h2 className="heading-3">Scholarships for {state} students</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {p.scholarships.map((s) => (
                  <li key={s.slug}><Link href={`/scholarships/${s.slug}`} className="flex justify-between gap-4 py-3 no-underline text-ink hover:text-navy">
                    <span>{s.name}</span>{s.amountMax ? <span className="text-muted shrink-0">Up to {lakh(s.amountMax)}</span> : null}
                  </Link></li>
                ))}
              </ul>
            </div>
          )}
          {p.grants.length > 0 && (
            <div>
              <h2 className="heading-3">Startup grants from {state}</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {p.grants.map((g) => (
                  <li key={g.slug}><Link href={`/grants/${g.slug}`} className="flex justify-between gap-4 py-3 no-underline text-ink hover:text-navy">
                    <span>{g.name}</span>{g.amountMax ? <span className="text-muted shrink-0">Up to {lakh(g.amountMax)}</span> : null}
                  </Link></li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <AdBanner format="horizontal" className="mt-12" />

      <section className="mt-14">
        <h2 className="heading-2">Central schemes open to {state} residents</h2>
        <p className="mt-2 text-muted max-w-2xl">
          {p.centralCount} central schemes apply in every state. Four of the largest are below. The finder takes you through the full list and keeps only the ones you qualify for.
        </p>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">{p.centralTop.map((s) => <SchemeRow key={s.slug} s={s} />)}</ul>
        {p.categories.length > 0 && (
          <div className="mt-8">
            <p className="text-sm font-medium text-muted mb-3">Browse by group</p>
            <ul className="flex flex-wrap gap-2">
              {p.categories.map((c) => (
                <li key={c.category}><Link href={`/category/${c.category}`} className="pill no-underline hover:border-navy hover:text-navy">{catLabel(c.category)} &middot; {c.n}</Link></li>
              ))}
            </ul>
          </div>
        )}
        <Link href="/schemes" className="btn-primary mt-8">Check what you qualify for</Link>
      </section>

      <div className="mt-8 max-w-3xl"><FAQ items={faqs} /></div>

      <section className="mt-10 pt-8 border-t border-line">
        <h2 className="text-sm font-medium text-muted mb-3">Other states</h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
          {ALL_INDIAN_STATES.filter((s) => s !== state).map((s) => (
            <li key={s}><Link href={`/state/${toSlug(s)}`} className="text-muted no-underline hover:text-navy">{s}</Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Adds " | Paisa Reality" to the title when it still fits 60 chars. */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return brandMetadata(await buildMetadata(props));
}
