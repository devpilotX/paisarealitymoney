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

const FD_FAQS = [
  { question: 'What is a Fixed Deposit?', answer: 'A Fixed Deposit (FD) is a savings instrument offered by banks where you deposit a lump sum amount for a fixed period at a guaranteed interest rate. The interest rate is higher than a regular savings account. FDs are considered one of the safest investment options in India as they are insured up to Rs 5 lakh by DICGC.' },
  { question: 'Is FD interest taxable?', answer: 'Yes. Interest earned on FD is fully taxable as per your income tax slab. Banks deduct TDS (Tax Deducted at Source) at 10% if annual interest exceeds Rs 40,000 (Rs 50,000 for senior citizens). You can submit Form 15G/15H to avoid TDS if your total income is below the taxable limit.' },
  { question: 'What is the difference between simple and compound interest on FD?', answer: 'Simple interest is calculated only on the original deposit amount. Compound interest is calculated on the deposit plus accumulated interest. Most banks offer compound interest on FDs, which means your effective return is higher. Quarterly compounding is most common.' },
];

export default function FDCalculatorPage(): React.ReactElement {
  const [principal, setPrincipal] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(7.0);
  const [tenure, setTenure] = useState<number>(5);
  const [compounding, setCompounding] = useState<string>('quarterly');

  const result = useMemo(() => {
    const P = principal;
    const r = interestRate / 100;
    const t = tenure;

    if (P <= 0 || r <= 0 || t <= 0) return { maturity: 0, interest: 0 };

    const compFreq: Record<string, number> = { yearly: 1, half_yearly: 2, quarterly: 4, monthly: 12 };
    const n = compFreq[compounding] ?? 4;

    const maturity = P * Math.pow(1 + r / n, n * t);
    const interest = maturity - P;

    trackCalculatorUse('fd');
    return { maturity, interest };
  }, [principal, interestRate, tenure, compounding]);

  const calcLinks = [
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
    { href: '/bank-rates/fd-rates', label: 'Compare FD Rates' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'FD Calculator' }]} />
      <h1 className="heading-1 mb-6">FD Calculator (Fixed Deposit)</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate FD Maturity Amount"
          description="Enter deposit amount, interest rate, tenure, and compounding frequency."
          result={
            <CalcResult items={[
              { label: 'Maturity Amount', value: formatINR(Math.round(result.maturity)), highlight: true },
              { label: 'Total Interest Earned', value: formatINR(Math.round(result.interest)) },
              { label: 'Deposit Amount', value: formatINR(principal) },
            ]} />
          }
        >
          <CalcSlider id="principal" label="Deposit Amount" value={principal} onChange={setPrincipal} min={10000} max={10000000} step={10000} prefix="Rs " />
          <CalcSlider id="rate" label="Interest Rate (per year)" value={interestRate} onChange={setInterestRate} min={1} max={15} step={0.1} suffix="%" />
          <CalcSlider id="tenure" label="Tenure" value={tenure} onChange={setTenure} min={1} max={10} suffix=" years" />
          <CalcSelect id="compounding" label="Compounding Frequency" value={compounding} onChange={setCompounding} options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'half_yearly', label: 'Half-Yearly' },
            { value: 'yearly', label: 'Yearly' },
          ]} />
        </Calculator>
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How FD Calculator Works</h2>
        <p className="text-body mb-4">This calculator uses the compound interest formula: A = P(1 + r/n)^(nt), where P is the principal, r is the annual interest rate, n is the compounding frequency per year, and t is the number of years. Quarterly compounding is the most common frequency used by Indian banks.</p>
        <p className="text-body mb-4">Senior citizens usually get 0.25% to 0.50% higher interest rates on FDs. Some banks offer special FD schemes with higher rates for specific tenures. Always compare FD rates across banks before investing.</p>
      </article>

      <ShareButton url="/calculators/fd" title="FD Calculator - Paisa Reality" />
      <InternalLinks title="Related" links={calcLinks} columns={2} />
      <FAQ items={FD_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}