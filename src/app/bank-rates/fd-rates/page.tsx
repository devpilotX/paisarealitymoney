import type { Metadata } from 'next';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import Breadcrumb from '@/components/Breadcrumb';
import BankRateTable from '@/components/BankRateTable';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';

export const metadata: Metadata = {
  title: 'FD Interest Rates - Compare Fixed Deposit Rates 2026',
  description: 'Compare fixed deposit (FD) interest rates across 50+ Indian banks. Find the highest FD rate for your tenure. Senior citizen rates included.',
  alternates: { canonical: 'https://paisareality.com/bank-rates/fd-rates' },
};

interface FDRateRow extends RowDataPacket {
  bank_name: string; bank_slug: string; bank_type: string;
  tenure: string; general_rate: number; senior_citizen_rate: number | null;
}

const FD_FAQS = [
  { question: 'Which bank has the highest FD rate in 2026?', answer: 'Small finance banks like AU Small Finance Bank, Equitas Small Finance Bank, and Unity Small Finance Bank typically offer the highest FD rates (7.5% to 9%). Among large banks, SBI offers up to 7.10% and HDFC Bank up to 7.25% for select tenures. Senior citizens get 0.25% to 0.75% extra.' },
  { question: 'What is the best FD tenure?', answer: 'The best tenure depends on the bank and your needs. Many banks offer their highest rates for 1 to 2 year FDs. Some banks have special FD schemes (like SBI Amrit Kalash, HDFC Bank special FD) with higher rates for specific tenures. Compare rates for your preferred tenure using the table above.' },
  { question: 'Is FD interest taxable?', answer: 'Yes, FD interest is fully taxable as per your income tax slab. TDS is deducted at 10% if annual interest exceeds Rs 40,000 (Rs 50,000 for senior citizens). Submit Form 15G/15H to avoid TDS if your total income is below the taxable limit. Consider tax-saving 5-year FD for Section 80C deduction.' },
];

export const revalidate = 3600;

export default async function FDRatesPage(): Promise<React.ReactElement> {
  let rates: FDRateRow[] = [];
  try {
    rates = await query<FDRateRow[]>(
      `SELECT b.name as bank_name, b.slug as bank_slug, b.type as bank_type,
              br.tenure, br.general_rate, br.senior_citizen_rate
       FROM bank_rates br JOIN banks b ON br.bank_id = b.id
       WHERE br.rate_type = 'fd'
       ORDER BY br.general_rate DESC, b.name`
    );
  } catch (error) { console.error('Failed to fetch FD rates:', error); }

  const tableRates = rates.map((r) => ({
    bankName: r.bank_name, bankSlug: r.bank_slug, bankType: r.bank_type,
    tenure: r.tenure, generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate,
  }));

  const otherLinks = [
    { href: '/bank-rates/savings-rates', label: 'Savings Account Rates' },
    { href: '/bank-rates/home-loan-rates', label: 'Home Loan Rates' },
    { href: '/bank-rates/personal-loan-rates', label: 'Personal Loan Rates' },
    { href: '/calculators/fd', label: 'FD Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Bank Rates', href: '/bank-rates' }, { label: 'FD Rates' }]} />
      <h1 className="heading-1 mb-3">Fixed Deposit (FD) Interest Rates 2026</h1>
      <p className="text-body mb-6">Compare FD rates across 50+ Indian banks. Click column headers to sort. Senior citizen rates included.</p>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <BankRateTable title="FD Rate Comparison" rates={tableRates} rateLabel="FD Rate" />
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About Fixed Deposit Rates</h2>
        <p className="text-body mb-4">Fixed deposit rates in India are set by individual banks based on their lending requirements, RBI policy rates, and market conditions. When the RBI increases the repo rate, FD rates generally go up, and vice versa.</p>
        <p className="text-body mb-4">Senior citizens get a premium of 0.25% to 0.75% over regular FD rates at most banks. Some banks also offer special FD schemes for women, government employees, or for specific tenures with higher rates.</p>
      </article>

      <ShareButton url="/bank-rates/fd-rates" title="FD Rates Comparison - Paisa Reality" />
      <InternalLinks title="Related" links={otherLinks} columns={2} />
      <FAQ items={FD_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}