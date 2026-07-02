import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata = pageMetadata({
  title: 'Editorial Policy: How Paisa Reality Creates and Reviews Content',
  description:
    'Our editorial standards: how money guides are researched, reviewed, and updated, how we handle corrections, and how the site makes money without charging you.',
  path: '/editorial-policy',
  keywords: ['editorial policy', 'paisa reality editorial standards', 'content review policy'],
});

export default function EditorialPolicyPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Editorial Policy' }]} />
      <h1 className="heading-1 mb-3">Editorial Policy</h1>
      <p className="text-body mb-8 max-w-3xl">
        Money content changes lives when it is right and damages them when it is wrong. These are the standards
        every page on Paisa Reality is held to.
      </p>

      <article className="max-w-3xl space-y-10">
        <section>
          <h2 className="heading-2 mb-3">Our principles</h2>
          <ul className="list-disc pl-6 text-body space-y-2">
            <li>
              <strong>Every number has a source.</strong> Prices, rates, and scheme details are traceable to a
              named source and carry a visible date. Our full data pipeline is documented on the{' '}
              <Link href="/methodology" className="link-internal">methodology page</Link>.
            </li>
            <li>
              <strong>We say &quot;it depends&quot; when it depends.</strong> Guides present trade-offs honestly
              instead of forcing a winner. If FD beats SIP for a specific situation, we say so.
            </li>
            <li>
              <strong>No pay-to-rank.</strong> No bank, fund house, or insurer can pay to appear higher in a
              comparison table. Rankings follow the numbers.
            </li>
            <li>
              <strong>Education, not advice.</strong> We explain how products and rules work. We do not tell you
              what to buy. For personal advice, consult a SEBI-registered investment adviser or a chartered
              accountant.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="heading-2 mb-3">How content is created and reviewed</h2>
          <p className="text-body mb-3">
            Guides and articles are researched from primary sources: government notifications, RBI and SEBI
            publications, official scheme portals, bank rate cards, and the Income Tax Act as amended by the
            latest Finance Act. Drafts are checked for factual accuracy against those sources before publishing.
          </p>
          <p className="text-body">
            Tax-related pages state the financial year they apply to and are updated when slabs, deduction
            limits, or rules change. Calculators are tested against known worked examples before release, and
            our Smart Tool engines ship with automated test suites.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">Corrections</h2>
          <p className="text-body">
            When we get something wrong, we fix the page and, for material errors, note the correction on it.
            Spotted an error? Use the <Link href="/contact" className="link-internal">contact page</Link>. Data
            errors are our highest-priority fix, with a 48-hour target.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">How the site makes money</h2>
          <p className="text-body">
            Everything on Paisa Reality is free to use. The site earns from advertising (Google AdSense) and an
            optional Premium plan that adds convenience features like saved schemes and alerts. Ads are clearly
            distinguishable from content and never influence what a comparison table or guide says.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">Contact</h2>
          <p className="text-body">
            Questions about this policy or a specific page? Reach us via the{' '}
            <Link href="/contact" className="link-internal">contact page</Link> or read more{' '}
            <Link href="/about" className="link-internal">about Paisa Reality</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
