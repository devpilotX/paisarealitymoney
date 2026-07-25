import Breadcrumb from '@/components/Breadcrumb';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import { pageMetadata } from '@/lib/seo';
import { ALL_INDIAN_STATES } from '@/lib/cities';

/**
 * SEO: /state previously returned 404, leaving all 36 /state/[slug] pages
 * without a hub parent. Those pages are already indexed, so this is a link
 * equity and crawl depth fix, not an indexation fix. It also strengthens the
 * scheme family, because each state page links to the schemes for that state
 * (e.g. /state/kerala serves 177 crawlable scheme links).
 */
export const metadata = pageMetadata({
  title: 'Government Schemes by State: All 36 States and UTs',
  description:
    'Find central and state government schemes for your state. Browse all 36 states and union territories with eligibility, benefits and official links.',
  path: '/state',
});

// Must match src/app/state/[slug]/page.tsx and src/app/sitemap.ts exactly.
function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function StateHubPage(): React.ReactElement {
  const links = ALL_INDIAN_STATES.map((state) => ({
    href: `/state/${stateNameToSlug(state)}`,
    label: state,
    description: `Schemes and scholarships in ${state}`,
  }));

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'States' }]} />

      <div className="text-center mb-8">
        <h1 className="heading-1 mb-3">Government Schemes by State</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Every Indian state and union territory runs its own welfare schemes alongside the central
          ones. Pick your state to see what you may be eligible for.
        </p>
      </div>

      <AdBanner format="horizontal" />

      <InternalLinks
        title={`All ${ALL_INDIAN_STATES.length} States and Union Territories`}
        links={links}
        columns={3}
      />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">Why state schemes matter</h2>
        <p className="text-body mb-4">
          Central government schemes apply across India, but most states also run their own
          programmes for pensions, housing, scholarships, farmer support and health cover. These are
          often the schemes people miss, because they are announced locally and documented only on
          state portals.
        </p>
        <p className="text-body mb-4">
          Each state page below lists the schemes we have recorded for that state, with eligibility
          rules, what the benefit is, the documents you need, and a link to the official portal.
          Always confirm the final details on the official source before applying.
        </p>
      </article>
    </div>
  );
}
