import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import { pageMetadata, SITE_URL } from '@/lib/seo';
import ScoreClient from './ScoreClient';

export const metadata = pageMetadata({
  title: 'Money Health Score: Check Your Financial Health Free',
  description:
    'Get your free Money Health Score from 300 to 900. See where your savings, debt, investing, and protection stand, with clear steps to improve.',
  path: '/score',
  keywords: [
    'money health score',
    'financial health score india',
    'check financial health free',
    'financial fitness score',
  ],
});

const SCORE_FAQS = [
  {
    question: 'What is a Money Health Score?',
    answer:
      'The Money Health Score is a single number from 300 to 900 that sums up how healthy your finances are. We look at eight pillars: savings, emergency fund, debt, retirement, investing, insurance, tax, and money habits. A higher score means a stronger financial position. It is educational only and not financial advice.',
  },
  {
    question: 'How is the Money Health Score calculated?',
    answer:
      'You answer a few simple questions about your income, savings, loans, investments, and cover. We score each of the eight pillars, weight them, and combine them into one number from 300 to 900. You then see which pillars are strong and which need work, with clear steps for each.',
  },
  {
    question: 'Is the Money Health Score free and private?',
    answer:
      'Yes. The score is completely free with no login needed. The calculation runs in your browser, so your numbers stay on your device unless you choose to email yourself the result. We do not sell your data.',
  },
  {
    question: 'What is a good Money Health Score?',
    answer:
      'The higher your score, the healthier your finances. Scores sit between 300 and 900, and the top band is labelled Excellent. Rather than chase one number, focus on the pillars the tool flags as weak and improve them one at a time.',
  },
  {
    question: 'How can I improve my Money Health Score?',
    answer:
      'Your result shows which pillars pull your score down and what to do about each one. To act on them, use our debt optimizer to clear loans in the cheapest order, the retirement optimizer to check if you are on track, and the budget optimizer to free up monthly surplus.',
  },
  {
    question: 'Is this the same as a CIBIL score?',
    answer:
      'No. A CIBIL score only measures your credit behaviour. The Money Health Score looks at your whole financial life, including savings, investing, insurance, and tax, not just borrowing. We use the same easy to read 300 to 900 range so it feels familiar.',
  },
];

export default function ScorePage(): React.ReactElement {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Money Health Score',
    url: `${SITE_URL}/score`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    description:
      'A free tool that scores your overall financial health from 300 to 900 across eight pillars and gives clear steps to improve.',
  };

  const fixLinks = [
    { href: '/calculators/debt-optimizer', label: 'Debt Payoff Optimizer' },
    { href: '/calculators/retirement-optimizer', label: 'Retirement Optimizer' },
    { href: '/calculators/budget-optimizer', label: 'Budget Optimizer' },
    { href: '/smart-tools', label: 'All Smart Tools' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Money Health Score' }]} />
      <h1 className="heading-1 mb-2">Your Money Health Score</h1>
      <p className="text-body mb-6 max-w-2xl">
        One number, from 300 to 900, for how healthy your finances are across eight pillars. Free, instant, and private. Educational only, not financial advice.
      </p>

      <AdBanner format="horizontal" />

      <div className="my-8"><ScoreClient /></div>

      <article className="prose max-w-3xl my-10">
        <h2>How the Money Health Score works</h2>
        <p>
          Most people track one part of their money at a time, like a credit score or a single investment. The Money Health Score pulls the whole picture into one number so you can see where you really stand. We score eight pillars: savings, emergency fund, debt, retirement, investing, insurance, tax, and money habits. Each pillar is rated, weighted, and combined into a single result from 300 to 900.
        </p>
        <h2>What your result tells you</h2>
        <p>
          Alongside your number, you see a breakdown of every pillar, so a strong score in one area does not hide a weak spot in another. The result points out which pillars drag your score down and gives plain steps to fix them. The higher your score, the more of your financial bases you have covered.
        </p>
        <h2>Turn your score into action</h2>
        <p>
          A score is only useful if it helps you act. If debt is your weak pillar, our debt optimizer finds the cheapest order to clear your loans. If retirement looks shaky, the retirement optimizer checks whether your savings are on track. If your monthly surplus is thin, the budget optimizer helps you free up cash. Improve a weak pillar, recheck your score, and watch it climb.
        </p>
      </article>

      <InternalLinks title="Fix your weak pillars with our Smart Tools" links={fixLinks} columns={2} />

      <FAQ items={SCORE_FAQS} />

      <AdBanner format="horizontal" className="mt-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
