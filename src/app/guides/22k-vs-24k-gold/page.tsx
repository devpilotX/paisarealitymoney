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
  title: '22K vs 24K Gold: What Is the Difference?',
  description:
    '22K vs 24K gold explained simply. Purity, price, which is better for jewellery or investment, and how to read hallmarks before you buy.',
  path: '/guides/22k-vs-24k-gold',
  keywords: ['22k vs 24k gold', 'difference between 22k and 24k gold', '22 carat vs 24 carat gold', 'which gold is best to buy'],
  ogType: 'article',
});

const FAQS = [
  { question: 'What is the difference between 22K and 24K gold?', answer: '24K gold is almost pure gold, about 99.9 percent. 22K gold is about 91.7 percent gold mixed with a little of other metals like copper and silver to make it harder. 24K is purer and costlier, 22K is more durable and better for daily wear jewellery.' },
  { question: 'Which gold is better to buy?', answer: 'It depends on why you are buying. For jewellery you will wear often, 22K is better because it is stronger and holds its shape. For pure investment like coins or bars, 24K is better because it is purer and easier to sell at full value later.' },
  { question: 'Why is 24K gold not used for jewellery?', answer: 'Pure 24K gold is very soft. Rings and chains made from it would bend and scratch easily. That is why jewellers mix in a little other metal to make 22K, which is hard enough to survive daily wear while still being mostly gold.' },
  { question: 'How do I check the purity when buying?', answer: 'Look for the BIS hallmark. It shows the purity, like 22K916 for 22 carat or 24K999 for 24 carat. Buying hallmarked gold means you are paying for the purity you actually get. Always ask for a proper bill too.' },
];

export default function Page(): React.ReactElement {
  const schema = articleSchema({
    headline: '22K vs 24K Gold: What Is the Difference',
    description: 'A simple guide to gold purity and which type to buy in India.',
    path: '/guides/22k-vs-24k-gold',
  });
  return (
    <div className="container-main py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: '22K vs 24K Gold' }]} />
      <article className="max-w-3xl">
        <h1 className="heading-1 mb-2">22K vs 24K Gold: The Simple Difference</h1>
        <LastReviewed date="2026-06-30" className="mb-4" />
        <p className="text-body text-lg mb-6">
          When you go to buy gold you will hear 22 carat and 24 carat thrown around, and the prices are different. So what is the real difference and which one should you buy. It comes down to purity and what you plan to do with the gold. Here is the plain version.
        </p>

        <AdBanner format="horizontal" className="mb-8" />

        <h2 className="heading-2 mb-3">24K gold in one line</h2>
        <p className="text-body mb-4">
          24K is almost pure gold, around 99.9 percent. It is the purest form you can buy, which makes it the costliest. But it is also soft, so it is mostly used for coins and bars rather than everyday jewellery.
        </p>

        <h2 className="heading-2 mb-3">22K gold in one line</h2>
        <p className="text-body mb-4">
          22K is about 91.7 percent gold with a small amount of other metal added for strength. That extra strength is why most Indian jewellery is made in 22K. It looks just as golden but survives daily wear far better than pure gold would.
        </p>

        <InArticleAd />

        <h2 className="heading-2 mb-3">Which one should you buy</h2>
        <p className="text-body mb-4">
          If you are buying jewellery to wear, go with 22K because it lasts. If you are buying purely as an investment and want the highest purity that is easy to resell, go with 24K coins or bars. Some people split it. 22K for the jewellery they enjoy and 24K coins for saving.
        </p>

        <h2 className="heading-2 mb-3">Check the price before you buy</h2>
        <p className="text-body mb-6">
          Gold rates change every day and differ a little by city. See the latest <Link href="/gold-rate">gold rate today</Link> for both 22K and 24K, and check your own city on the <Link href="/gold-rate">city gold pages</Link> so you know the fair base price before you walk into a shop. Remember the shop price adds making charges and GST on top of this base rate.
        </p>

        <FAQ items={FAQS} />
      </article>

      <InternalLinks
        title="Useful pages and guides"
        links={[
          { href: '/gold-rate', label: 'Gold Rate Today', description: '22K and 24K prices by city' },
          { href: '/calculators/gold-planner', label: 'Gold Planner', description: 'Plan your gold buying' },
          { href: '/silver-rate', label: 'Silver Rate Today', description: 'Latest silver prices' },
          { href: '/guides/sip-vs-fd', label: 'SIP vs FD', description: 'Other ways to grow money' },
        ]}
        columns={2}
      />
    </div>
  );
}
