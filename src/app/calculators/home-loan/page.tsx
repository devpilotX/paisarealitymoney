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

const HL_FAQS = [
  { question: 'What is a good home loan interest rate in India?', answer: 'As of 2026, home loan interest rates in India range from 8.25% to 9.5% depending on the bank, your credit score, and loan amount. Rates below 8.5% are considered good. Public sector banks like SBI often offer slightly lower rates than private banks. Always compare rates across at least 3-4 banks.' },
  { question: 'How much home loan can I get based on my salary?', answer: 'Banks typically offer home loans where the EMI does not exceed 40-50% of your monthly income. So if your monthly salary is Rs 50,000, your maximum EMI would be Rs 20,000-25,000. The actual loan amount depends on the interest rate and tenure. A longer tenure means higher loan eligibility.' },
  { question: 'What is the maximum tenure for a home loan?', answer: 'Most banks offer home loans with a maximum tenure of 30 years. However, the loan must be repaid before you turn 60-65 years (retirement age). So if you are 35, your maximum tenure would be 25-30 years. Longer tenure reduces EMI but increases total interest paid.' },
];

export default function HomeLoanCalculatorPage(): React.ReactElement {
  const [propertyValue, setPropertyValue] = useState<number>(5000000);
  const [downPayment, setDownPayment] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(20);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(80000);

  const result = useMemo(() => {
    const dpAmount = propertyValue * downPayment / 100;
    const loanAmount = propertyValue - dpAmount;
    const r = interestRate / 12 / 100;
    const n = tenure * 12;

    if (loanAmount <= 0 || r <= 0 || n <= 0) return { emi: 0, loanAmount: 0, dpAmount: 0, totalInterest: 0, totalCost: 0, affordable: false, emiToIncomeRatio: 0 };

    const emi = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - loanAmount;
    const totalCost = totalPayment + dpAmount;
    const emiToIncomeRatio = (emi / monthlyIncome) * 100;
    const affordable = emiToIncomeRatio <= 50;

    trackCalculatorUse('home-loan');
    return { emi, loanAmount, dpAmount, totalInterest, totalCost, affordable, emiToIncomeRatio };
  }, [propertyValue, downPayment, interestRate, tenure, monthlyIncome]);

  const calcLinks = [
    { href: '/calculators/emi', label: 'EMI Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
    { href: '/bank-rates/home-loan-rates', label: 'Compare Home Loan Rates' },
    { href: '/schemes/pm-awas-yojana', label: 'PM Awas Yojana' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Home Loan Calculator' }]} />
      <h1 className="heading-1 mb-6">Home Loan Calculator</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate Home Loan EMI & Affordability"
          description="Enter property value, down payment, and your income to check affordability."
          result={
            <>
              <CalcResult items={[
                { label: 'Monthly EMI', value: formatINR(Math.round(result.emi)), highlight: true },
                { label: 'Loan Amount', value: formatINR(Math.round(result.loanAmount)) },
                { label: 'Down Payment', value: formatINR(Math.round(result.dpAmount)) },
                { label: 'Total Interest', value: formatINR(Math.round(result.totalInterest)) },
                { label: 'Total Cost (incl. down payment)', value: formatINR(Math.round(result.totalCost)) },
              ]} />
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${result.affordable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                EMI is {Math.round(result.emiToIncomeRatio)}% of your income.
                {result.affordable ? ' This is within the recommended 50% limit.' : ' This exceeds the recommended 50% limit. Consider a longer tenure or smaller loan.'}
              </div>
            </>
          }
        >
          <CalcSlider id="property" label="Property Value" value={propertyValue} onChange={setPropertyValue} min={500000} max={100000000} step={500000} prefix="Rs " />
          <CalcSlider id="dp" label="Down Payment" value={downPayment} onChange={setDownPayment} min={5} max={80} suffix="%" displayValue={`${downPayment}% (${formatINR(Math.round(propertyValue * downPayment / 100))})`} />
          <CalcSlider id="rate" label="Interest Rate" value={interestRate} onChange={setInterestRate} min={5} max={15} step={0.1} suffix="%" />
          <CalcSlider id="tenure" label="Tenure" value={tenure} onChange={setTenure} min={1} max={30} suffix=" years" />
          <CalcSlider id="income" label="Your Monthly Income" value={monthlyIncome} onChange={setMonthlyIncome} min={10000} max={1000000} step={5000} prefix="Rs " />
        </Calculator>
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">Home Loan Planning Tips</h2>
        <p className="text-body mb-4">Save at least 20% of the property value as down payment to avoid paying PMI (Private Mortgage Insurance) and to get better interest rates. Your EMI should not exceed 40-50% of your monthly income to maintain a healthy financial life.</p>
        <p className="text-body mb-4">Home loan interest up to Rs 2 lakh per year is deductible under Section 24(b) of the Income Tax Act. Principal repayment up to Rs 1.5 lakh qualifies under Section 80C. First-time home buyers can get additional deduction under Section 80EEA. Check if you qualify for PM Awas Yojana subsidy.</p>
      </article>

      <ShareButton url="/calculators/home-loan" title="Home Loan Calculator - Paisa Reality" />
      <InternalLinks title="Related" links={calcLinks} columns={2} />
      <FAQ items={HL_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}