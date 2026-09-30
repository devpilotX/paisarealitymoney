'use client';

import { useState, useMemo, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Calculator, { CalcSlider, CalcSelect } from '@/components/Calculator';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';
import { formatINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';

import { calcNewRegimeTax, calcOldRegimeTax } from '@/lib/income-tax';

const TAX_FAQS = [
  { question: 'Which tax regime is better - old or new?', answer: 'It depends on your deductions. If you claim significant deductions under 80C (Rs 1.5 lakh), 80D (health insurance), HRA, and home loan interest, the old regime may save you more tax. If you have few deductions, the new regime with lower rates and higher rebate (no tax up to Rs 12 lakh of taxable income) is usually better. Use this calculator to compare both.' },
  { question: 'What is Section 87A rebate?', answer: 'Section 87A provides a tax rebate for lower-income taxpayers. Under the new regime (FY 2026-27, unchanged from FY 2025-26), if your taxable income is up to Rs 12 lakh, your entire tax liability is waived. Just above Rs 12 lakh, marginal relief caps your tax at the amount by which your income exceeds Rs 12 lakh. Under the old regime, the rebate applies for taxable income up to Rs 5 lakh.' },
  { question: 'What deductions are available under the old regime?', answer: 'Key deductions: Section 80C (up to Rs 1.5 lakh for PPF, ELSS, EPF, life insurance, etc.), Section 80D (Rs 25,000-75,000 for health insurance), HRA exemption (for salaried paying rent), home loan interest (up to Rs 2 lakh under Section 24), NPS (additional Rs 50,000 under 80CCD(1B)), and standard deduction of Rs 50,000.' },
  { question: 'What is the standard deduction for FY 2026-27?', answer: 'Salaried taxpayers get a standard deduction from salary income with no proof needed: Rs 75,000 under the new regime and Rs 50,000 under the old regime for FY 2026-27, the same as the year before. It is applied automatically before tax is calculated.' },
  { question: 'What is the difference between gross income and taxable income?', answer: 'Gross income is your total income before any deductions. Taxable income is what remains after subtracting eligible deductions and exemptions. Tax is calculated on your taxable income, not your gross income.' },
  { question: 'Do I need to file an income tax return if my income is below the limit?', answer: 'Filing becomes mandatory once your income crosses the basic exemption limit. Even below it, filing can help you claim a refund of any TDS deducted, carry forward losses, and serve as income proof for loans and visas.' },
];

export default function IncomeTaxCalculatorPage(): React.ReactElement {
  const [grossIncome, setGrossIncome] = useState<number>(1000000);
  const [ageGroup, setAgeGroup] = useState<string>('general');
  const [deductions80C, setDeductions80C] = useState<number>(150000);
  const [deductions80D, setDeductions80D] = useState<number>(25000);
  const [hra, setHra] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  const result = useMemo(() => {
    const newTax = calcNewRegimeTax(grossIncome);
    const oldTax = calcOldRegimeTax(grossIncome, deductions80C, deductions80D, hra, otherDeductions, ageGroup);
    const savings = oldTax - newTax;
    return { newTax, oldTax, savings, betterRegime: newTax <= oldTax ? 'New Regime' : 'Old Regime' };
  }, [grossIncome, ageGroup, deductions80C, deductions80D, hra, otherDeductions]);

  useEffect(() => { trackCalculatorUse('income-tax'); }, []);

  const calcLinks = [
    { href: '/calculators/salary-optimizer', label: 'Salary Structure Optimizer' },
    { href: '/calculators/hra', label: 'HRA Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/nps', label: 'NPS Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Income Tax Calculator' }]} />
      <h1 className="heading-1 mb-6">Income Tax Calculator (FY 2026-27)</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator title="Calculate Your Income Tax" description="Calculate your income tax under both old and new regimes. See which one saves you more.">
          <CalcSlider id="income" label="Gross Annual Income" value={grossIncome} onChange={setGrossIncome} min={0} max={50000000} step={50000} prefix="Rs " />
          <CalcSelect id="age" label="Age Group" value={ageGroup} onChange={setAgeGroup} options={[
            { value: 'general', label: 'Below 60 years' },
            { value: 'senior', label: '60-80 years (Senior Citizen)' },
            { value: 'super_senior', label: 'Above 80 years (Super Senior)' },
          ]} />
          <CalcSlider id="80c" label="Section 80C Deductions (Old Regime)" value={deductions80C} onChange={setDeductions80C} min={0} max={150000} step={5000} prefix="Rs " />
          <CalcSlider id="80d" label="Section 80D (Health Insurance)" value={deductions80D} onChange={setDeductions80D} min={0} max={75000} step={5000} prefix="Rs " />
          <CalcSlider id="hra" label="HRA Exemption (Old Regime)" value={hra} onChange={setHra} min={0} max={500000} step={5000} prefix="Rs " />
          <CalcSlider id="other" label="Other Deductions (80CCD, 80E, 24b, etc.)" value={otherDeductions} onChange={setOtherDeductions} min={0} max={500000} step={5000} prefix="Rs " />
        </Calculator>
      </div>

      {/* Tax Comparison */}
      <div className="max-w-2xl my-8">
        <h2 className="heading-2 mb-4">Tax Comparison</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`card ${result.betterRegime === 'New Regime' ? 'border-primary border-2' : ''}`}>
            <h3 className="text-base font-semibold mb-1">New Regime</h3>
            <p className="text-2xl font-bold text-primary">{formatINR(result.newTax)}</p>
            <p className="text-xs text-muted-2 mt-1">Standard deduction Rs 75,000. No 80C/80D/HRA.</p>
            {result.betterRegime === 'New Regime' && <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Better for you</span>}
          </div>
          <div className={`card ${result.betterRegime === 'Old Regime' ? 'border-primary border-2' : ''}`}>
            <h3 className="text-base font-semibold mb-1">Old Regime</h3>
            <p className="text-2xl font-bold text-primary">{formatINR(result.oldTax)}</p>
            <p className="text-xs text-muted-2 mt-1">With deductions: 80C, 80D, HRA, etc.</p>
            {result.betterRegime === 'Old Regime' && <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Better for you</span>}
          </div>
        </div>
        {result.savings !== 0 && (
          <p className="text-body mt-4 text-center">
            You save <strong>{formatINR(Math.abs(result.savings))}</strong> by choosing the <strong>{result.betterRegime}</strong>.
          </p>
        )}
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How Income Tax Calculator Works</h2>
        <p className="text-body mb-4">This calculator computes tax under both old and new regimes based on the FY 2026-27 slab rates (the same as FY 2025-26, since Budget 2026 left them unchanged). The new regime offers lower tax rates with fewer deductions (only standard deduction of Rs 75,000). The old regime has higher rates but allows deductions under 80C, 80D, HRA, home loan interest, and more.</p>
        <p className="text-body mb-4">The new regime provides a rebate under Section 87A for taxable income up to Rs 12 lakh, making it effectively tax-free. The old regime rebate applies up to Rs 5 lakh taxable income. Both regimes include 4% health and education cess on the tax amount.</p>
        <p className="text-body mb-4">Note: This calculator provides an estimate. Actual tax may vary based on surcharge (for income above Rs 50 lakh), specific exemptions, and other factors. Consult a tax professional for accurate filing.</p>
      </article>

      <ShareButton url="/calculators/income-tax" title="Income Tax Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={TAX_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
