import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import Breadcrumb from '@/components/Breadcrumb';
import BankRateTable from '@/components/BankRateTable';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import ShareButton from '@/components/ShareButton';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';

interface PageProps { params: Promise<{ bank: string }>; }

interface BankRow extends RowDataPacket {
  id: number; slug: string; name: string; type: string; website: string | null;
}

interface RateRow extends RowDataPacket {
  rate_type: string; tenure: string | null; general_rate: number;
  senior_citizen_rate: number | null; effective_date: string | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bank: bankSlug } = await params;
  try {
    const rows = await query<BankRow[]>('SELECT name, slug FROM banks WHERE slug = ? LIMIT 1', [bankSlug]);
    const bank = rows[0];
    if (!bank) return { title: 'Bank Not Found' };
    return {
      title: `${bank.name} Interest Rates - FD, Savings, Loan Rates`,
      description: `Check ${bank.name} FD rates, savings account rate, home loan rate, and personal loan rate. All rates updated regularly.`,
      alternates: { canonical: `https://paisareality.com/bank-rates/${bank.slug}` },
    };
  } catch { return { title: 'Bank Rates' }; }
}

export const revalidate = 3600;

export default async function BankDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { bank: bankSlug } = await params;
  let bank: BankRow | undefined;
  let rates: RateRow[] = [];

  try {
    const bankRows = await query<BankRow[]>('SELECT * FROM banks WHERE slug = ? LIMIT 1', [bankSlug]);
    bank = bankRows[0];
    if (bank) {
      rates = await query<RateRow[]>(
        'SELECT rate_type, tenure, general_rate, senior_citizen_rate, effective_date FROM bank_rates WHERE bank_id = ? ORDER BY rate_type, general_rate DESC',
        [bank.id]
      );
    }
  } catch (error) { console.error('Failed to load bank:', error); }

  if (!bank) notFound();

  const typeLabel: Record<string, string> = {
    public: 'Public Sector Bank', private: 'Private Sector Bank',
    small_finance: 'Small Finance Bank', cooperative: 'Cooperative Bank',
  };

  const fdRates = rates.filter((r) => r.rate_type === 'fd').map((r) => ({
    bankName: bank!.name, bankSlug: bank!.slug, bankType: bank!.type,
    tenure: r.tenure ?? '-', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate,
  }));
  const savingsRates = rates.filter((r) => r.rate_type === 'savings').map((r) => ({
    bankName: bank!.name, bankSlug: bank!.slug, bankType: bank!.type,
    tenure: r.tenure ?? 'Regular', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate,
  }));
  const homeLoanRates = rates.filter((r) => r.rate_type === 'home_loan').map((r) => ({
    bankName: bank!.name, bankSlug: bank!.slug, bankType: bank!.type,
    tenure: r.tenure ?? 'Up to 30 years', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate,
  }));
  const personalLoanRates = rates.filter((r) => r.rate_type === 'personal_loan').map((r) => ({
    bankName: bank!.name, bankSlug: bank!.slug, bankType: bank!.type,
    tenure: r.tenure ?? 'Up to 5 years', generalRate: r.general_rate, seniorCitizenRate: r.senior_citizen_rate,
  }));

  const faqs = [
    { question: `What is ${bank.name} FD rate?`, answer: fdRates.length > 0 ? `${bank.name} offers FD rates from ${Math.min(...fdRates.map(r => r.generalRate)).toFixed(2)}% to ${Math.max(...fdRates.map(r => r.generalRate)).toFixed(2)}% depending on tenure. Senior citizens get additional 0.25% to 0.50%.` : `FD rates for ${bank.name} are being updated.` },
    { question: `Is ${bank.name} safe for deposits?`, answer: `All bank deposits in India are insured by DICGC (Deposit Insurance and Credit Guarantee Corporation) up to Rs 5 lakh per depositor per bank. ${bank.name} is a ${typeLabel[bank.type] ?? bank.type} regulated by the Reserve Bank of India.` },
    { question: `How to open an account in ${bank.name}?`, answer: `You can open an account by visiting any ${bank.name} branch with your Aadhaar card, PAN card, and address proof. Many banks also offer online account opening through their website or mobile app.${bank.website ? ` Visit ${bank.website} for more details.` : ''}` },
  ];

  const otherBankLinks = [
    { href: '/bank-rates/fd-rates', label: 'Compare All FD Rates' },
    { href: '/bank-rates/savings-rates', label: 'Compare Savings Rates' },
    { href: '/bank-rates/home-loan-rates', label: 'Compare Home Loan Rates' },
    { href: '/calculators/fd', label: 'FD Calculator' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Bank Rates', href: '/bank-rates' }, { label: bank.name }]} />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="heading-1 mb-2">{bank.name} Interest Rates</h1>
          <p className="text-sm text-gray-500">{typeLabel[bank.type] ?? bank.type}</p>
        </div>
        {bank.website && (
          <a href={bank.website} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm no-underline flex-shrink-0">
            Official Website
          </a>
        )}
      </div>

      <AdBanner format="horizontal" />

      {/* FD Rates */}
      {fdRates.length > 0 && (
        <div className="my-8">
          <BankRateTable title={`${bank.name} FD Rates`} rates={fdRates} rateLabel="FD Rate" />
        </div>
      )}

      {/* Savings Rates */}
      {savingsRates.length > 0 && (
        <div className="my-8">
          <BankRateTable title={`${bank.name} Savings Account Rate`} rates={savingsRates} showTenure={false} rateLabel="Savings Rate" />
        </div>
      )}

      <InArticleAd />

      {/* Home Loan Rates */}
      {homeLoanRates.length > 0 && (
        <div className="my-8">
          <BankRateTable title={`${bank.name} Home Loan Rates`} rates={homeLoanRates} rateLabel="Home Loan Rate" />
        </div>
      )}

      {/* Personal Loan Rates */}
      {personalLoanRates.length > 0 && (
        <div className="my-8">
          <BankRateTable title={`${bank.name} Personal Loan Rates`} rates={personalLoanRates} rateLabel="Personal Loan Rate" />
        </div>
      )}

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About {bank.name}</h2>
        <p className="text-body mb-4">{bank.name} is a {typeLabel[bank.type]?.toLowerCase() ?? bank.type} in India regulated by the Reserve Bank of India. All deposits are insured up to Rs 5 lakh per depositor by DICGC.</p>
        <p className="text-body mb-4">Interest rates shown above are sourced from the bank's official website and are updated regularly. Rates may change without prior notice. Always verify the latest rates on the bank's official website or by visiting the nearest branch before making any financial decision.</p>
        {bank.website && (
          <p className="text-body mb-4">Official website: <a href={bank.website} target="_blank" rel="noopener noreferrer" className="link-internal">{bank.website}</a></p>
        )}
      </article>

      <ShareButton url={`/bank-rates/${bank.slug}`} title={`${bank.name} Interest Rates`} />
      <InternalLinks title="Compare & Calculate" links={otherBankLinks} columns={3} />
      <FAQ items={faqs} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
