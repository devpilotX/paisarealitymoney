import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import HistoryClient from './HistoryClient';

export const metadata: Metadata = {
  title: 'Your Money Health Score History',
  description: 'Track how your Money Health Score changes over time across all eight pillars.',
  robots: { index: false }, // private, per-user
};

export default function HistoryPage(): React.ReactElement {
  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Money Health Score', href: '/score' }, { label: 'History' }]} />
      <h1 className="heading-1 mb-6">Your score over time</h1>
      <HistoryClient />
    </div>
  );
}
