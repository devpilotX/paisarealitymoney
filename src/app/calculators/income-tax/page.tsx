'use client';

import { useState, useMemo } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Calculator, { CalcSlider, CalcSelect, CalcResult } from '@/components/Calculator';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';
import { formatINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';

function calcNewRegimeTax(income: number): number {
  const slabs = [
    { limit: 400000, rate: 0 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];
  // Standard deduction Rs 75,000 under new regime
  const taxableIncome = Math.max(0, income - 75000);
  let tax = 0;
  let prevLimit = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prevLimit) break;
    const taxableInSlab = Math.min(taxableIncome, slab.limit) - prevLimit;
    tax += taxableInSlab * slab.rate;
    prevLimit = slab.limit;
  }
  // Section 87A rebate: tax = 0 if taxable income <= 12 lakh under new regime (FY 2025-26)
  if (taxableIncome <= 1200000) tax = 0;
  // Health and education cess 4%
  tax = tax * 1.04;
  return Math.round(tax);
}

function calcOldRegimeTax(income: number, deductions80C: number, deductions80D: number, hra: number, otherDeductions: number, ageGroup: string): number {
  // Standard deduction Rs 50,000
  let taxableIncome = Math.max(0, income - 50000 - Math.min(deductions80C, 150000) - Math.min(deductions80D, 75000) - hra - otherDeductions);

  const slabs = ageGroup === 'senior' ? [
    { limit: 300000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ] : ageGroup === 'super_senior' ? [
    { limit: 500000, rate: 0 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ] : [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];

  let tax = 0;
  let prevLimit = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prevLimit) break;
    const taxableInSlab = Math.min(taxableIncome, slab.limit) - prevLimit;
    tax += taxableInSlab * slab.rate;
    prevLimit = slab.limit;
  }
  // Section 87A rebate: tax = 0 if taxable income <= 5 lakh under old regime
  if (taxableIncome <= 500000) tax = 0;
  tax = tax * 1.04;
  return Math.round(tax);
}

const TAX_FAQS = [
  { question: 'Which tax regime is better - old or new?', answer: 'It depends on your deductions. If you claim significant deductions under 80C (Rs 1.5 lakh), 80D (health insurance), HRA, and home loan interest, the old regime may save you more tax. If you have few deductions, the new regime with lower rates and higher rebate (up to Rs 12 lakh) is usually better. Use this calculator to compare both.' },
  { question: 'What is Section 87A rebate?', answer: 'Section 87A provides a tax rebate for lower-income taxpayers. Under the new regime (FY 2025-26), if your taxable income is up to Rs 12 lakh, your entire tax liability is waived. Under the old regime, the rebate applies for taxable income up to Rs 5 lakh.' },
  { question: 'What deductions are available under the old regime?', answer: 'Key deductions: Section 80C (up to Rs 1.5 lakh for PPF, ELSS, EPF, life insurance, etc.), Section 80D (Rs 25,000-75,000 for health insurance), HRA exemption (for salaried paying rent), home loan interest (up to Rs 2 lakh under Section 24), NPS (additional Rs 50,000 under 80CCD(1B)), and standard deduction of Rs 50,000.' },
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
    trackCalculatorUse('income-tax');
    return { newTax, oldTax, savings, betterRegime: newTax <= oldTax ? 'New Regime' : 'Old Regime' };
  }, [grossIncome, ageGroup, deductions80C, deductions80D, hra, otherDeductions]);

  const calcLinks = [
    { href: '/calculators/hra', label: 'HRA Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/nps', label: 'NPS Calculator' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Income Tax Calculator' }]} />
      <h1 className="heading-1 mb-6">Income Tax Calculator (FY 2025-26)</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator title="Calculate Your Income Tax" description="Compare tax under old and new regime. FY 2025-26 (AY 2026-27) slabs.">
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
            <p className="text-xs text-gray-500 mt-1">Standard deduction Rs 75,000. No 80C/80D/HRA.</p>
            {result.betterRegime === 'New Regime' && <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Better for you</span>}
          </div>
          <div className={`card ${result.betterRegime === 'Old Regime' ? 'border-primary border-2' : ''}`}>
            <h3 className="text-base font-semibold mb-1">Old Regime</h3>
            <p className="text-2xl font-bold text-primary">{formatINR(result.oldTax)}</p>
            <p className="text-xs text-gray-500 mt-1">With deductions: 80C, 80D, HRA, etc.</p>
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
        <p className="text-body mb-4">This calculator computes tax under both old and new regimes based on the latest FY 2025-26 slab rates. The new regime offers lower tax rates with fewer deductions (only standard deduction of Rs 75,000). The old regime has higher rates but allows deductions under 80C, 80D, HRA, home loan interest, and more.</p>
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