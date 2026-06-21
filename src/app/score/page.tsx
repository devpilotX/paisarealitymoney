import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import AdBanner from '@/components/AdBanner';
import ScoreClient from './ScoreClient';

export const metadata: Metadata = {
  title: 'Money Health Score - Free, Like a CIBIL Score for Your Finances',
  description: 'Get your free Money Health Score out of 900 across savings, emergency fund, debt, retirement, investing, insurance, tax and money habits. No login. 100% private.',
  alternates: { canonical: 'https://paisareality.com/score' },
};

export default function ScorePage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Money Health Score' }]} />
      <h1 className="heading-1 mb-2">Your Money Health Score</h1>
      <p className="text-body mb-6 max-w-2xl">One number, out of 900, for how healthy your finances are - across eight pillars. Free, instant, and private. Educational only, not financial advice.</p>
      <AdBanner format="horizontal" />
      <div className="my-8"><ScoreClient /></div>
    </div>
  );
}
