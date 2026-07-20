'use client';

import { useState, useMemo, useEffect } from 'react';
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
  { question: 'What is the minimum and maximum age to join NPS?', answer: 'Any Indian citizen between 18 and 70 years can open an NPS account, and you can keep contributing up to age 75. The earlier you start, the more years your corpus has to compound before retirement.' },
  { question: 'Can I withdraw from NPS before retirement?', answer: 'NPS is built for retirement, so early access is limited. After 3 years you can make partial withdrawals of up to 25% of your own contributions for specific needs like a house, education, or medical treatment. A full early exit requires using most of the corpus to buy an annuity.' },
  { question: 'What is an annuity in NPS?', answer: 'At retirement you must use at least 40% of your NPS corpus to buy an annuity from an insurer, which pays you a regular pension for life. The remaining up to 60% can be withdrawn tax-free. The annuity rate you enter here estimates that monthly pension.' },
  { question: 'How much pension will I get from NPS?', answer: 'Your NPS pension depends on your corpus at 60 and the annuity rate. For example, investing Rs 5,000 a month from age 30 at a 10% return builds a corpus of about Rs 1.14 crore by 60. Using 40% of it (about Rs 45.6 lakh) to buy an annuity at 6% gives a pension of roughly Rs 22,800 a month, while the other 60% is a tax-free lump sum. Adjust the inputs above for your own estimate.' },
  { question: 'What is the difference between NPS Tier 1 and Tier 2 accounts?', answer: 'Tier 1 is the main retirement account with a lock-in until age 60 and all the tax benefits, and it must be opened first. Tier 2 is a voluntary, flexible savings account with no lock-in and free withdrawals, but it gives no extra tax deduction for most subscribers. Most people invest mainly in Tier 1 for retirement.' },
  { question: 'Is NPS better than PPF for retirement?', answer: 'NPS is market-linked and can give higher long-term returns because of its equity exposure, but the returns are not guaranteed and you must buy an annuity at 60. PPF gives a fixed, fully tax-free return with a 15 year term and complete safety. Many people use both, and our PPF vs NPS guide compares them in detail. This is general information, not advice.' },
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

    return { corpus: Math.round(corpus), lumpSum: Math.round(lumpSum), annuityCorpus: Math.round(annuityCorpus), monthlyPension: Math.round(monthlyPension), totalInvested };
  }, [currentAge, monthlyContribution, expectedReturn, annuityRate]);

  useEffect(() => { trackCalculatorUse('nps'); }, []);

  const calcLinks = [
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/guides/ppf-vs-nps', label: 'PPF vs NPS Guide' },
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
          description="Estimate your NPS corpus at retirement based on your monthly contribution and expected returns."
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

        <h2 className="heading-2 mt-8 mb-4">Example: Rs 5,000 a month from age 30</h2>
        <p className="text-body mb-4">Take the calculator defaults: Rs 5,000 invested every month from age 30 to 60, growing at 10% a year. You would contribute Rs 18 lakh in total, and the corpus would grow to about Rs 1.14 crore through compounding. At 60 you could take about Rs 68.4 lakh as a tax-free lump sum and use the remaining Rs 45.6 lakh to buy an annuity, which at a 6% rate pays roughly Rs 22,800 a month for life. Starting even five years earlier makes a big difference, because the final years compound the hardest.</p>

        <h2 className="heading-2 mt-8 mb-4">NPS tax benefits under Section 80CCD</h2>
        <p className="text-body mb-4">NPS offers some of the best tax deductions available. Under the old tax regime, up to Rs 1.5 lakh of your contribution counts within the Section 80C limit under 80CCD(1), and NPS adds an exclusive extra Rs 50,000 deduction under Section 80CCD(1B) that no other investment offers, so a salaried investor can claim up to Rs 2 lakh. Employer contributions under 80CCD(2), up to 10% of salary for private employees and 14% for government employees, are deductible on top of that. The 80CCD(1B) benefit is not available under the new tax regime.</p>

        <h2 className="heading-2 mt-8 mb-4">NPS vs PPF: which suits your retirement</h2>
        <p className="text-body mb-4">NPS and PPF are both strong retirement tools but work differently. NPS is market-linked with equity exposure, so it can deliver higher long-term returns, but the outcome is not guaranteed and you must convert at least 40% of the corpus into an annuity at 60. PPF gives a fixed, fully tax-free return over a 15 year term with complete capital safety. If you want growth and the extra tax break, NPS fits; if you want certainty, PPF fits, and many people use both. Our PPF vs NPS guide compares them side by side.</p>
      </article>

      <ShareButton url="/calculators/nps" title="NPS Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={NPS_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
