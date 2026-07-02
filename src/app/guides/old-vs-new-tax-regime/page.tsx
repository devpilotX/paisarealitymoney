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
  title: 'Old vs New Tax Regime FY 2026-27: Which Saves More?',
  description:
    'Old vs new tax regime explained in simple words for FY 2026-27. See who saves more, the slab rates, deductions you lose, and how to pick the right one.',
  path: '/guides/old-vs-new-tax-regime',
  keywords: ['old vs new tax regime', 'which tax regime is better', 'new tax regime vs old', 'tax regime fy 2026-27'],
  ogType: 'article',
});

const FAQS = [
  { question: 'Which tax regime is better for me?', answer: 'It depends on your deductions. If you claim a lot of deductions like 80C, home loan interest, and HRA, the old regime may save more. If you do not claim many deductions, the new regime is usually better because of its lower slab rates and higher standard deduction. The fastest way is to run both in a calculator with your real numbers.' },
  { question: 'Can I switch between old and new regime every year?', answer: 'If you are a salaried person with no business income, yes, you can choose the regime that suits you each financial year when you file your return. People with business income have tighter rules and cannot switch back and forth freely.' },
  { question: 'Is the new regime now the default?', answer: 'Yes, the new tax regime is the default. If you want the old regime, you have to choose it specifically. If you do nothing, your tax is calculated under the new regime.' },
  { question: 'Do I lose all deductions in the new regime?', answer: 'You lose most of the common ones like 80C, 80D, and HRA. But the standard deduction for salaried people is still allowed, and the employer contribution to NPS under 80CCD(2) is also still allowed.' },
];

export default function Page(): React.ReactElement {
  const schema = articleSchema({
    headline: 'Old vs New Tax Regime FY 2026-27: Which One Saves You More',
    description: 'A simple guide to choosing between the old and new income tax regime in India.',
    path: '/guides/old-vs-new-tax-regime',
  });
  return (
    <div className="container-main py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: 'Old vs New Tax Regime' }]} />
      <article className="max-w-3xl">
        <h1 className="heading-1 mb-2">Old vs New Tax Regime: Which One Saves You More</h1>
        <LastReviewed date="2026-06-30" className="mb-4" />
        <p className="text-body text-lg mb-6">
          Every year the same question comes up at tax time. Should you go with the old regime or the new one. The honest answer is that it depends on how many deductions you claim. Let us break it down in plain words so you can pick the one that puts more money back in your pocket.
        </p>

        <AdBanner format="horizontal" className="mb-8" />

        <h2 className="heading-2 mb-3">The simple difference</h2>
        <p className="text-body mb-4">
          The old regime has higher tax rates but lets you claim lots of deductions like 80C, home loan interest, HRA, and medical insurance. The new regime has lower tax rates but takes away most of those deductions. So the old regime rewards people who invest and spend in tax saving ways, while the new regime rewards people who keep things simple.
        </p>

        <h2 className="heading-2 mb-3">Who usually saves more with the old regime</h2>
        <p className="text-body mb-4">
          If you already pay a home loan, claim HRA because you live on rent, put money into PPF or ELSS for 80C, and have health insurance, your deductions add up fast. For these people the old regime often wins because all those deductions cut down your taxable income by a big amount.
        </p>

        <h2 className="heading-2 mb-3">Who usually saves more with the new regime</h2>
        <p className="text-body mb-4">
          If you are young, do not have a home loan, do not claim much HRA, and do not invest a lot in 80C products, then you do not have many deductions to use. In that case the new regime is usually better because the slab rates are lower and you still get a standard deduction as a salaried person.
        </p>

        <InArticleAd />

        <h2 className="heading-2 mb-3">The one minute way to decide</h2>
        <p className="text-body mb-4">
          Do not guess. Add up the deductions you can actually claim. If the total is large, lean old regime. If it is small, lean new regime. Then confirm it with real numbers. Our <Link href="/calculators/income-tax">income tax calculator</Link> shows your tax under both regimes side by side, so you can see the winner in seconds. If you want to push your savings further, the <Link href="/calculators/salary-optimizer">salary structure optimizer</Link> shows which salary components to change.
        </p>

        <h2 className="heading-2 mb-3">A few things people forget</h2>
        <p className="text-body mb-6">
          The new regime is the default now, so if you do nothing your tax is calculated the new way. Salaried people can choose a different regime each year, so your best choice can change as your life changes. Buying a house or starting to claim HRA can flip the answer from new to old. It is worth checking every year rather than setting it once and forgetting.
        </p>

        <FAQ items={FAQS} />
      </article>

      <InternalLinks
        title="Useful tools and guides"
        links={[
          { href: '/calculators/income-tax', label: 'Income Tax Calculator', description: 'Compare both regimes with your numbers' },
          { href: '/calculators/salary-optimizer', label: 'Salary Optimizer', description: 'Cut tax by restructuring CTC' },
          { href: '/calculators/hra', label: 'HRA Calculator', description: 'Find your tax-free HRA' },
          { href: '/guides/ppf-vs-nps', label: 'PPF vs NPS', description: 'Two 80C options compared' },
        ]}
        columns={2}
      />
    </div>
  );
}
