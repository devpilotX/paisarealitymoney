import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';

export const metadata = pageMetadata({
  title: 'Money Guides India: Compare and Decide',
  description:
    'Simple money guides for India. Old vs new tax regime, SIP vs FD, PPF vs NPS, FD vs RD, and 22K vs 24K gold. Plain comparisons to help you decide.',
  path: '/guides',
  keywords: ['money guides india', 'old vs new tax regime', 'sip vs fd', 'ppf vs nps', 'fd vs rd', '22k vs 24k gold'],
});

/*
 * The hub was five links and one sentence, 245 rendered words, which the
 * 2026-07-26 crawl flagged as the thinnest page on the site. Each guide is now
 * paired with the calculator that does the same arithmetic on the reader's own
 * numbers, which is both the genuinely useful next step and a way to pass link
 * equity to the calculator pages, which rank between position 28 and 81 despite
 * being technically clean.
 */
const GUIDES = [
  {
    href: '/guides/old-vs-new-tax-regime',
    label: 'Old vs New Tax Regime',
    description: 'Which one saves you more tax and when',
    tool: { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
  },
  {
    href: '/guides/sip-vs-fd',
    label: 'SIP vs FD',
    description: 'Mutual fund SIP or a fixed deposit',
    tool: { href: '/calculators/sip', label: 'SIP Calculator' },
  },
  {
    href: '/guides/ppf-vs-nps',
    label: 'PPF vs NPS',
    description: 'Two long term savings options compared',
    tool: { href: '/calculators/ppf', label: 'PPF Calculator' },
  },
  {
    href: '/guides/fd-vs-rd',
    label: 'FD vs RD',
    description: 'Fixed deposit or recurring deposit',
    tool: { href: '/calculators/fd', label: 'FD Calculator' },
  },
  {
    href: '/guides/22k-vs-24k-gold',
    label: '22K vs 24K Gold',
    description: 'What the difference really means',
    tool: { href: '/gold-rate', label: "Today's Gold Rate" },
  },
];

export default function GuidesHubPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Guides' }]} />
      <div className="max-w-3xl">
        <h1 className="heading-1 mb-4">Money Guides</h1>
        <p className="text-body text-lg mb-6">
          Short and simple comparisons to help you make everyday money decisions. No jargon. Just the points that matter, plus a clear takeaway at the end of each one.
        </p>
        <p className="text-body mb-6">
          A comparison only really settles once you put your own figures in, so every guide below is paired with the
          calculator that does the same arithmetic on your numbers. Read the guide for the reasoning, then run the
          numbers to see which side of the comparison you personally fall on. The rates used come from the same
          published sources as the rest of the site, and each guide shows when it was last checked.
        </p>
      </div>
      <AdBanner format="horizontal" className="mb-8" />

      <div className="max-w-3xl">
        <h2 className="heading-2 mb-4">Read the guide, then run your numbers</h2>
        <ul className="space-y-5 list-none pl-0">
          {GUIDES.map((g) => (
            <li key={g.href} className="border-b border-line pb-4">
              <h3 className="font-serif text-lg font-bold text-navy mb-1">
                <Link href={g.href} className="link-internal">{g.label}</Link>
              </h3>
              <p className="text-body mb-2">{g.description}.</p>
              <p className="text-sm">
                Run the numbers: <Link href={g.tool.href} className="link-internal">{g.tool.label}</Link>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <InternalLinks title="Popular comparisons" links={GUIDES.map(({ href, label, description }) => ({ href, label, description }))} columns={2} />
    </div>
  );
}

