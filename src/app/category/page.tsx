import Breadcrumb from '@/components/Breadcrumb';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import { pageMetadata } from '@/lib/seo';
import { SCHEME_CATEGORIES } from '@/lib/constants';
import { getSchemeDirectory } from '@/lib/matcher';

/**
 * SEO: /category previously returned 404, leaving all 14 /category/[slug]
 * pages without a hub parent. Link equity and crawl depth fix — those pages
 * are already indexed.
 */
export const revalidate = 3600;

export const metadata = pageMetadata({
  title: 'Government Scheme Categories: Browse by Type',
  description:
    'Browse Indian government schemes by category: education, housing, business, agriculture, healthcare, pension, insurance and more. Eligibility and official links on every page.',
  path: '/category',
});

export default async function CategoryHubPage(): Promise<React.ReactElement> {
  const directory = await getSchemeDirectory();

  const links = SCHEME_CATEGORIES.map((cat) => {
    const count = directory.filter((s) => s.category === cat.slug).length;
    return {
      href: `/category/${cat.slug}`,
      label: cat.label,
      description:
        count > 0
          ? `${count} ${count === 1 ? 'scheme' : 'schemes'} in ${cat.label.toLowerCase()}`
          : `Government ${cat.label.toLowerCase()} schemes`,
    };
  });

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Categories' }]} />

      <div className="text-center mb-8">
        <h1 className="heading-1 mb-3">Browse Government Schemes by Category</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Looking for something specific? Pick a category to see the central and state schemes that
          cover it, with eligibility and how to apply.
        </p>
      </div>

      <AdBanner format="horizontal" />

      <InternalLinks
        title={`All ${SCHEME_CATEGORIES.length} Scheme Categories`}
        links={links}
        columns={3}
      />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How these categories work</h2>
        <p className="text-body mb-4">
          Government schemes are easier to find when grouped by what they actually do. A pension
          scheme, a housing subsidy and a scholarship have very different eligibility rules, so we
          keep them separate rather than presenting one long undifferentiated list.
        </p>
        <p className="text-body mb-4">
          Each category page lists the schemes we have recorded, including the benefit, who
          qualifies, the documents required and a link to the official portal. Rules and amounts
          change, so always confirm on the official source before applying.
        </p>
      </article>
    </div>
  );
}
