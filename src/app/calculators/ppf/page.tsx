'use client';

import { useState, useMemo } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Calculator, { CalcSlider, CalcResult } from '@/components/Calculator';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';
import { formatINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';

const PPF_RATE = 7.1;
const PPF_TENURE = 15;

const PPF_FAQS = [
  { question: 'What is the current PPF interest rate?', answer: `The current PPF interest rate is ${PPF_RATE}% per annum (as of FY 2025-26). The rate is reviewed quarterly by the government. Interest is compounded annually and credited on 31st March each year.` },
  { question: 'What is the PPF lock-in period?', answer: 'PPF has a mandatory lock-in period of 15 years. Partial withdrawals are allowed from the 7th year onwards (up to 50% of the balance at the end of the 4th year). Premature closure is allowed after 5 years in special cases like serious illness or higher education.' },
  { question: 'What are the tax benefits of PPF?', answer: 'PPF enjoys EEE (Exempt-Exempt-Exempt) tax status. The annual deposit up to Rs 1.5 lakh qualifies for deduction under Section 80C. The interest earned is completely tax-free. The maturity amount is also tax-free. This makes PPF one of the most tax-efficient investments.' },
];

export default function PPFCalculatorPage(): React.ReactElement {
  const [yearlyDeposit, setYearlyDeposit] = useState<number>(100000);

  const result = useMemo(() => {
    const r = PPF_RATE / 100;
    const schedule: Array<{ year: number; deposit: number; interest: number; balance: number }> = [];
    let balance = 0;
    let totalDeposit = 0;
    let totalInterest = 0;

    for (let year = 1; year <= PPF_TENURE; year++) {
      balance += yearlyDeposit;
      totalDeposit += yearlyDeposit;
      const interest = balance * r;
      totalInterest += interest;
      balance += interest;
      schedule.push({ year, deposit: totalDeposit, interest: Math.round(interest), balance: Math.round(balance) });
    }

    trackCalculatorUse('ppf');
    return { maturityAmount: Math.round(balance), totalDeposit, totalInterest: Math.round(totalInterest), schedule };
  }, [yearlyDeposit]);

  const calcLinks = [
    { href: '/calculators/fd', label: 'FD Calculator' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/nps', label: 'NPS Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'PPF Calculator' }]} />
      <h1 className="heading-1 mb-6">PPF Calculator</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate PPF Returns"
          description={`Current PPF rate: ${PPF_RATE}% per annum. Tenure: ${PPF_TENURE} years.`}
          result={
            <CalcResult items={[
              { label: 'Maturity Amount', value: formatINR(result.maturityAmount), highlight: true },
              { label: 'Total Deposited', value: formatINR(result.totalDeposit) },
              { label: 'Total Interest Earned', value: formatINR(result.totalInterest) },
            ]} />
          }
        >
          <CalcSlider id="yearly" label="Yearly Deposit" value={yearlyDeposit} onChange={setYearlyDeposit} min={500} max={150000} step={500} prefix="Rs " />
        </Calculator>
      </div>

      {result.schedule.length > 0 && (
        <div className="my-8 overflow-x-auto">
          <h2 className="heading-2 mb-4">Year-wise PPF Growth</h2>
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold">Year</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Interest (Year)</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Balance</th>
            </tr></thead>
            <tbody>
              {result.schedule.map((row) => (
                <tr key={row.year} className="border-b border-gray-100">
                  <td className="py-2 px-4 text-sm">{row.year}</td>
                  <td className="py-2 px-4 text-sm text-right">{formatINR(row.interest)}</td>
                  <td className="py-2 px-4 text-sm text-right font-medium">{formatINR(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About PPF (Public Provident Fund)</h2>
        <p className="text-body mb-4">PPF is a government-backed long-term savings scheme with a 15-year lock-in period. It is one of the safest investment options in India as it is backed by the Government of India. The interest rate is set by the government every quarter based on government bond yields.</p>
        <p className="text-body mb-4">You can invest a minimum of Rs 500 and a maximum of Rs 1,50,000 per financial year. PPF accounts can be opened at post offices, SBI, and other nationalized banks. You can also open a PPF account online through net banking with select banks.</p>
        <p className="text-body mb-4">The biggest advantage of PPF is its EEE tax status: your deposits (up to Rs 1.5 lakh) are deductible under Section 80C, the interest earned is tax-free, and the maturity amount is also tax-free. No other fixed-income investment offers this triple tax benefit.</p>
      </article>

      <ShareButton url="/calculators/ppf" title="PPF Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={PPF_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}