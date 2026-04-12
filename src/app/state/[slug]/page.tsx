import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchemesByState } from '@/lib/matcher';
import { ALL_INDIAN_STATES } from '@/lib/cities';
import Breadcrumb from '@/components/Breadcrumb';
import SchemeCard from '@/components/SchemeCard';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

interface PageProps { params: { slug: string }; }

function stateSlugToName(slug: string): string | undefined {
  return ALL_INDIAN_STATES.find(
    (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug
  );
}

function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return ALL_INDIAN_STATES.map((state) => ({ slug: stateNameToSlug(state) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const stateName = stateSlugToName(params.slug);
  if (!stateName) return { title: 'State Not Found' };
  return {
    title: `Government Schemes in ${stateName} - Complete List`,
    description: `Find all central and state government schemes available in ${stateName}. Check eligibility, benefits, and how to apply.`,
    alternates: { canonical: `https://paisareality.com/state/${params.slug}` },
  };
}

export const revalidate = 3600;

export default async function StateSchemesPage({ params }: PageProps): Promise<React.ReactElement> {
  const stateName = stateSlugToName(params.slug);
  if (!stateName) notFound();

  let schemes = [];
  try {
    schemes = await getSchemesByState(stateName);
  } catch (error) { console.error('Failed to load state schemes:', error); }

  const otherStates = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh',
    'Gujarat', 'Rajasthan', 'West Bengal', 'Kerala', 'Bihar']
    .filter((s) => s !== stateName)
    .slice(0, 8)
    .map((s) => ({ href: `/state/${stateNameToSlug(s)}`, label: `Schemes in ${s}` }));

  const faqs = [
    {
      question: `How many government schemes are available in ${stateName}?`,
      answer: `We found ${schemes.length} central and state government schemes available for residents of ${stateName}. This includes both central schemes that apply to all states and specific state-level schemes.`,
    },
    {
      question: `How to apply for government schemes in ${stateName}?`,
      answer: `Most schemes can be applied for online through official government portals. You can also visit your nearest Common Service Centre (CSC), block office, or district office. Each scheme page on Paisa Reality has specific application instructions and links.`,
    },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[
        { label: 'Schemes', href: '/schemes' },
        { label: `Schemes in ${stateName}` },
      ]} />

      <h1 className="heading-1 mb-4">Government Schemes in {stateName}</h1>
      <p className="text-body mb-6">
        {schemes.length} central and state government schemes available for residents of {stateName}.
      </p>

      <AdBanner format="horizontal" />

      {schemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          {schemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              slug={scheme.slug}
              name={scheme.name}
              category={scheme.category}
              level={scheme.level}
              benefitSummary={scheme.benefitSummary}
              benefitAmountMax={scheme.benefitAmountMax}
              ministry={scheme.ministry}
            />
          ))}
        </div>
      ) : (
        <p className="text-center py-12 text-gray-500">No schemes found for this state yet.</p>
      )}

      <InArticleAd />

      <InternalLinks title="Schemes in Other States" links={otherStates} columns={4} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}