import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchemesByCategory } from '@/lib/matcher';
import type { MatchedScheme } from '@/lib/matcher';
import { SCHEME_CATEGORIES } from '@/lib/constants';
import Breadcrumb from '@/components/Breadcrumb';
import SchemeCard from '@/components/SchemeCard';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

interface PageProps { params: Promise<{ slug: string }>; }

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return SCHEME_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = SCHEME_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: 'Category Not Found' };
  return {
    title: `${category.label} Government Schemes in India`,
    description: `Browse all ${category.label.toLowerCase()} government schemes in India. Find eligibility, benefits, and how to apply for central and state ${category.label.toLowerCase()} schemes.`,
    alternates: { canonical: `https://paisareality.com/category/${category.slug}` },
  };
}

export const revalidate = 3600;

export default async function CategoryPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const category = SCHEME_CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  let schemes: MatchedScheme[] = [];
  try {
    schemes = await getSchemesByCategory(category.slug);
  } catch (error) { console.error('Failed to load category schemes:', error); }

  const otherCategories = SCHEME_CATEGORIES
    .filter((c) => c.slug !== category.slug)
    .map((c) => ({ href: `/category/${c.slug}`, label: `${c.label} Schemes` }));

  const faqs = [
    {
      question: `How many ${category.label.toLowerCase()} schemes are available?`,
      answer: `We currently have ${schemes.length} ${category.label.toLowerCase()} schemes in our database. These include both central and state government schemes. New schemes are added regularly as the government announces them.`,
    },
    {
      question: `How to check if I am eligible for ${category.label.toLowerCase()} schemes?`,
      answer: `Use our Scheme Finder tool on the main schemes page. Fill in your basic details like age, state, income, and category. The system will automatically check which ${category.label.toLowerCase()} schemes you qualify for.`,
    },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[
        { label: 'Schemes', href: '/schemes' },
        { label: `${category.label} Schemes` },
      ]} />

      <h1 className="heading-1 mb-4">{category.label} Government Schemes in India</h1>
      <p className="text-body mb-6">
        Browse {schemes.length} government {category.label.toLowerCase()} schemes. Each scheme includes eligibility criteria, benefits, and how to apply.
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
        <p className="text-center py-12 text-gray-500">No schemes found in this category yet.</p>
      )}

      <InArticleAd />

      <InternalLinks title="Browse Other Categories" links={otherCategories} columns={3} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
