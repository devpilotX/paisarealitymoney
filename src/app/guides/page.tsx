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

const GUIDES = [
  { href: '/guides/old-vs-new-tax-regime', label: 'Old vs New Tax Regime', description: 'Which one saves you more tax and when' },
  { href: '/guides/sip-vs-fd', label: 'SIP vs FD', description: 'Mutual fund SIP or a fixed deposit' },
  { href: '/guides/ppf-vs-nps', label: 'PPF vs NPS', description: 'Two long term savings options compared' },
  { href: '/guides/fd-vs-rd', label: 'FD vs RD', description: 'Fixed deposit or recurring deposit' },
  { href: '/guides/22k-vs-24k-gold', label: '22K vs 24K Gold', description: 'What the difference really means' },
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
      </div>
      <AdBanner format="horizontal" className="mb-8" />
      <InternalLinks title="Popular comparisons" links={GUIDES} columns={2} />
    </div>
  );
}
