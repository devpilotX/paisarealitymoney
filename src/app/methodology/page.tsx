import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata = pageMetadata({
  title: 'Data Methodology: How We Source and Verify Every Number',
  description:
    'Exactly how Paisa Reality computes gold, silver, fuel, and LPG prices, where bank rates and scheme details come from, how often data updates, and how to report an error.',
  path: '/methodology',
  keywords: ['paisa reality methodology', 'how gold rate is calculated', 'data sources', 'price verification'],
});

export default function MethodologyPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Data Methodology' }]} />
      <h1 className="heading-1 mb-3">How We Source and Verify Every Number</h1>
      <p className="text-body mb-8 max-w-3xl">
        A price you cannot trace is a price you cannot trust. This page explains exactly where every figure on
        Paisa Reality comes from, how it is computed, how often it updates, and what its limits are. If you find
        a number that looks wrong, <Link href="/contact" className="link-internal">tell us</Link> and we will
        check it against the source.
      </p>

      <article className="max-w-3xl space-y-10">
        <section>
          <h2 className="heading-2 mb-3">Gold and silver rates</h2>
          <p className="text-body mb-3">
            Gold and silver prices update every day from the live international spot price (via gold-api.com)
            and the live USD to INR exchange rate (via frankfurter.dev). We convert to Indian landed cost like
            this:
          </p>
          <ul className="list-disc pl-6 text-body space-y-2 mb-3">
            <li>Convert the USD per troy ounce spot price to INR per gram.</li>
            <li>Add import duty (6% since the July 2024 budget) and 3% GST.</li>
            <li>
              For silver, add the Indian market premium: physical silver in India has traded well above
              international parity since the 2025 silver squeeze, so we apply a premium calibrated against
              published Indian dealer rates and review it regularly.
            </li>
            <li>
              Add a city premium: a small per-city adjustment reflecting typical local jeweller spreads. These
              premiums are calibrated periodically against market rates; they are not live quotes from city
              bullion associations.
            </li>
            <li>22K = 24K price × 0.9167. 18K = 24K price × 0.75.</li>
          </ul>
          <p className="text-body">
            What this means for you: our rate tracks the market closely and is refreshed daily, but your local
            jeweller may quote slightly differently because of making charges, local association rates, and
            stock. Always confirm the day&apos;s rate at the shop before buying.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">Petrol and diesel prices</h2>
          <p className="text-body mb-3">
            Fuel prices are fetched daily from the oil marketing companies&apos; published rates (Indian Oil,
            Bharat Petroleum, Hindustan Petroleum) as aggregated by public trackers, following the OMCs&apos; 6 AM
            revision. City rates apply the published state rate plus each city&apos;s known local spread, because
            fuel VAT is set at the state level. Every live value is sanity-checked against our verified baseline
            before it is published; if the live feed is ever unavailable, we fall back to the baseline and show
            its verification date instead of pretending.
          </p>
          <p className="text-body">
            Every fuel page shows a <strong>&quot;data verified as of&quot;</strong> date. That is the date we
            last checked the figures against published rates, and it is the honest freshness signal — not just
            the date the page was generated. If our data ages beyond two weeks, our own system emails us to fix
            it.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">LPG cylinder prices</h2>
          <p className="text-body mb-3">
            Domestic 14.2 kg cylinder rates are state-wise figures from OMC published prices, which revise on
            the 1st of each month. Commercial 19 kg rates are shown only for states where a published figure
            exists; where you see a dash, we chose not to guess — check your distributor.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">Bank interest rates</h2>
          <p className="text-body mb-3">
            FD, savings, home loan, and personal loan rates are curated manually from each bank&apos;s official
            website. Every rate table shows a <strong>&quot;rates as of&quot;</strong> date — the date that data
            was last refreshed. Banks revise rates without notice, so treat our tables as a comparison starting
            point and verify the exact rate with the bank before booking a deposit or applying for a loan.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">Government schemes</h2>
          <p className="text-body mb-3">
            Scheme details (eligibility, benefits, how to apply) are compiled from official government portals
            and ministry pages, with a link to the official source on every scheme page. Schemes change:
            deadlines shift, benefits get revised, portals move. Each scheme record carries a last-verified date,
            and the official link is always the final authority.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">Calculators and Smart Tools</h2>
          <p className="text-body mb-3">
            All calculators run standard, published formulas (EMI amortisation, compound interest, current
            income tax slabs) directly in your browser — your inputs never leave your device. Smart Tools use
            simulation and optimisation on top of the same public rules. Results are educational models, not
            guarantees, and tax figures follow the law as of the assessment year stated on each tool.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">Corrections</h2>
          <p className="text-body mb-3">
            If any figure on this site is wrong, we want to know. Report it through the{' '}
            <Link href="/contact" className="link-internal">contact page</Link> with the page link. We aim to
            verify and correct data errors within 48 hours.
          </p>
        </section>

        <section>
          <h2 className="heading-2 mb-3">What we are not</h2>
          <p className="text-body">
            Paisa Reality is an informational platform, not a SEBI-registered investment adviser, bank, or
            broker. Nothing here is personalised financial advice. Read our{' '}
            <Link href="/disclaimer" className="link-internal">disclaimer</Link> and{' '}
            <Link href="/editorial-policy" className="link-internal">editorial policy</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
