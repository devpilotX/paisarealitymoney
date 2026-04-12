import type { Metadata } from 'next';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import Breadcrumb from '@/components/Breadcrumb';
import BankCard from '@/components/BankCard';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

export const metadata: Metadata = {
  title: 'Bank Rates in India - Compare FD, Savings, Loan Rates',
  description: 'Compare FD rates, savings account rates, home loan rates, and personal loan rates across 50+ Indian banks. Updated regularly.',
  alternates: { canonical: 'https://paisareality.com/bank-rates' },
};

interface BankSummaryRow extends RowDataPacket {
  slug: string; name: string; type: string;
  fd_rate: number | null; savings_rate: number | null; home_loan_rate: number | null;
}

const BANK_FAQS = [
  { question: 'Which bank gives the highest FD rate?', answer: 'Small finance banks typically offer the highest FD rates (7.5% to 9%). Among large banks, SBI, HDFC Bank, and ICICI Bank offer competitive rates. Senior citizens get an additional 0.25% to 0.50% on FD rates. Rates change frequently, so always check the latest rates on this page.' },
  { question: 'What is a good savings account interest rate?', answer: 'Most large banks offer 2.70% to 3% on savings accounts. Some small finance banks and digital banks offer up to 7% on savings accounts. However, higher savings rates often come with conditions like minimum balance requirements. Choose based on your needs.' },
  { question: 'How to compare home loan rates?', answer: 'Look at the MCLR or repo-linked lending rate (RLLR) plus the spread. Lower spread means better rate. Also compare processing fees, prepayment charges, and flexibility. Fixed vs floating rate is another important choice. Floating rates are currently more common in India.' },
];

export const revalidate = 3600;

export default async function BankRatesPage(): Promise<React.ReactElement> {
  let banks: BankSummaryRow[] = [];
  try {
    banks = await query<BankSummaryRow[]>(
      `SELECT b.slug, b.name, b.type,
              (SELECT br.general_rate FROM bank_rates br WHERE br.bank_id = b.id AND br.rate_type = 'fd' ORDER BY br.general_rate DESC LIMIT 1) as fd_rate,
              (SELECT br.general_rate FROM bank_rates br WHERE br.bank_id = b.id AND br.rate_type = 'savings' LIMIT 1) as savings_rate,
              (SELECT br.general_rate FROM bank_rates br WHERE br.bank_id = b.id AND br.rate_type = 'home_loan' ORDER BY br.general_rate ASC LIMIT 1) as home_loan_rate
       FROM banks b ORDER BY b.type, b.name`
    );
  } catch (error) { console.error('Failed to fetch banks:', error); }

  const rateLinks = [
    { href: '/bank-rates/fd-rates', label: 'FD Rate Comparison', description: 'Compare fixed deposit rates across all banks' },
    { href: '/bank-rates/savings-rates', label: 'Savings Account Rates', description: 'Compare savings interest rates' },
    { href: '/bank-rates/home-loan-rates', label: 'Home Loan Rates', description: 'Compare home loan interest rates' },
    { href: '/bank-rates/personal-loan-rates', label: 'Personal Loan Rates', description: 'Compare personal loan interest rates' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Bank Rates' }]} />
      <h1 className="heading-1 mb-3">Bank Rates in India</h1>
      <p className="text-body mb-6">Compare interest rates across 50+ Indian banks. FD rates, savings rates, home loan rates, and personal loan rates - all in one place.</p>

      <AdBanner format="horizontal" />

      <InternalLinks title="Compare by Rate Type" links={rateLinks} columns={2} />

      {banks.length > 0 && (
        <div className="my-8">
          <h2 className="heading-2 mb-4">All Banks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((bank) => (
              <BankCard
                key={bank.slug}
                slug={bank.slug}
                name={bank.name}
                type={bank.type}
                fdRate={bank.fd_rate ?? undefined}
                savingsRate={bank.savings_rate ?? undefined}
                homeLoanRate={bank.home_loan_rate ?? undefined}
              />
            ))}
          </div>
        </div>
      )}

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How to Choose the Right Bank</h2>
        <p className="text-body mb-4">When choosing a bank for deposits, compare interest rates, minimum balance requirements, online banking features, branch network, and customer service quality. For loans, compare the interest rate, processing fees, prepayment charges, and loan tenure flexibility.</p>
        <p className="text-body mb-4">Public sector banks like SBI, PNB, and Bank of Baroda typically offer slightly lower rates but have extensive branch networks. Private banks like HDFC, ICICI, and Axis offer better digital services. Small finance banks offer higher deposit rates but have fewer branches.</p>
      </article>

      <FAQ items={BANK_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}