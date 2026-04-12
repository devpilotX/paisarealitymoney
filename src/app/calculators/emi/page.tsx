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

const EMI_FAQS = [
  { question: 'What is EMI?', answer: 'EMI stands for Equated Monthly Installment. It is the fixed amount you pay every month to repay a loan. EMI includes both principal repayment and interest. The EMI amount stays the same throughout the loan tenure, but the proportion of principal and interest changes over time.' },
  { question: 'How is EMI calculated?', answer: 'EMI is calculated using the formula: EMI = P x r x (1+r)^n / ((1+r)^n - 1), where P is the loan amount, r is the monthly interest rate (annual rate divided by 12), and n is the total number of monthly installments. This formula ensures equal payments throughout the loan period.' },
  { question: 'Does prepaying a loan reduce EMI?', answer: 'Prepaying a loan reduces the outstanding principal. You can either keep the same EMI and reduce tenure, or reduce the EMI and keep the same tenure. Reducing tenure saves more interest overall. Most banks allow prepayment without penalty for floating rate loans.' },
];

export default function EMICalculatorPage(): React.ReactElement {
  const [loanAmount, setLoanAmount] = useState<number>(2500000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(20);

  const result = useMemo(() => {
    const P = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenure * 12;

    if (P <= 0 || r <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0, schedule: [] };

    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    const schedule: Array<{ year: number; principal: number; interest: number; balance: number }> = [];
    let balance = P;
    for (let year = 1; year <= tenure; year++) {
      let yearPrincipal = 0;
      let yearInterest = 0;
      for (let month = 0; month < 12; month++) {
        const monthInterest = balance * r;
        const monthPrincipal = emi - monthInterest;
        yearPrincipal += monthPrincipal;
        yearInterest += monthInterest;
        balance -= monthPrincipal;
      }
      schedule.push({ year, principal: yearPrincipal, interest: yearInterest, balance: Math.max(0, balance) });
    }

    trackCalculatorUse('emi');
    return { emi, totalInterest, totalPayment, schedule };
  }, [loanAmount, interestRate, tenure]);

  const calcLinks = [
    { href: '/calculators/home-loan', label: 'Home Loan Calculator' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/fd', label: 'FD Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'EMI Calculator' }]} />
      <h1 className="heading-1 mb-6">EMI Calculator</h1>

      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate Your Monthly EMI"
          description="Enter loan amount, interest rate, and tenure to see your monthly payment."
          result={
            <CalcResult items={[
              { label: 'Monthly EMI', value: formatINR(Math.round(result.emi)), highlight: true },
              { label: 'Total Interest', value: formatINR(Math.round(result.totalInterest)) },
              { label: 'Total Payment', value: formatINR(Math.round(result.totalPayment)) },
              { label: 'Loan Amount', value: formatINR(loanAmount) },
            ]} />
          }
        >
          <CalcSlider id="loan-amount" label="Loan Amount" value={loanAmount} onChange={setLoanAmount} min={100000} max={50000000} step={100000} prefix="Rs " />
          <CalcSlider id="interest-rate" label="Interest Rate (per year)" value={interestRate} onChange={setInterestRate} min={1} max={25} step={0.1} suffix="%" />
          <CalcSlider id="tenure" label="Loan Tenure" value={tenure} onChange={setTenure} min={1} max={30} suffix=" years" />
        </Calculator>
      </div>

      {/* Amortization Schedule */}
      {result.schedule.length > 0 && (
        <div className="my-8 overflow-x-auto">
          <h2 className="heading-2 mb-4">Year-wise Amortization Schedule</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Year</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Principal Paid</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Interest Paid</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Balance</th>
              </tr>
            </thead>
            <tbody>
              {result.schedule.map((row) => (
                <tr key={row.year} className="border-b border-gray-100">
                  <td className="py-2 px-4 text-sm">{row.year}</td>
                  <td className="py-2 px-4 text-sm text-right">{formatINR(Math.round(row.principal))}</td>
                  <td className="py-2 px-4 text-sm text-right">{formatINR(Math.round(row.interest))}</td>
                  <td className="py-2 px-4 text-sm text-right">{formatINR(Math.round(row.balance))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How EMI Calculator Works</h2>
        <p className="text-body mb-4">This EMI calculator uses the standard reducing balance method to calculate your monthly installment. As you make payments, the principal component increases and interest component decreases, even though your total EMI stays the same.</p>
        <p className="text-body mb-4">The calculator works for any type of loan - home loan, car loan, personal loan, or education loan. Simply enter the loan amount, the annual interest rate offered by your bank, and the repayment period in years.</p>
        <h2 className="heading-2 mt-8 mb-4">Tips to Reduce Your EMI</h2>
        <p className="text-body mb-4">Choose a longer tenure to reduce monthly EMI (but you will pay more interest overall). Make a larger down payment to reduce the loan amount. Compare interest rates across multiple banks before choosing. Consider prepaying when you have extra funds to save on interest.</p>
      </article>

      <ShareButton url="/calculators/emi" title="EMI Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={EMI_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}