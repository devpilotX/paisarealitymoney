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

const NPS_FAQS = [
  { question: 'What is NPS?', answer: 'National Pension System (NPS) is a government-sponsored retirement savings scheme. You invest regularly during your working years, and at retirement (age 60), you can withdraw up to 60% as a lump sum (tax-free) and must use at least 40% to buy an annuity (monthly pension). NPS offers both equity and debt investment options.' },
  { question: 'What are the tax benefits of NPS?', answer: 'NPS offers up to Rs 2 lakh in total tax deductions: Rs 1.5 lakh under Section 80CCD(1) within the 80C limit, plus an additional Rs 50,000 under Section 80CCD(1B) exclusively for NPS. Employer contributions up to 14% of salary (for government employees) or 10% (for others) are deductible under 80CCD(2) without any limit.' },
  { question: 'What returns can I expect from NPS?', answer: 'NPS returns depend on your asset allocation. Equity (Tier E) has given 12-14% returns historically. Corporate bonds (Tier C) give 8-10%. Government bonds (Tier G) give 7-9%. A balanced 50:30:20 (E:C:G) allocation has historically returned around 10-12% annually over 10+ year periods.' },
];

export default function NPSCalculatorPage(): React.ReactElement {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(5000);
  const [expectedReturn, setExpectedReturn] = useState<number>(10);
  const [annuityRate, setAnnuityRate] = useState<number>(6);

  const result = useMemo(() => {
    const retirementAge = 60;
    const yearsToRetire = retirementAge - currentAge;
    if (yearsToRetire <= 0 || monthlyContribution <= 0) return { corpus: 0, lumpSum: 0, annuityCorpus: 0, monthlyPension: 0, totalInvested: 0 };

    const r = expectedReturn / 12 / 100;
    const n = yearsToRetire * 12;
    const corpus = monthlyContribution * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const totalInvested = monthlyContribution * n;
    const lumpSum = corpus * 0.6;
    const annuityCorpus = corpus * 0.4;
    const monthlyPension = (annuityCorpus * annuityRate / 100) / 12;

    trackCalculatorUse('nps');
    return { corpus: Math.round(corpus), lumpSum: Math.round(lumpSum), annuityCorpus: Math.round(annuityCorpus), monthlyPension: Math.round(monthlyPension), totalInvested };
  }, [currentAge, monthlyContribution, expectedReturn, annuityRate]);

  const calcLinks = [
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/gratuity', label: 'Gratuity Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'NPS Calculator' }]} />
      <h1 className="heading-1 mb-6">NPS Calculator (National Pension System)</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate NPS Corpus & Pension"
          description="See your projected retirement corpus and monthly pension from NPS."
          result={
            <CalcResult items={[
              { label: 'Total Corpus at 60', value: formatINR(result.corpus), highlight: true },
              { label: 'Lump Sum Withdrawal (60%)', value: formatINR(result.lumpSum) },
              { label: 'Annuity Purchase (40%)', value: formatINR(result.annuityCorpus) },
              { label: 'Monthly Pension (est.)', value: formatINR(result.monthlyPension), highlight: true },
              { label: 'Total Invested', value: formatINR(result.totalInvested) },
            ]} />
          }
        >
          <CalcSlider id="age" label="Your Current Age" value={currentAge} onChange={setCurrentAge} min={18} max={59} suffix=" years" />
          <CalcSlider id="monthly" label="Monthly Contribution" value={monthlyContribution} onChange={setMonthlyContribution} min={500} max={100000} step={500} prefix="Rs " />
          <CalcSlider id="return" label="Expected Return" value={expectedReturn} onChange={setExpectedReturn} min={6} max={14} step={0.5} suffix="%" />
          <CalcSlider id="annuity" label="Annuity Rate" value={annuityRate} onChange={setAnnuityRate} min={4} max={8} step={0.5} suffix="%" />
        </Calculator>
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How NPS Calculator Works</h2>
        <p className="text-body mb-4">This calculator projects your NPS corpus at retirement age 60. It assumes your monthly contribution grows at the expected return rate through compounding. At age 60, you can withdraw 60% as a tax-free lump sum and must invest at least 40% in an annuity that provides monthly pension.</p>
        <p className="text-body mb-4">The monthly pension amount depends on the annuity rate offered by insurance companies at the time of retirement. Current annuity rates range from 5% to 7% depending on the type of annuity chosen. The pension is taxable as per your income tax slab.</p>
      </article>

      <ShareButton url="/calculators/nps" title="NPS Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={NPS_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
