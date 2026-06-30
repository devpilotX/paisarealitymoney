import { pageMetadata } from '@/lib/seo';
import { financialProductSchema } from '@/lib/schema';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

import Breadcrumb from '@/components/Breadcrumb';
import BankRateTable from '@/components/BankRateTable';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';

export const metadata = pageMetadata({
  title: 'Home Loan Interest Rates: Compare All Banks 2026',
  description: 'Compare home loan interest rates across 50+ banks. Find the lowest home loan rate. Updated regularly.',
  path: '/bank-rates/home-loan-rates',
  keywords: ['home loan interest rates', 'lowest home loan rate', 'home loan rates india 2026'],
});

interface LoanRateRow extends QueryResultRow {
  bank_name: string; bank_slug: string; bank_type: string;
  tenure: string | null; general_rate: number; senior_citizen_rate: number | null;
}

export const revalidate = 3600;

export default async function HomeLoanRatesPage(): Promise<React.ReactElement> {
  let rates: LoanRateRow[] = [];
  try {
    rates = await query<LoanRateRow>(`SELECT b.name as bank_name, b.slug as bank_slug, b.type as bank_type,
              br.tenure, br.general_rate, br.senior_citizen_rate
       FROM bank_rates br JOIN banks b ON br.bank_id = b.id
       WHERE br.rate_type = 'home_loan'
       ORDER BY br.general_rate ASC, b.name`
    );
  } catch (error) { console.error('Failed to fetch home loan rates:', error); }

  const tableRates = rates.map((r) => ({ bankName: r.bank_name, bankSlug: r.bank_slug, bankType: r.bank_type, tenure: r.tenure ?? 'Up to 30 years', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate }));
  const otherLinks = [{ href: '/bank-rates/fd-rates', label: 'FD Rates' }, { href: '/bank-rates/personal-loan-rates', label: 'Personal Loan Rates' }, { href: '/calculators/home-loan', label: 'Home Loan Calculator' }, { href: '/calculators/emi', label: 'EMI Calculator' }];

  const ldSchema = financialProductSchema({ name: 'Home Loan Interest Rates in India', description: 'Compare home loan interest rates across 50+ Indian banks and lenders.', path: '/bank-rates/home-loan-rates', category: 'MortgageLoan' });
  return (
    <div className="container-main py-6">
      <script id="homeloanrates-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSchema) }} />
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
      <FAQ items={[
        { question: 'What is a good home loan interest rate in India?', answer: 'Home loan rates in India generally range from about 8.25% to 9.5%, depending on the bank, your credit score, and the loan amount. A rate near the lower end is considered good. Compare a few lenders before deciding.' },
        { question: 'Are home loan rates fixed or floating?', answer: 'Most home loans in India are floating, linked to the RBI repo rate (EBLR). When the repo rate changes, your EMI changes. Fixed-rate home loans exist but are less common and usually priced higher.' },
        { question: 'How much home loan can I get on my salary?', answer: 'Lenders usually keep your total EMIs within 40 to 50% of your monthly income. A longer tenure or a co-applicant can raise eligibility. Use our home loan calculator to estimate your EMI.' },
        { question: 'Can I reduce my home loan interest rate?', answer: 'You can ask your bank to lower your spread, improve your credit score, or transfer the balance to a cheaper lender. Even a 0.25% cut can save lakhs over a long tenure.' },
        { question: 'What charges apply on a home loan besides interest?', answer: 'Common charges include a processing fee (around 0.5% to 1%), legal and valuation fees, and stamp duty on the mortgage. Prepayment of floating-rate home loans is usually free of charge.' },
      ]} />
      <ShareButton url="/bank-rates/home-loan-rates" title="Home Loan Rates - Paisa Reality" />
      <InternalLinks title="Related" links={otherLinks} columns={2} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
