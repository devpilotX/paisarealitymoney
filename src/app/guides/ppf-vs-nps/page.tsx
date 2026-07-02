import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { articleSchema } from '@/lib/schema';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import LastReviewed from '@/components/LastReviewed';

export const metadata = pageMetadata({
  title: 'PPF vs NPS: Which Is Better for Retirement in 2026?',
  description:
    'PPF vs NPS explained simply. Returns, lock in, tax benefits, and safety compared to help you pick the right long term savings option for retirement.',
  path: '/guides/ppf-vs-nps',
  keywords: ['ppf vs nps', 'nps vs ppf which is better', 'ppf or nps for retirement', 'ppf nps tax benefit'],
  ogType: 'article',
});

const FAQS = [
  { question: 'Which is better, PPF or NPS?', answer: 'PPF is fully safe with a fixed government rate and tax free maturity, which suits people who want zero risk. NPS invests partly in equity, so it can give higher returns over the long run but the final amount is not fixed. Many people use PPF for safety and NPS for extra growth and the extra tax deduction.' },
  { question: 'Can I invest in both PPF and NPS?', answer: 'Yes. They are not either or. You can run a PPF account and an NPS account at the same time. This gives you a safe tax free base from PPF and market linked growth plus an extra tax deduction from NPS.' },
  { question: 'What is the tax benefit of NPS over PPF?', answer: 'Both qualify under 80C up to the combined limit. NPS gives an extra deduction of up to 50,000 under 80CCD(1B) that PPF does not offer. That extra deduction is one of the main reasons people add NPS on top of PPF.' },
  { question: 'Which one locks my money longer?', answer: 'PPF has a 15 year term, though partial withdrawals are allowed after a few years. NPS locks most of your money until age 60, and even then a part must be used to buy a pension. So NPS is the more locked in of the two.' },
];

export default function Page(): React.ReactElement {
  const schema = articleSchema({
    headline: 'PPF vs NPS: Which Is Better for Retirement',
    description: 'A simple comparison of PPF and NPS for long term and retirement savings in India.',
    path: '/guides/ppf-vs-nps',
  });
  return (
    <div className="container-main py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: 'PPF vs NPS' }]} />
      <article className="max-w-3xl">
        <h1 className="heading-1 mb-2">PPF vs NPS: Picking Your Retirement Base</h1>
        <LastReviewed date="2026-06-30" className="mb-4" />
        <p className="text-body text-lg mb-6">
          Both PPF and NPS are popular ways to save for the long term and both give tax benefits. But they work very differently. One is fully safe and fixed, the other is market linked with a chance of higher returns. Here is how to think about it.
        </p>

        <AdBanner format="horizontal" className="mb-8" />

        <h2 className="heading-2 mb-3">PPF in one line</h2>
        <p className="text-body mb-4">
          PPF is a government backed savings scheme with a fixed interest rate, a 15 year term, and tax free maturity. It is about as safe as it gets, which makes it a great base for people who do not want any risk with their long term money.
        </p>

        <h2 className="heading-2 mb-3">NPS in one line</h2>
        <p className="text-body mb-4">
          NPS is a retirement product that invests part of your money in equity and part in debt. Because of the equity part it can grow faster than PPF over many years, but the final amount is not guaranteed. It also gives an extra tax deduction that PPF does not.
        </p>

        <InArticleAd />

        <h2 className="heading-2 mb-3">How to choose</h2>
        <p className="text-body mb-4">
          If you cannot stomach any ups and downs and want a sure result, lean PPF. If you are fine with some market movement in exchange for higher expected returns and you want that extra 50,000 deduction, add NPS. For most people the smart move is not to choose one but to use both. PPF for the safe core and NPS for growth and the extra tax break.
        </p>

        <h2 className="heading-2 mb-3">Plan it with real numbers</h2>
        <p className="text-body mb-6">
          See what each can grow into with our <Link href="/calculators/ppf">PPF calculator</Link> and <Link href="/calculators/nps">NPS calculator</Link>. If you want the full picture of whether you are on track to retire comfortably, the <Link href="/calculators/retirement-optimizer">retirement calculator</Link> runs thousands of market scenarios to show your chances of success.
        </p>

        <FAQ items={FAQS} />
      </article>

      <InternalLinks
        title="Useful tools and guides"
        links={[
          { href: '/calculators/ppf', label: 'PPF Calculator', description: 'See your 15 year maturity' },
          { href: '/calculators/nps', label: 'NPS Calculator', description: 'Corpus and monthly pension' },
          { href: '/calculators/retirement-optimizer', label: 'Retirement Calculator', description: 'Are you on track to retire' },
          { href: '/guides/old-vs-new-tax-regime', label: 'Old vs New Tax Regime', description: 'Which saves you more tax' },
        ]}
        columns={2}
      />
    </div>
  );
}
