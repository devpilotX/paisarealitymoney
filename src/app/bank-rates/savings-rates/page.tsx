import type { Metadata } from 'next';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import Breadcrumb from '@/components/Breadcrumb';
import BankRateTable from '@/components/BankRateTable';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';

export const metadata: Metadata = {
  title: 'Savings Account Interest Rates - Compare All Banks',
  description: 'Compare savings account interest rates across 50+ Indian banks. Find which bank gives the highest savings rate.',
  alternates: { canonical: 'https://paisareality.com/bank-rates/savings-rates' },
};

interface SavingsRateRow extends RowDataPacket {
  bank_name: string; bank_slug: string; bank_type: string;
  tenure: string | null; general_rate: number; senior_citizen_rate: number | null;
}

export const revalidate = 3600;

export default async function SavingsRatesPage(): Promise<React.ReactElement> {
  let rates: SavingsRateRow[] = [];
  try {
    rates = await query<SavingsRateRow[]>(
      `SELECT b.name as bank_name, b.slug as bank_slug, b.type as bank_type,
              br.tenure, br.general_rate, br.senior_citizen_rate
       FROM bank_rates br JOIN banks b ON br.bank_id = b.id
       WHERE br.rate_type = 'savings'
       ORDER BY br.general_rate DESC, b.name`
    );
  } catch (error) { console.error('Failed to fetch savings rates:', error); }

  const tableRates = rates.map((r) => ({ bankName: r.bank_name, bankSlug: r.bank_slug, bankType: r.bank_type, tenure: r.tenure ?? 'Regular', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate }));
  const otherLinks = [{ href: '/bank-rates/fd-rates', label: 'FD Rates' }, { href: '/bank-rates/home-loan-rates', label: 'Home Loan Rates' }, { href: '/bank-rates/personal-loan-rates', label: 'Personal Loan Rates' }];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Bank Rates', href: '/bank-rates' }, { label: 'Savings Rates' }]} />
      <h1 className="heading-1 mb-3">Savings Account Interest Rates</h1>
      <p className="text-body mb-6">Compare savings account rates across Indian banks. Higher rates available with small finance banks and digital banks.</p>
      <AdBanner format="horizontal" />
      <div className="my-8"><BankRateTable title="Savings Account Rate Comparison" rates={tableRates} showTenure={false} rateLabel="Savings Rate" /></div>
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Savings Account Rates</h2>
        <p className="text-body mb-4">Savings account interest in India is calculated on the daily closing balance and paid quarterly or half-yearly. Most large banks offer 2.70% to 3.50% per annum. Small finance banks and some digital banks offer 5% to 7%.</p>
        <p className="text-body mb-4">Interest earned up to Rs 10,000 per year from savings accounts is tax-free under Section 80TTA (Rs 50,000 for senior citizens under 80TTB).</p>
      </article>
      <ShareButton url="/bank-rates/savings-rates" title="Savings Rates - Paisa Reality" />
      <InternalLinks title="Related" links={otherLinks} columns={3} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
