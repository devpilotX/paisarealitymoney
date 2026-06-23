'use client';

import { useState, useMemo, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Calculator, { CalcSlider, CalcSelect, CalcResult } from '@/components/Calculator';
import FAQ from '@/components/FAQ';
import InternalLinks from '@/components/InternalLinks';
import AdBanner from '@/components/AdBanner';
import InArticleAd from '@/components/InArticleAd';
import ShareButton from '@/components/ShareButton';
import { formatINR } from '@/lib/constants';
import { trackCalculatorUse } from '@/lib/analytics';

const GRATUITY_FAQS = [
  { question: 'Who is eligible for gratuity?', answer: 'Any employee who has completed 5 or more years of continuous service with an employer is eligible for gratuity. This applies to all organizations with 10 or more employees. In case of death or disability, the 5-year condition is waived.' },
  { question: 'How is gratuity calculated?', answer: 'For employees covered under the Payment of Gratuity Act: Gratuity = (Last drawn salary x 15 x Years of service) / 26. Last drawn salary means basic salary plus dearness allowance. For employees not covered under the Act: Gratuity = (Last drawn salary x 15 x Years of service) / 30.' },
  { question: 'Is gratuity taxable?', answer: 'Gratuity is tax-exempt up to Rs 20 lakh (for private sector employees). For government employees, the entire gratuity amount is tax-exempt. Any amount exceeding the exemption limit is taxable as per your income tax slab.' },
  { question: 'What is the maximum gratuity amount?', answer: 'The maximum tax-free gratuity under the Payment of Gratuity Act is Rs 20 lakh. Employers can pay more, but the amount above Rs 20 lakh is taxable as per your slab. The calculator reflects this exemption cap.' },
  { question: 'Do I get gratuity if I resign before 5 years?', answer: 'Generally no, because gratuity needs 5 years of continuous service. The main exceptions are death or disability, where the 5 year rule is waived. Some courts have allowed it at 4 years and 240 days, so check your employer policy.' },
  { question: 'Is gratuity calculated on basic salary or total salary?', answer: 'Gratuity uses your last drawn basic salary plus dearness allowance, not your full CTC. Allowances like HRA and bonuses are not part of the gratuity formula.' },
];

export default function GratuityCalculatorPage(): React.ReactElement {
  const [monthlySalary, setMonthlySalary] = useState<number>(50000);
  const [yearsOfService, setYearsOfService] = useState<number>(10);
  const [employeeType, setEmployeeType] = useState<string>('covered');

  const result = useMemo(() => {
    const salary = monthlySalary;
    const years = yearsOfService;
    const divisor = employeeType === 'covered' ? 26 : 30;
    const gratuity = (salary * 15 * years) / divisor;
    const taxExempt = Math.min(gratuity, 2000000);
    const taxable = Math.max(0, gratuity - 2000000);

    return { gratuity: Math.round(gratuity), taxExempt: Math.round(taxExempt), taxable: Math.round(taxable) };
  }, [monthlySalary, yearsOfService, employeeType]);

  useEffect(() => { trackCalculatorUse('gratuity'); }, []);

  const calcLinks = [
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
    { href: '/calculators/nps', label: 'NPS Calculator' },
    { href: '/calculators/hra', label: 'HRA Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Gratuity Calculator' }]} />
      <h1 className="heading-1 mb-6">Gratuity Calculator</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate Your Gratuity Amount"
          description="Check how much gratuity you are entitled to based on your salary and years of service."
          result={
            <CalcResult items={[
              { label: 'Gratuity Amount', value: formatINR(result.gratuity), highlight: true },
              { label: 'Tax-Exempt (up to Rs 20 lakh)', value: formatINR(result.taxExempt) },
              { label: 'Taxable Amount', value: formatINR(result.taxable) },
            ]} />
          }
        >
          <CalcSlider id="salary" label="Monthly Salary (Basic + DA)" value={monthlySalary} onChange={setMonthlySalary} min={5000} max={500000} step={1000} prefix="Rs " />
          <CalcSlider id="years" label="Years of Service" value={yearsOfService} onChange={setYearsOfService} min={5} max={40} suffix=" years" />
          <CalcSelect id="type" label="Employee Type" value={employeeType} onChange={setEmployeeType} options={[
            { value: 'covered', label: 'Covered under Gratuity Act (divide by 26)' },
            { value: 'not_covered', label: 'Not covered under Act (divide by 30)' },
          ]} />
        </Calculator>
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How Gratuity Calculator Works</h2>
        <p className="text-body mb-4">Gratuity is a benefit paid by the employer to an employee for long service. The formula used is: Gratuity = (Last drawn salary x 15 x Years of service) / 26 for employees covered under the Payment of Gratuity Act, 1972. The number 15 represents 15 days of salary for each year of service, and 26 represents the working days in a month.</p>
        <p className="text-body mb-4">For employees not covered under the Act, the divisor changes to 30 (calendar days). The "last drawn salary" includes basic pay and dearness allowance (DA) only. Other components like HRA, conveyance, and special allowances are not included.</p>
        <p className="text-body mb-4">Years of service are rounded to the nearest whole number. If you have worked 4 years and 7 months, it counts as 5 years. But 4 years and 5 months counts as 4 years (since the months are less than 6). You need at least 5 years of service to be eligible for gratuity.</p>
      </article>

      <ShareButton url="/calculators/gratuity" title="Gratuity Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={GRATUITY_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}