import type { Metadata } from 'next';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import Breadcrumb from '@/components/Breadcrumb';
import BankRateTable from '@/components/BankRateTable';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';

export const metadata: Metadata = {
  title: 'Home Loan Interest Rates - Compare All Banks 2026',
  description: 'Compare home loan interest rates across 50+ banks. Find the lowest home loan rate. Updated regularly.',
  alternates: { canonical: 'https://paisareality.com/bank-rates/home-loan-rates' },
};

interface LoanRateRow extends RowDataPacket {
  bank_name: string; bank_slug: string; bank_type: string;
  tenure: string | null; general_rate: number; senior_citizen_rate: number | null;
}

export const revalidate = 3600;

export default async function HomeLoanRatesPage(): Promise<React.ReactElement> {
  let rates: LoanRateRow[] = [];
  try {
    rates = await query<LoanRateRow[]>(
      `SELECT b.name as bank_name, b.slug as bank_slug, b.type as bank_type,
              br.tenure, br.general_rate, br.senior_citizen_rate
       FROM bank_rates br JOIN banks b ON br.bank_id = b.id
       WHERE br.rate_type = 'home_loan'
       ORDER BY br.general_rate ASC, b.name`
    );
  } catch (error) { console.error('Failed to fetch home loan rates:', error); }

  const tableRates = rates.map((r) => ({ bankName: r.bank_name, bankSlug: r.bank_slug, bankType: r.bank_type, tenure: r.tenure ?? 'Up to 30 years', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate }));
  const otherLinks = [{ href: '/bank-rates/fd-rates', label: 'FD Rates' }, { href: '/bank-rates/personal-loan-rates', label: 'Personal Loan Rates' }, { href: '/calculators/home-loan', label: 'Home Loan Calculator' }, { href: '/calculators/emi', label: 'EMI Calculator' }];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Bank Rates', href: '/bank-rates' }, { label: 'Home Loan Rates' }]} />
      <h1 className="heading-1 mb-3">Home Loan Interest Rates 2026</h1>
      <p className="text-body mb-6">Compare home loan rates across Indian banks. Sorted by lowest rate first. Click headers to re-sort.</p>
      <AdBanner format="horizontal" />
      <div className="my-8"><BankRateTable title="Home Loan Rate Comparison" rates={tableRates} rateLabel="Home Loan Rate" /></div>
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Home Loan Rates in India</h2>
        <p className="text-body mb-4">Most home loans in India are now linked to the RBI repo rate (External Benchmark Lending Rate or EBLR). When RBI changes the repo rate, your home loan EMI changes accordingly. The actual rate you get depends on your credit score, loan amount, and relationship with the bank.</p>
        <p className="text-body mb-4">A difference of just 0.25% in home loan rate can save you lakhs over the loan tenure. For a Rs 50 lakh loan over 20 years, each 0.25% reduction saves approximately Rs 2.5 lakh in total interest. Always negotiate with the bank for a lower spread.</p>
      </article>
      <ShareButton url="/bank-rates/home-loan-rates" title="Home Loan Rates - Paisa Reality" />
      <InternalLinks title="Related" links={otherLinks} columns={2} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
