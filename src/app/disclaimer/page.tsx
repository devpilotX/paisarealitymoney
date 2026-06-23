import { pageMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata = pageMetadata({
  title: 'Disclaimer',
  description: 'Important disclaimer about information on Paisa Reality. We are an informational website, not a financial advisor.',
  path: '/disclaimer',
});

export default function DisclaimerPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Disclaimer' }]} />

      <article className="max-w-3xl">
        <h1 className="heading-1 mb-4">Disclaimer</h1>
        <p className="text-body text-sm text-gray-500 mb-6">Last updated: June 2026</p>

        <div className="space-y-6 text-body">
          <section>
            <h2 className="heading-2 mb-2">Not financial advice</h2>
            <p>Paisa Reality (paisareality.com) is an informational and educational website. We are not a financial advisor, broker, or intermediary. We are not registered with SEBI, AMFI, IRDAI, or any other financial regulatory body in India.</p>
            <p className="mt-2">Nothing on this site should be treated as a recommendation to buy, sell, or hold any financial product, scheme, or investment. We do not recommend specific banks, mutual funds, insurance plans, or government schemes over others.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Information only</h2>
            <p>All content on Paisa Reality, including daily prices, calculator results, scheme eligibility matches, bank rate comparisons, the Money Health Score, and Smart Tool outputs, is provided for general information and educational purposes only. It is not a substitute for professional financial, tax, or legal advice.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Accuracy not guaranteed</h2>
            <p>We make every effort to keep information accurate and up to date. However, prices change daily, scheme rules get revised, and bank rates fluctuate. We cannot guarantee that every figure on the site is correct at the moment you read it. There may be delays, errors, or omissions.</p>
            <p className="mt-2">Always verify important information with the official source (the relevant bank, government ministry, oil marketing company, or IBJA) before making any decision.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Calculators and tools</h2>
            <p>Our calculators and Smart Tools use simplified models and assumptions. Real outcomes depend on many factors these tools do not account for. Monte Carlo simulations show a range of possibilities, not predictions. Use calculator results as a starting point for thinking, not as a final answer.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Third-party links and ads</h2>
            <p>This site may contain links to third-party websites and displays advertisements via Google AdSense. We are not responsible for the content, accuracy, or practices of external sites or advertisers. A link or ad does not mean we endorse that product or service.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Consult a qualified advisor</h2>
            <p>Before making any financial decision, including investments, insurance purchases, loan applications, or tax planning, consult a SEBI-registered investment advisor, a certified financial planner, a chartered accountant, or other qualified professional as appropriate.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Limitation of liability</h2>
            <p>Paisa Reality, its team, and contributors are not liable for any loss, damage, or expense arising from the use of or reliance on information provided on this website. You use this site and its tools at your own risk.</p>
          </section>

          <section>
            <h2 className="heading-2 mb-2">Contact</h2>
            <p>If you find incorrect information or have questions about this disclaimer, write to us at <a href="mailto:connect@paisareality.com" className="link-internal">connect@paisareality.com</a>.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
