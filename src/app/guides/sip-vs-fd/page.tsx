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
  title: 'SIP vs FD: Which Is Better for You in 2026?',
  description:
    'SIP vs FD explained simply. Returns, risk, taxes, and safety compared so you can decide where to put your money. Plus free SIP and FD calculators.',
  path: '/guides/sip-vs-fd',
  keywords: ['sip vs fd', 'sip or fd which is better', 'mutual fund sip vs fixed deposit', 'fd vs sip returns'],
  ogType: 'article',
});

const FAQS = [
  { question: 'Is SIP better than FD?', answer: 'Over a long time, SIP in equity mutual funds has usually given higher returns than an FD, but it also goes up and down and is not guaranteed. An FD gives you a fixed and safe return. SIP is better for long term wealth building. FD is better for safety and short term needs.' },
  { question: 'Is SIP safe like FD?', answer: 'No. An FD return is fixed and your money is safe up to 5 lakh per bank under deposit insurance. A SIP invests in the market, so the value can fall in the short term. The trade off for that risk is the chance of higher returns over many years.' },
  { question: 'Can I do both SIP and FD?', answer: 'Yes, and many people do. A common approach is to keep your emergency money and short term goals in an FD for safety, and invest for long term goals like retirement through SIP. This gives you both safety and growth.' },
  { question: 'Which gives better returns after tax?', answer: 'FD interest is taxed at your income slab every year. Equity SIP gains are taxed only when you sell, and long term gains get a friendlier rate. For long horizons this tax treatment often makes SIP more efficient, but the right answer depends on your slab and time frame.' },
];

export default function Page(): React.ReactElement {
  const schema = articleSchema({
    headline: 'SIP vs FD: Which Is Better for You',
    description: 'A simple comparison of mutual fund SIP and bank fixed deposit for Indian savers.',
    path: '/guides/sip-vs-fd',
  });
  return (
    <div className="container-main py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: 'SIP vs FD' }]} />
      <article className="max-w-3xl">
        <h1 className="heading-1 mb-2">SIP vs FD: Where Should Your Money Go</h1>
        <LastReviewed date="2026-06-30" className="mb-4" />
        <p className="text-body text-lg mb-6">
          This is one of the most common money questions in India. Should you start a SIP in mutual funds or just put your money in a fixed deposit. Both are good, but they are good for different reasons. Here is the simple version so you can decide.
        </p>

        <AdBanner format="horizontal" className="mb-8" />

        <h2 className="heading-2 mb-3">FD in one line</h2>
        <p className="text-body mb-4">
          An FD is safe and predictable. You lock money for a fixed time, you know the exact interest you will get, and your money does not move with the market. The catch is that the returns are modest and the interest is taxed every year at your slab.
        </p>

        <h2 className="heading-2 mb-3">SIP in one line</h2>
        <p className="text-body mb-4">
          A SIP is a way to invest a fixed amount every month into a mutual fund. Over long periods it has usually beaten FD returns because of market growth and compounding. The trade off is that the value goes up and down, so it is not for money you need next month.
        </p>

        <InArticleAd />

        <h2 className="heading-2 mb-3">How to choose</h2>
        <p className="text-body mb-4">
          Match the tool to the goal. For money you may need within a year or two, or for your emergency fund, an FD is the right call because safety matters more than returns. For goals that are five years away or more, like retirement or a child education, a SIP gives your money time to grow through the ups and downs.
        </p>

        <h2 className="heading-2 mb-3">See the numbers for yourself</h2>
        <p className="text-body mb-6">
          The best way to feel the difference is to run both. Try our <Link href="/calculators/sip">SIP calculator</Link> to see how a monthly amount can grow over ten or twenty years, and our <Link href="/calculators/fd">FD calculator</Link> to see a guaranteed maturity value. Put the same monthly amount in both and compare. Most people are surprised by how much the long horizon changes things.
        </p>

        <FAQ items={FAQS} />
      </article>

      <InternalLinks
        title="Useful tools and guides"
        links={[
          { href: '/calculators/sip', label: 'SIP Calculator', description: 'See your mutual fund growth' },
          { href: '/calculators/fd', label: 'FD Calculator', description: 'See guaranteed maturity value' },
          { href: '/bank-rates/fd-rates', label: 'Compare FD Rates', description: 'Highest FD rates across banks' },
          { href: '/guides/fd-vs-rd', label: 'FD vs RD', description: 'Another safe option compared' },
        ]}
        columns={2}
      />
    </div>
  );
}
