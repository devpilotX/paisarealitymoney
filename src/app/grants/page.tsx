import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import { pageMetadata, absoluteUrl } from '@/lib/seo';
import {
  getGrants, formatAmount, daysLeft, KIND_LABEL, FUNDING_LABEL, STATUS_LABEL, type Grant,
} from '@/lib/grants';
import GrantsExplorer, { type GrantCard } from './GrantsExplorer';

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: 'Startup Grants for Indian Founders: Who Qualifies',
  description:
    'Government seed funds, state grants and global accelerators open to Indian startups, with amounts, equity terms, eligibility and official links.',
  path: '/grants',
  keywords: ['startup grants india', 'startup india seed fund', 'grants for startups', 'birac big', 'y combinator india'],
});

function deadlineText(g: Grant): string | null {
  const d = daysLeft(g.deadline);
  if (d === null) return null;
  if (d === 0) return 'Closes today';
  if (d === 1) return 'Closes tomorrow';
  return d <= 45 ? `Closes in ${d} days` : `Closes ${new Date(g.deadline + 'T00:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

const FAQS = [
  {
    question: 'What is the difference between a grant and an accelerator?',
    answer:
      'A grant is money you do not pay back and that takes no share of your company, usually tied to milestones. An accelerator gives mentoring, a network and often an investment in return for equity. Cloud credit programmes give free usage of a service, not cash. Each page here says plainly which one it is and whether equity is taken.',
  },
  {
    question: 'Do I need DPIIT recognition?',
    answer:
      'For most central government programmes, yes. The Startup India Seed Fund, for example, only accepts DPIIT-recognised startups. Recognition is free on the Startup India portal and usually takes a few working days. International accelerators and cloud credit programmes do not ask for it.',
  },
  {
    question: 'Is anyone allowed to charge me to apply?',
    answer:
      'No. None of the programmes listed here charge an application fee. If a consultant promises a guaranteed grant for a fee, walk away. Incubators under government schemes are not allowed to charge you for applying.',
  },
  {
    question: 'How do you keep this list current?',
    answer:
      'Every programme was checked on its official page, and the date is shown on each one. Our system checks every official link each day and hides a programme whose deadline has passed or whose page stops working for three days in a row, so you should never land on a dead end from this list.',
  },
  {
    question: 'Why are some well-known programmes missing?',
    answer:
      'We only list a programme after confirming on its own official page that it is running and open to Indian founders. If we could not confirm that, we left it out rather than guess. Write to us if you know of one we should check.',
  },
];

export default async function GrantsPage(): Promise<React.ReactElement> {
  const grants = await getGrants();
  const cards: GrantCard[] = grants.map((g) => ({
    slug: g.slug, name: g.name, provider: g.provider, region: g.region, level: g.level, state: g.state,
    kindLabel: KIND_LABEL[g.kind] ?? g.kind, fundingLabel: FUNDING_LABEL[g.fundingType] ?? g.fundingType,
    fundingType: g.fundingType, amount: formatAmount(g.amountMinInr, g.amountMaxInr), stage: g.stage,
    summary: g.summary, statusLabel: STATUS_LABEL[g.status], status: g.status, deadlineText: deadlineText(g),
  }));
  const india = grants.filter((g) => g.region === 'india').length;
  const verified = grants.map((g) => g.verifiedOn).sort().at(-1);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Startup grants and programmes open to Indian founders',
    numberOfItems: grants.length,
    itemListElement: grants.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/grants/${g.slug}`), name: g.name })),
  };

  return (
    <div className="container-main py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Breadcrumb items={[{ label: 'Startup grants' }]} />

      <header className="max-w-3xl mt-4">
        <h1 className="heading-1">Startup grants and programmes for Indian founders</h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          {grants.length} programmes you can apply to today: {india} run in India by the central or state
          governments, and {grants.length - india} international ones that accept Indian startups. Each page says how much
          you can get, whether they take equity, who qualifies and how to apply.
        </p>
        {verified && (
          <p className="mt-3 text-sm text-muted-2">
            Every programme checked on its official page. Links are rechecked daily; closed or broken ones are
            removed automatically.
          </p>
        )}
      </header>

      <div className="mt-10">
        <GrantsExplorer grants={cards} />
      </div>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          { t: 'Get DPIIT recognition first', d: 'Most Indian government programmes need it. It is free on the Startup India portal.', href: 'https://www.startupindia.gov.in/content/sih/en/startupgov/startup_recognition_page.html', ext: true },
          { t: 'Check your state policy', d: 'States such as Karnataka, Kerala, Gujarat and Tamil Nadu run their own idea grants for startups registered there.', href: '#grant-search', ext: false },
          { t: 'Keep a one-page pitch ready', d: 'Problem, solution, who pays, what you have built, what the money is for. Nearly every form asks for these.', href: '/guides', ext: false },
        ].map((x) => (
          <div key={x.t} className="card-flat">
            <h2 className="text-lg font-semibold">{x.t}</h2>
            <p className="mt-2 text-muted leading-relaxed">{x.d}</p>
            {x.ext && (
              <a href={x.href} target="_blank" rel="noopener noreferrer" className="btn-link mt-3 text-[15px]">Startup India recognition page</a>
            )}
          </div>
        ))}
      </section>

      <div className="mt-8 max-w-3xl">
        <FAQ items={FAQS} />
        <p className="mt-2 text-sm text-muted-2">
          Know a programme we should check? <Link href="/contact" className="link-internal">Tell us</Link>.
        </p>
      </div>
    </div>
  );
}
