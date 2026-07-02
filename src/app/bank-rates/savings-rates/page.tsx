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
import RatesAsOf from '@/components/RatesAsOf';

export const metadata = pageMetadata({
  title: 'Savings Account Interest Rates: Compare All Banks',
  description: 'Compare savings account interest rates across 50+ Indian banks. Find which bank gives the highest savings rate.',
  path: '/bank-rates/savings-rates',
  keywords: ['savings account interest rates', 'best savings account rate', 'highest savings rate india'],
});

interface SavingsRateRow extends QueryResultRow {
  bank_name: string; bank_slug: string; bank_type: string;
  tenure: string | null; general_rate: number; senior_citizen_rate: number | null;
}

export const revalidate = 3600;

export default async function SavingsRatesPage(): Promise<React.ReactElement> {
  let rates: SavingsRateRow[] = [];
  try {
    rates = await query<SavingsRateRow>(`SELECT b.name as bank_name, b.slug as bank_slug, b.type as bank_type,
              br.tenure, br.general_rate, br.senior_citizen_rate
       FROM bank_rates br JOIN banks b ON br.bank_id = b.id
       WHERE br.rate_type = 'savings'
       ORDER BY br.general_rate DESC, b.name`
    );
  } catch (error) { console.error('Failed to fetch savings rates:', error); }

  const tableRates = rates.map((r) => ({ bankName: r.bank_name, bankSlug: r.bank_slug, bankType: r.bank_type, tenure: r.tenure ?? 'Regular', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate }));
  const otherLinks = [{ href: '/bank-rates/fd-rates', label: 'FD Rates' }, { href: '/bank-rates/home-loan-rates', label: 'Home Loan Rates' }, { href: '/bank-rates/personal-loan-rates', label: 'Personal Loan Rates' }];

  const ldSchema = financialProductSchema({ name: 'Savings Account Interest Rates in India', description: 'Compare savings account interest rates across major Indian banks.', path: '/bank-rates/savings-rates', category: 'SavingsAccount' });
  return (
    <div className="container-main py-6">
      <script id="savingsrates-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSchema) }} />
      <Breadcrumb items={[{ label: 'Bank Rates', href: '/bank-rates' }, { label: 'Savings Rates' }]} />
      <h1 className="heading-1 mb-3">Savings Account Interest Rates</h1>
      <p className="text-body mb-2">Compare savings account rates across Indian banks. Higher rates available with small finance banks and digital banks.</p>
      <RatesAsOf rateType="savings" className="mb-6" />
      <AdBanner format="horizontal" />
      <div className="my-8"><BankRateTable title="Savings Account Rate Comparison" rates={tableRates} showTenure={false} rateLabel="Savings Rate" /></div>
      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Savings Account Rates</h2>
        <p className="text-body mb-4">Savings account interest in India is calculated on the daily closing balance and paid quarterly or half-yearly. Most large banks offer 2.70% to 3.50% per annum. Small finance banks and some digital banks offer 5% to 7%.</p>
        <p className="text-body mb-4">Interest earned up to Rs 10,000 per year from savings accounts is tax-free under Section 80TTA (Rs 50,000 for senior citizens under 80TTB).</p>
      </article>
      <FAQ items={[
        { question: 'What is a good savings account interest rate in India?', answer: 'Most large banks offer 2.70% to 3.50% on savings accounts. Some small finance banks and digital banks offer 5% to 7%, though higher rates can come with conditions like a minimum balance. Compare the latest rates in the table above.' },
        { question: 'How is savings account interest calculated?', answer: 'Interest is calculated on your daily closing balance and usually paid quarterly or half-yearly. Keeping a higher balance through the day earns more, even if you withdraw later in the month.' },
        { question: 'Is savings account interest taxable?', answer: 'Interest up to Rs 10,000 a year is deductible under Section 80TTA (Rs 50,000 for senior citizens under 80TTB). Interest above that limit is added to your income and taxed at your slab rate.' },
        { question: 'Are high-interest savings accounts safe?', answer: 'Deposits in scheduled banks, including small finance banks, are insured up to Rs 5 lakh per depositor by DICGC. For larger balances, you can spread money across banks or move surplus into FDs.' },
        { question: 'Should I keep extra money in savings or an FD?', answer: 'Keep only emergency and short-term money in savings for instant access. Money you will not need for months usually earns more in an FD. Some banks offer a sweep facility that auto-moves surplus into FDs.' },
      ]} />
      <ShareButton url="/bank-rates/savings-rates" title="Savings Rates - Paisa Reality" />
      <InternalLinks title="Related" links={otherLinks} columns={3} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
