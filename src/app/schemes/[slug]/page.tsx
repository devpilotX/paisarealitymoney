import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { formatNumber, formatDate } from '@/lib/constants';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import ShareButton from '@/components/ShareButton';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

interface PageProps { params: Promise<{ slug: string }>; }

interface SchemeDetailRow extends RowDataPacket {
  id: number; slug: string; name: string; name_hi: string | null;
  category: string; level: string; ministry: string | null;
  description: string; description_hi: string | null;
  benefit_summary: string; benefit_amount_max: number | null;
  apply_url: string | null; official_url: string | null;
  deadline: string | null; min_age: number | null; max_age: number | null;
  gender: string; states: string | null; categories: string | null;
  max_income: number | null; occupations: string | null;
  education_min: string | null; area: string;
  bpl_required: boolean; minority_only: boolean; disability_only: boolean;
  how_to_apply: string | null; documents_required: string | null;
  meta_title: string | null; meta_description: string | null;
  source_url: string | null; last_verified: string | null; updated_at: string | null;
}

interface RelatedSchemeRow extends RowDataPacket {
  slug: string; name: string; benefit_summary: string; category: string;
}

function parseJsonArray(str: string | null): string[] {
  if (!str) return [];
  try { const p = JSON.parse(str); return Array.isArray(p) ? p.filter((i): i is string => typeof i === 'string') : []; }
  catch { return []; }
}

