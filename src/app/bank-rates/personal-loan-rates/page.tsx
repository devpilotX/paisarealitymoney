import { pageMetadata } from '@/lib/seo';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

import Breadcrumb from '@/components/Breadcrumb';
import BankRateTable from '@/components/BankRateTable';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import ShareButton from '@/components/ShareButton';

export const metadata = pageMetadata({
  title: 'Personal Loan Interest Rates: Compare All Banks',
  description: 'Compare personal loan rates across Indian banks. Find the lowest personal loan rate for your needs.',
  path: '/bank-rates/personal-loan-rates',
  keywords: ['personal loan interest rates', 'lowest personal loan rate', 'personal loan rates india'],
});

interface LoanRateRow extends QueryResultRow {
  bank_name: string; bank_slug: string; bank_type: string;
  tenure: string | null; general_rate: number; senior_citizen_rate: number | null;
}

export const revalidate = 3600;

export default async function PersonalLoanRatesPage(): Promise<React.ReactElement> {
  let rates: LoanRateRow[] = [];
  try {
    rates = await query<LoanRateRow>(`SELECT b.name as bank_name, b.slug as bank_slug, b.type as bank_type,
              br.tenure, br.general_rate, br.senior_citizen_rate
       FROM bank_rates br JOIN banks b ON br.bank_id = b.id
       WHERE br.rate_type = 'personal_loan'
       ORDER BY br.general_rate ASC, b.name`
    );
  } catch (error) { console.error('Failed to fetch personal loan rates:', error); }

  const tableRates = rates.map((r) => ({ bankName: r.bank_name, bankSlug: r.bank_slug, bankType: r.bank_type, tenure: r.tenure ?? 'Up to 5 years', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate }));
  const otherLinks = [{ href: '/bank-rates/home-loan-rates', label: 'Home Loan Rates' }, { href: '/bank-rates/fd-rates', label: 'FD Rates' }, { href: '/calculators/emi', label: 'EMI Calculator' }];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Bank Rates', href: '/bank-rates' }, { label: 'Personal Loan Rates' }]} />
      <h1 className="heading-1 mb-3">Personal Loan Interest Rates</h1>
      <p className="text-body mb-6">Compare personal loan rates. Rates depend on your credit score, income, and employer.</p>
      <AdBanner format="horizontal" />
      <div className="my-8"><BankRateTable title="Personal Loan Rate Comparison" rates={tableRates} rateLabel="Personal Loan Rate" /></div>
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Personal Loan Rates</h2>
        <p className="text-body mb-4">Personal loan rates in India range from 10% to 24% depending on the bank, your credit score (CIBIL score), income, employer, and loan amount. Salaried employees at large companies generally get lower rates. A CIBIL score above 750 helps you get the best rates.</p>
        <p className="text-body mb-4">Personal loans are unsecured (no collateral needed) which is why rates are higher than home loans or car loans. Processing fees typically range from 1% to 3% of the loan amount. Some banks waive processing fees during promotional periods.</p>
      </article>
      <FAQ items={[
        { question: 'What is a good personal loan interest rate?', answer: 'Personal loan rates in India typically range from about 10% to 24%. Rates near 10 to 12% are good and usually go to salaried borrowers with high credit scores at large employers.' },
        { question: 'How is my personal loan rate decided?', answer: 'Lenders look at your credit score, income, employer, existing loans, and the amount and tenure you want. A CIBIL score above 750 usually unlocks the best rates.' },
        { question: 'Why are personal loan rates higher than home loans?', answer: 'Personal loans are unsecured, with no collateral, so the lender takes more risk and charges a higher rate. Secured loans like home or car loans are cheaper because an asset backs them.' },
        { question: 'What fees apply on a personal loan?', answer: 'Expect a processing fee of about 1% to 3% of the loan amount, and sometimes prepayment or foreclosure charges. Read the terms so you know the true cost beyond the headline rate.' },
        { question: 'How can I get a lower personal loan rate?', answer: 'Improve your credit score, reduce existing debt, apply with a steady income and employer, and compare offers across banks. A pre-approved offer from your salary-account bank is often cheaper.' },
      ]} />
      <ShareButton url="/bank-rates/personal-loan-rates" title="Personal Loan Rates - Paisa Reality" />
      <InternalLinks title="Related" links={otherLinks} columns={3} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}