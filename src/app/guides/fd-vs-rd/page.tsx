import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { articleSchema } from '@/lib/schema';
import Breadcrumb from '@/components/Breadcrumb';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

export const metadata = pageMetadata({
  title: 'FD vs RD: Which Deposit Is Right for You in 2026?',
  description:
    'FD vs RD explained simply. The difference between a fixed deposit and a recurring deposit, returns, and which one fits your savings habit.',
  path: '/guides/fd-vs-rd',
  keywords: ['fd vs rd', 'fixed deposit vs recurring deposit', 'rd or fd which is better', 'difference between fd and rd'],
  ogType: 'article',
});

const FAQS = [
  { question: 'What is the main difference between FD and RD?', answer: 'In an FD you put in one lump sum at the start and it grows for a fixed time. In an RD you put in a fixed amount every month. FD suits money you already have. RD suits money you save bit by bit from your monthly income.' },
  { question: 'Does FD or RD give better returns?', answer: 'For the same bank and tenure the interest rate is usually similar. But an FD often earns a bit more in total because your full amount works from day one, while in an RD each monthly deposit only earns for the months it has been in. So with the same total money, an FD usually ends up slightly ahead.' },
  { question: 'Which should I pick?', answer: 'If you have a lump sum sitting idle, an FD is the natural choice. If you do not have a lump sum but can set aside a fixed amount each month, an RD builds the habit and still pays you interest. Many people use an RD to slowly build a lump sum, then move it into an FD.' },
  { question: 'Is the interest taxed the same way?', answer: 'Yes. Interest from both FD and RD is added to your income and taxed at your slab. TDS rules also apply to both once the interest crosses the limit in a year.' },
];

export default function Page(): React.ReactElement {
  const schema = articleSchema({
    headline: 'FD vs RD: Which Deposit Is Right for You',
    description: 'A simple comparison of fixed deposits and recurring deposits for Indian savers.',
    path: '/guides/fd-vs-rd',
  });
  return (
    <div className="container-main py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: 'FD vs RD' }]} />
      <article className="max-w-3xl">
        <h1 className="heading-1 mb-4">FD vs RD: Which Deposit Suits You</h1>
        <p className="text-body text-lg mb-6">
          FD and RD sound similar and both are safe bank deposits, but they fit different situations. The right one depends on whether you already have the money or you are saving it month by month. Here is the simple way to tell them apart.
        </p>

        <AdBanner format="horizontal" className="mb-8" />

        <h2 className="heading-2 mb-3">Fixed deposit in one line</h2>
        <p className="text-body mb-4">
          An FD takes one lump sum and locks it for a chosen period at a fixed rate. Your full amount earns interest from day one, so it is the best fit when you already have a sum you do not need for a while.
        </p>

        <h2 className="heading-2 mb-3">Recurring deposit in one line</h2>
        <p className="text-body mb-4">
          An RD takes a fixed amount from you every month for a set period. It is built for people who want to save a little at a time from their salary instead of putting in one big amount. It is a great way to build discipline.
        </p>

        <InArticleAd />

        <h2 className="heading-2 mb-3">How to choose</h2>
        <p className="text-body mb-4">
          Ask yourself one question. Do you have the money now or will you save it slowly. If you have it now, an FD makes your whole amount work right away. If you will save it monthly, an RD is the tool. A popular plan is to run an RD for a year, then take the maturity amount and start an FD with it.
        </p>

        <h2 className="heading-2 mb-3">Check your maturity value</h2>
        <p className="text-body mb-6">
          Use our <Link href="/calculators/fd">FD calculator</Link> to see what a lump sum grows into, and compare <Link href="/bank-rates/fd-rates">FD rates across banks</Link> to grab the highest rate for your tenure. Small finance banks often pay more, so it pays to compare before you lock your money.
        </p>

        <FAQ items={FAQS} />
      </article>

      <InternalLinks
        title="Useful tools and guides"
        links={[
          { href: '/calculators/fd', label: 'FD Calculator', description: 'See your maturity value' },
          { href: '/bank-rates/fd-rates', label: 'Compare FD Rates', description: 'Highest FD rates across banks' },
          { href: '/bank-rates/savings-rates', label: 'Savings Rates', description: 'Compare savings account rates' },
          { href: '/guides/sip-vs-fd', label: 'SIP vs FD', description: 'Safe vs growth, compared' },
        ]}
        columns={2}
      />
    </div>
  );
}
