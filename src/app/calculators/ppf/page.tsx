'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import Calculator, { CalcSlider, CalcSelect, CalcResult } from '@/components/Calculator';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';
import { formatINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';

const DEFAULT_PPF_RATE = 7.1;
const BASE_TENURE = 15;

type Frequency = 'yearly' | 'monthly';

interface YearRow { year: number; deposit: number; interest: number; balance: number; }
interface PPFResult { maturityAmount: number; totalDeposit: number; totalInterest: number; schedule: YearRow[]; }

/**
 * PPF growth simulation.
 * - Yearly: the deposit is made at the start of the year (on or before 5 April),
 *   so it earns a full year of interest, credited annually. Annuity-due behaviour.
 * - Monthly: PPF interest accrues on the lowest balance between the 5th and the
 *   last day of each month at one-twelfth of the annual rate, then the whole
 *   year's interest is credited on 31 March. Deposits are assumed to be made on
 *   or before the 5th, so each month's deposit earns that month's interest.
 */
function computePPF(amount: number, frequency: Frequency, ratePct: number, years: number): PPFResult {
  const r = ratePct / 100;
  const schedule: YearRow[] = [];
  let balance = 0;
  let totalDeposit = 0;
  let totalInterest = 0;

  for (let year = 1; year <= years; year++) {
    let yearInterest = 0;
    if (frequency === 'yearly') {
      balance += amount;
      totalDeposit += amount;
      yearInterest = balance * r;
      balance += yearInterest;
    } else {
      for (let m = 0; m < 12; m++) {
        balance += amount;                 // deposited on or before the 5th
        totalDeposit += amount;
        yearInterest += balance * (r / 12); // accrues on the month's balance
      }
      balance += yearInterest;             // credited at year end (31 March)
    }
    totalInterest += yearInterest;
    schedule.push({
      year,
      deposit: Math.round(totalDeposit),
      interest: Math.round(yearInterest),
      balance: Math.round(balance),
    });
  }

  return {
    maturityAmount: Math.round(balance),
    totalDeposit: Math.round(totalDeposit),
    totalInterest: Math.round(totalInterest),
    schedule,
  };
}

export default function PPFCalculatorPage(): React.ReactElement {
  const [frequency, setFrequency] = useState<Frequency>('yearly');
  const [amount, setAmount] = useState<number>(100000);
  const [rate, setRate] = useState<number>(DEFAULT_PPF_RATE);
  const [tenure, setTenure] = useState<number>(BASE_TENURE);

  const amountMax = frequency === 'monthly' ? 12500 : 150000;

  const result = useMemo(
    () => computePPF(amount, frequency, rate, tenure),
    [amount, frequency, rate, tenure]
  );

  // Reference table: maturity by monthly investment at the chosen rate and tenure.
  const referenceRows = useMemo(() => {
    return [1000, 2000, 3000, 5000, 10000, 12500].map((m) => {
      const res = computePPF(m, 'monthly', rate, tenure);
      return { monthly: m, invested: res.totalDeposit, maturity: res.maturityAmount };
    });
  }, [rate, tenure]);

  useEffect(() => { trackCalculatorUse('ppf'); }, []);

  function onFrequencyChange(value: string): void {
    const f = value as Frequency;
    setFrequency(f);
    const max = f === 'monthly' ? 12500 : 150000;
    setAmount((a) => Math.min(a, max));
  }

  const calcLinks = [
    { href: '/calculators/fd', label: 'FD Calculator' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/nps', label: 'NPS Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
    { href: '/interest-rates', label: 'Small Savings Rates' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'PPF Calculator' }]} />
      <h1 className="heading-1 mb-6">PPF Calculator</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate PPF Returns"
          description="See your PPF balance at maturity with year-by-year growth. Choose monthly or yearly deposits, set the interest rate, and extend the term in 5-year blocks."
          result={
            <CalcResult items={[
              { label: 'Maturity Amount', value: formatINR(result.maturityAmount), highlight: true },
              { label: 'Total Deposited', value: formatINR(result.totalDeposit) },
              { label: 'Total Interest Earned', value: formatINR(result.totalInterest) },
            ]} />
          }
        >
          <CalcSelect
            id="frequency"
            label="Deposit Frequency"
            value={frequency}
            onChange={onFrequencyChange}
            options={[{ value: 'yearly', label: 'Yearly' }, { value: 'monthly', label: 'Monthly' }]}
          />
          <CalcSlider
            id="amount"
            label={frequency === 'monthly' ? 'Monthly Deposit' : 'Yearly Deposit'}
            value={amount}
            onChange={setAmount}
            min={500}
            max={amountMax}
            step={500}
            prefix="Rs "
          />
          <CalcSlider
            id="rate"
            label="Interest Rate (per annum)"
            value={rate}
            onChange={setRate}
            min={6}
            max={9}
            step={0.1}
            suffix="%"
            displayValue={`${rate.toFixed(1)}%`}
          />
          <CalcSelect
            id="tenure"
            label="Tenure"
            value={String(tenure)}
            onChange={(v) => setTenure(parseInt(v, 10))}
            options={[
              { value: '15', label: '15 years (standard)' },
              { value: '20', label: '20 years (one 5-year extension)' },
              { value: '25', label: '25 years (two extensions)' },
              { value: '30', label: '30 years (three extensions)' },
            ]}
          />
        </Calculator>
      </div>

      <div className="max-w-2xl mb-8 rounded-lg bg-primary-50 border-l-4 border-primary px-4 py-3">
        <p className="text-sm text-ink">
          <strong>Tip:</strong> PPF interest is calculated on the lowest balance in your account
          between the 5th and the last day of each month. Deposit on or before the 5th so your money
          earns interest for that month. This calculator assumes deposits are made by the 5th.
        </p>
      </div>

      {result.schedule.length > 0 && (
        <div className="my-8 overflow-x-auto">
          <h2 className="heading-2 mb-4">Year-wise PPF Growth</h2>
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-line bg-paper-2">
              <th className="text-left py-3 px-4 text-sm font-semibold">Year</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Total Invested</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Interest (Year)</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Balance</th>
            </tr></thead>
            <tbody>
              {result.schedule.map((row) => (
                <tr key={row.year} className="border-b border-line/60">
                  <td className="py-2 px-4 text-sm">{row.year}</td>
                  <td className="py-2 px-4 text-sm text-right">{formatINR(row.deposit)}</td>
                  <td className="py-2 px-4 text-sm text-right">{formatINR(row.interest)}</td>
                  <td className="py-2 px-4 text-sm text-right font-medium">{formatINR(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />

      <div className="my-8 overflow-x-auto max-w-2xl">
        <h2 className="heading-2 mb-2">PPF maturity by monthly investment</h2>
        <p className="text-sm text-muted-2 mb-4">
          At {rate.toFixed(1)}% for {tenure} years, investing the same amount every month grows to:
        </p>
        <table className="w-full border-collapse">
          <thead><tr className="border-b-2 border-line bg-paper-2">
            <th className="text-left py-3 px-4 text-sm font-semibold">Monthly Deposit</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Total Invested</th>
            <th className="text-right py-3 px-4 text-sm font-semibold">Maturity Value</th>
          </tr></thead>
          <tbody>
            {referenceRows.map((row) => (
              <tr key={row.monthly} className="border-b border-line/60">
                <td className="py-2 px-4 text-sm">{formatINR(row.monthly)}</td>
                <td className="py-2 px-4 text-sm text-right">{formatINR(row.invested)}</td>
                <td className="py-2 px-4 text-sm text-right font-medium">{formatINR(row.maturity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">About PPF (Public Provident Fund)</h2>
        <p className="text-body mb-4">PPF is a government-backed long-term savings scheme with a 15-year lock-in period. It is one of the safest investment options in India as it is backed by the Government of India. The interest rate is set by the government every quarter based on government bond yields.</p>
        <p className="text-body mb-4">You can invest a minimum of Rs 500 and a maximum of Rs 1,50,000 per financial year. PPF accounts can be opened at post offices, SBI, and other nationalized banks. You can also open a PPF account online through net banking with select banks.</p>
        <p className="text-body mb-4">The biggest advantage of PPF is its EEE tax status: your deposits (up to Rs 1.5 lakh) are deductible under Section 80C, the interest earned is tax-free, and the maturity amount is also tax-free. No other fixed-income investment offers this triple tax benefit.</p>

        <h2 className="heading-2 mt-8 mb-4">Monthly or yearly: which earns more?</h2>
        <p className="text-body mb-4">A single lump sum deposited on or before 5 April earns interest for the whole financial year, so it gives the highest maturity value. If you prefer to invest monthly, deposit on or before the 5th of each month so every instalment earns that month&apos;s interest. Over a 15 year term the gap between a disciplined monthly plan and a lump sum is modest, so pick whatever fits your cash flow. Use the frequency switch above to compare both for your own numbers.</p>

        <h2 className="heading-2 mt-8 mb-4">PPF at the post office and banks</h2>
        <p className="text-body mb-4">You can open a PPF account at any post office or at banks such as SBI, HDFC, and ICICI. A post office PPF account and a bank PPF account follow the exact same rules and the same government interest rate, so your maturity value is identical wherever you open it. Many banks let you open and manage PPF online through net banking.</p>

        <h2 className="heading-2 mt-8 mb-4">Loan and partial withdrawal from PPF</h2>
        <p className="text-body mb-4">You can take a loan against your PPF balance between the 3rd and 6th financial years, and partial withdrawals are allowed from the 7th year onwards. This makes PPF more flexible than it first appears, while the 15 year term keeps it a strong long-term, tax-free savings tool.</p>

        <h2 className="heading-2 mt-8 mb-4">Example: Rs 1.5 lakh a year for 15 years</h2>
        <p className="text-body mb-4">If you invest the full Rs 1,50,000 every year at the current {DEFAULT_PPF_RATE}% rate, you deposit Rs 22,50,000 over 15 years and the account matures to roughly Rs 40,68,000, so the tax-free interest alone is about Rs 18,18,000. Change the yearly deposit in the calculator above to see your own maturity value.</p>

        <h2 className="heading-2 mt-8 mb-4">Official sources</h2>
        <p className="text-body mb-4">PPF is governed by the Public Provident Fund Scheme, 2019. The interest rate is notified every quarter by the Ministry of Finance, Department of Economic Affairs. You can verify the current rules and rate with the <a href="https://www.nsiindia.gov.in/" target="_blank" rel="noopener noreferrer nofollow" className="link-internal">National Savings Institute</a> and open or manage an account at <Link href="/interest-rates" className="link-internal">India Post or your bank</Link>. This page is informational and updates the rate as the government revises it.</p>
      </article>

      <ShareButton url="/calculators/ppf" title="PPF Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={PPF_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}

const PPF_FAQS = [
  { question: 'What is the current PPF interest rate?', answer: `The current PPF interest rate is ${DEFAULT_PPF_RATE}% per annum (as of FY 2026-27). The rate is reviewed quarterly by the government. Interest is compounded annually and credited on 31st March each year.` },
  { question: 'How much can I invest in PPF per year?', answer: 'You can invest between Rs 500 and Rs 1.5 lakh in a PPF account in a financial year. Anything above Rs 1.5 lakh earns no interest and gets no tax benefit. You can deposit it as a lump sum or in up to 12 instalments across the year.' },
  { question: 'Should I invest in PPF monthly or as a yearly lump sum?', answer: 'Both work. A single lump sum deposited on or before 5 April earns interest for the whole year and gives the highest maturity value. If you invest monthly, deposit on or before the 5th of each month so each instalment earns that month&apos;s interest. Over 15 years the difference is modest, so choose what suits your cash flow. This is general information, not advice.' },
  { question: 'How is PPF interest calculated each month?', answer: 'Interest accrues on the lowest balance in your account between the 5th and the last day of the month, at one-twelfth of the annual rate. It is not paid out monthly; it is totalled over the year and credited to your account on 31 March. That is why depositing on or before the 5th matters.' },
  { question: 'What is the PPF lock-in period?', answer: 'PPF has a mandatory lock-in period of 15 years. Partial withdrawals are allowed from the 7th year onwards (up to 50% of the balance at the end of the 4th year). Premature closure is allowed after 5 years in special cases like serious illness or higher education.' },
  { question: 'Can I extend my PPF account after 15 years?', answer: 'Yes. After maturity you can extend the account in blocks of 5 years, with or without further contributions. The balance keeps earning the prevailing PPF rate, and during an extension you can make one partial withdrawal each year. Set the tenure to 20, 25 or 30 years in the calculator to see the effect.' },
  { question: 'What are the tax benefits of PPF?', answer: 'PPF enjoys EEE (Exempt-Exempt-Exempt) tax status. The annual deposit up to Rs 1.5 lakh qualifies for deduction under Section 80C. The interest earned is completely tax-free. The maturity amount is also tax-free. This makes PPF one of the most tax-efficient investments.' },
  { question: 'Is PPF better than ELSS for saving tax?', answer: 'Both qualify under Section 80C. PPF is fully safe with a fixed government rate and a 15 year lock-in, while ELSS invests in equity with a 3 year lock-in and higher but market-linked returns. PPF suits safety, ELSS suits long-term growth, and many people use both. This is general information, not advice.' },
  { question: 'Can I open a PPF account at the post office?', answer: 'Yes. PPF can be opened at any post office or at authorised banks such as SBI, HDFC, and ICICI. The rules, the Rs 1.5 lakh annual limit, the 15 year term, and the government interest rate are identical everywhere, so your maturity value is the same whether you use a post office or a bank.' },
  { question: 'Can I take a loan against my PPF account?', answer: 'Yes. You can take a loan against your PPF balance from the 3rd to the 6th financial year, before partial withdrawals become available from the 7th year. The loan is a small percentage of your balance and carries a low interest rate over the PPF rate.' },
];
