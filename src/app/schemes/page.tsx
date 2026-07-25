import SchemeFinderClient from './SchemeFinderClient';
import InternalLinks from '@/components/InternalLinks';
import { getSchemeDirectory } from '@/lib/matcher';
import { SCHEME_CATEGORIES } from '@/lib/constants';

/**
 * SEO (internal linking): this page is a server component so the full scheme
 * directory renders as crawlable <a href> elements. The interactive finder is
 * unchanged — it is the same client component as before, extracted verbatim
 * into ./SchemeFinderClient.
 *
 * Revalidate hourly: the scheme list changes rarely, and a static render keeps
 * TTFB low while still picking up new schemes without a deploy.
 */
export const revalidate = 3600;

export default async function SchemesPage(): Promise<React.ReactElement> {
  const directory = await getSchemeDirectory();

  const byCategory = SCHEME_CATEGORIES.map((cat) => ({
    label: cat.label,
    slug: cat.slug,
    links: directory
      .filter((s) => s.category === cat.slug)
      .map((s) => ({ href: `/schemes/${s.slug}`, label: s.name })),
  })).filter((group) => group.links.length > 0);

  // Schemes whose category is not in SCHEME_CATEGORIES must still be linked,
  // otherwise they stay orphaned — which is the whole point of this block.
  const known = new Set<string>(SCHEME_CATEGORIES.map((c) => c.slug));
  const otherLinks = directory
    .filter((s) => !known.has(s.category))
    .map((s) => ({ href: `/schemes/${s.slug}`, label: s.name }));

  return (
    <div className="container-main py-6">
      <SchemeFinderClient schemeCount={directory.length} />

      {directory.length > 0 && (
        <section aria-labelledby="all-schemes-heading" className="mt-4 border-t border-line pt-8">
          <h2 id="all-schemes-heading" className="heading-2 mb-2">
            All {directory.length} Government Schemes A–Z
          </h2>
          <p className="text-sm text-muted-2 mb-2">
            Browse every scheme in our database by category. Each page lists eligibility,
            benefits, required documents, and a link to the official portal.
          </p>

          {byCategory.map((group) => (
            <InternalLinks
              key={group.slug}
              title={`${group.label} Schemes (${group.links.length})`}
              links={group.links}
              columns={3}
            />
          ))}

          {otherLinks.length > 0 && (
            <InternalLinks title={`Other Schemes (${otherLinks.length})`} links={otherLinks} columns={3} />
          )}
        </section>
      )}
    </div>
  );
}