function titleCase(value: string): string {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildEligibilitySummary(scheme: SchemeDetailRow): string {
  const parts: string[] = [];
  if (scheme.min_age !== null) {
    parts.push(
      scheme.max_age !== null
        ? `Age ${scheme.min_age} to ${scheme.max_age} years`
        : `Minimum age ${scheme.min_age} years`
    );
  }
  if (scheme.gender !== 'all') {
    parts.push(`Gender: ${titleCase(scheme.gender)}`);
  }
  if (scheme.max_income !== null) {
    parts.push(`Family income up to Rs ${formatNumber(scheme.max_income)} per year`);
  }
  if (scheme.bpl_required) {
    parts.push('BPL family required');
  }
  if (scheme.minority_only) {
    parts.push('Minority applicants only');
  }
  if (scheme.disability_only) {
    parts.push('For persons with disability');
  }
  return parts.length > 0 ? `${parts.join('. ')}.` : 'Eligibility depends on the official scheme guidelines.';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const rows = await query<SchemeDetailRow[]>(
      `SELECT slug, name, name_hi, category, benefit_summary, meta_title, meta_description
       FROM schemes WHERE slug = ? AND is_active = TRUE LIMIT 1`,
      [slug]
    );
    const scheme = rows[0];
    if (!scheme) return { title: 'Scheme Not Found' };
    const url = `https://paisareality.com/schemes/${scheme.slug}`;
    const title = scheme.meta_title || `${scheme.name} - Eligibility, Benefits & Apply Online 2026`;
    const description = scheme.meta_description || `${scheme.benefit_summary}. Check eligibility, documents required, and how to apply for ${scheme.name}.`;
    const keywords = [
      scheme.name,
      scheme.name_hi,
      `${scheme.name} eligibility`,
      `${scheme.name} apply online`,
      `${scheme.name} status check`,
      `${scheme.name} 2026`,
      `${scheme.category} government scheme`,
      'government schemes india',
    ].filter((value): value is string => Boolean(value));
    return {
      title,
      description,
      keywords,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        title,
        description,
        url,
        siteName: 'Paisa Reality',
        locale: 'en_IN',
        images: [
          {
            url: 'https://paisareality.com/paisa_reality_logo.png',
            width: 512,
            height: 512,
            alt: scheme.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['https://paisareality.com/paisa_reality_logo.png'],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch { return { title: 'Government Scheme' }; }
}

export const revalidate = 3600;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const rows = await query<(RowDataPacket & { slug: string })[]>(
      'SELECT slug FROM schemes WHERE is_active = TRUE ORDER BY slug'
    );
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export default async function SchemeDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  let scheme: SchemeDetailRow | undefined;
  let relatedSchemes: RelatedSchemeRow[] = [];

  try {
    const rows = await query<SchemeDetailRow[]>(
      `SELECT * FROM schemes WHERE slug = ? AND is_active = TRUE LIMIT 1`, [slug]
    );
    scheme = rows[0];

    if (scheme) {
      relatedSchemes = await query<RelatedSchemeRow[]>(
        `SELECT slug, name, benefit_summary, category FROM schemes
         WHERE category = ? AND slug != ? AND is_active = TRUE
         ORDER BY benefit_amount_max DESC LIMIT 6`,
        [scheme.category, scheme.slug]
      );
    }
  } catch (error) { console.error('Failed to load scheme:', error); }

  if (!scheme) notFound();

  const states = parseJsonArray(scheme.states);
  const categories = parseJsonArray(scheme.categories);
  const occupations = parseJsonArray(scheme.occupations);
  const documents = parseJsonArray(scheme.documents_required);

  const faqs = [
    {
      question: `What is ${scheme.name}?`,
      answer: scheme.benefit_summary,
    },
    {
      question: `Who is eligible for ${scheme.name}?`,
      answer: `Eligibility depends on factors like age${scheme.min_age ? ` (${scheme.min_age}${scheme.max_age ? `-${scheme.max_age}` : '+'} years)` : ''}, gender${scheme.gender !== 'all' ? ` (${scheme.gender} only)` : ''}, income${scheme.max_income ? ` (up to Rs ${formatNumber(scheme.max_income)} per year)` : ''}, and category. Check the eligibility section above for complete details.`,
    },
    {
      question: `How to apply for ${scheme.name}?`,
      answer: scheme.how_to_apply || `Visit the official website${scheme.apply_url ? ` at ${scheme.apply_url}` : ''} or your nearest Common Service Centre (CSC) to apply. Carry all required documents as listed on this page.`,
    },
  ];

  const relatedLinks = relatedSchemes.map((s) => ({
    href: `/schemes/${s.slug}`, label: s.name, description: s.benefit_summary.substring(0, 120),
  }));

  const pageUrl = `https://paisareality.com/schemes/${scheme.slug}`;
  const schemeSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: scheme.name,
      alternateName: scheme.name_hi ?? undefined,
      description: scheme.description,
      provider: {
        '@type': 'GovernmentOrganization',
        name: scheme.ministry || 'Government of India',
        url: scheme.official_url || 'https://paisareality.com/schemes',
      },
      audience: {
        '@type': 'PeopleAudience',
        geographicArea: { '@type': 'Country', name: 'India' },
      },
      serviceType: scheme.category,
      url: pageUrl,
      areaServed: states.length === 0 || states.includes('all') ? 'India' : states.join(', '),
      availableChannel: scheme.apply_url
        ? {
            '@type': 'ServiceChannel',
            serviceUrl: scheme.apply_url,
            name: 'Online Application Portal',
          }
        : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://paisareality.com' },
        { '@type': 'ListItem', position: 2, name: 'Schemes', item: 'https://paisareality.com/schemes' },
        { '@type': 'ListItem', position: 3, name: scheme.name, item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `What is ${scheme.name}?`,
          acceptedAnswer: { '@type': 'Answer', text: scheme.description },
        },
        {
          '@type': 'Question',
          name: `Who is eligible for ${scheme.name}?`,
          acceptedAnswer: { '@type': 'Answer', text: buildEligibilitySummary(scheme) },
        },
        {
          '@type': 'Question',
          name: `How to apply for ${scheme.name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: scheme.how_to_apply || `Visit ${scheme.apply_url || scheme.official_url || pageUrl} and follow the official application process.`,
          },
        },
        {
          '@type': 'Question',
          name: `What documents are required for ${scheme.name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: documents.length > 0 ? documents.join(', ') : 'Refer to the official scheme portal for the latest document list.',
          },
        },
      ],
    },
  ];

  return (
    <div className="container-main py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemeSchema) }}
      />
      <Breadcrumb items={[
        { label: 'Schemes', href: '/schemes' },
        { label: scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1), href: `/category/${scheme.category}` },
        { label: scheme.name },
      ]} />

      <article className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary">
            {scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1)}
          </span>
          <span className="text-xs text-gray-500">
            {scheme.level === 'central' ? 'Central Government' : 'State Government'}
          </span>
          {scheme.ministry && <span className="text-xs text-gray-500">| {scheme.ministry}</span>}
        </div>

        <h1 className="heading-1 mb-4">{scheme.name}</h1>
        {scheme.name_hi && <p className="text-lg text-gray-500 mb-4">{scheme.name_hi}</p>}

        <AdBanner format="horizontal" />

        {/* Benefit Summary Card */}
        <div className="bg-primary-50 rounded-lg p-6 my-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Key Benefit</h2>
          <p className="text-base text-gray-800">{scheme.benefit_summary}</p>
          {scheme.benefit_amount_max && (
            <p className="text-xl font-bold text-primary mt-2">Up to Rs {formatNumber(scheme.benefit_amount_max)}</p>
          )}
        </div>

        {/* Description */}
        <section className="my-8">
          <h2 className="heading-2 mb-4">About This Scheme</h2>
          <div className="text-body whitespace-pre-line">{scheme.description}</div>
        </section>

        <InArticleAd />

        {/* Eligibility */}
        <section className="my-8">
          <h2 className="heading-2 mb-4">Eligibility Criteria</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {scheme.min_age !== null && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700 w-1/3">Age</td><td className="py-3 px-4 text-gray-900">{scheme.min_age}{scheme.max_age ? ` to ${scheme.max_age}` : '+'} years</td></tr>)}
                {scheme.gender !== 'all' && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">Gender</td><td className="py-3 px-4 text-gray-900">{scheme.gender.charAt(0).toUpperCase() + scheme.gender.slice(1)} only</td></tr>)}
                {states.length > 0 && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">States</td><td className="py-3 px-4 text-gray-900">{states.includes('all') ? 'All states' : states.join(', ')}</td></tr>)}
                {categories.length > 0 && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">Category</td><td className="py-3 px-4 text-gray-900">{categories.includes('all') ? 'All categories' : categories.map(c => c.toUpperCase()).join(', ')}</td></tr>)}
                {scheme.max_income !== null && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">Max Annual Income</td><td className="py-3 px-4 text-gray-900">Rs {formatNumber(scheme.max_income)}</td></tr>)}
                {occupations.length > 0 && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">Occupation</td><td className="py-3 px-4 text-gray-900">{occupations.join(', ')}</td></tr>)}
                {scheme.education_min && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">Min Education</td><td className="py-3 px-4 text-gray-900">{scheme.education_min}</td></tr>)}
                {scheme.area !== 'all' && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">Area</td><td className="py-3 px-4 text-gray-900">{scheme.area.charAt(0).toUpperCase() + scheme.area.slice(1)} only</td></tr>)}
                {scheme.bpl_required && (<tr className="border-b border-gray-100"><td className="py-3 px-4 font-medium text-gray-700">BPL Required</td><td className="py-3 px-4 text-gray-900">Yes</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to Apply */}
        {scheme.how_to_apply && (
          <section className="my-8">
            <h2 className="heading-2 mb-4">How to Apply</h2>
            <div className="text-body whitespace-pre-line">{scheme.how_to_apply}</div>
          </section>
        )}

        {/* Documents Required */}
        {documents.length > 0 && (
          <section className="my-8">
            <h2 className="heading-2 mb-4">Documents Required</h2>
            <ul className="list-disc list-inside space-y-2 text-body">
              {documents.map((doc) => (<li key={doc}>{doc}</li>))}
            </ul>
          </section>
        )}

        {/* Official Links */}
        <section className="my-8">
          <h2 className="heading-2 mb-4">Official Links</h2>
          <div className="flex flex-wrap gap-4">
            {scheme.apply_url && (
              <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary no-underline">
                Apply Online
              </a>
            )}
            {scheme.official_url && (
              <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="btn-secondary no-underline">
                Official Website
              </a>
            )}
          </div>
        {scheme.last_verified && (
          <p className="text-xs text-gray-500 mt-3">Last verified: {formatDate(scheme.last_verified)}</p>
        )}
        {scheme.source_url && (
          <p className="text-xs text-gray-500 mt-2">
            Source: <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="link-internal">Official reference</a>
          </p>
        )}
      </section>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This information is sourced from official government websites and is provided for reference only. Eligibility criteria and benefits may change. Always verify details on the official website before applying.
          </p>
        </div>

        <ShareButton url={`/schemes/${scheme.slug}`} title={scheme.name} />
      </article>

      {relatedLinks.length > 0 && (
        <InternalLinks title="Related Schemes" links={relatedLinks} columns={2} />
      )}

      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
