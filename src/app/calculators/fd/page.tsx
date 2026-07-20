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

const FD_FAQS = [
  { question: 'What is a Fixed Deposit?', answer: 'A Fixed Deposit (FD) is a savings instrument offered by banks where you deposit a lump sum amount for a fixed period at a guaranteed interest rate. The interest rate is higher than a regular savings account. FDs are considered one of the safest investment options in India as they are insured up to Rs 5 lakh by DICGC.' },
  { question: 'Which bank gives the highest FD interest rate?', answer: 'Small finance banks often offer the highest FD rates, followed by some private banks, with large public banks usually a little lower. Senior citizens get an extra 0.25 to 0.75%. Rates change frequently, so compare the latest rates on our bank rates page before you book.' },
  { question: 'Is FD interest taxable?', answer: 'Yes. Interest earned on FD is fully taxable as per your income tax slab. Banks deduct TDS (Tax Deducted at Source) at 10% if annual interest exceeds Rs 40,000 (Rs 50,000 for senior citizens). You can submit Form 15G/15H to avoid TDS if your total income is below the taxable limit.' },
  { question: 'Can I break my FD before maturity?', answer: 'Yes, most FDs allow premature withdrawal, but the bank usually pays a slightly lower interest rate and may charge a small penalty. If you might need the money soon, consider a shorter tenure or splitting the amount across a few smaller FDs so you break only what you need.' },
  { question: 'What is a tax-saving FD?', answer: 'A tax-saving FD has a 5 year lock-in, and the deposit qualifies for a deduction up to Rs 1.5 lakh under Section 80C. The interest is still taxable. You cannot withdraw it early or take a loan against it during the lock-in period.' },
  { question: 'What is the difference between simple and compound interest on FD?', answer: 'Simple interest is calculated only on the original deposit amount. Compound interest is calculated on the deposit plus accumulated interest. Most banks offer compound interest on FDs, which means your effective return is higher. Quarterly compounding is most common.' },
  { question: 'Do senior citizens get higher FD interest rates?', answer: 'Yes. Senior citizens aged 60 and above usually get an extra 0.25% to 0.50% over the regular FD rate, and some small finance banks offer more. Enter the higher rate in the calculator to see your maturity amount. Interest above Rs 50,000 a year attracts TDS unless you submit Form 15H.' },
  { question: 'How is FD maturity calculated, with an example?', answer: 'Maturity uses A = P(1 + r/n)^(nt). For a Rs 5,00,000 deposit at 7% for 5 years with quarterly compounding, the maturity is about Rs 7,07,000 and the interest earned is about Rs 2,07,000. Change any input above to see your own numbers.' },
  { question: 'Can I get monthly interest from a fixed deposit?', answer: 'Yes. A non-cumulative FD pays interest monthly or quarterly to your account, which suits people who want a regular income. A cumulative FD instead reinvests the interest and pays it all at maturity, giving a higher final amount. This calculator shows the cumulative maturity value.' },
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

    return { maturity, interest };
  }, [principal, interestRate, tenure, compounding]);

  useEffect(() => { trackCalculatorUse('fd'); }, []);

  const calcLinks = [
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
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
          description="Calculate how much your fixed deposit will be worth at maturity. Compare regular and senior citizen rates."
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
        <h2 className="heading-2 mb-4">How the FD Calculator Works</h2>
        <p className="text-body mb-4">This calculator uses the compound interest formula A = P(1 + r/n)^(nt), where P is the principal, r is the annual interest rate, n is the compounding frequency per year, and t is the number of years. Quarterly compounding is the most common frequency used by Indian banks. For example, Rs 5,00,000 at 7% for 5 years with quarterly compounding matures to about Rs 7,07,000, of which roughly Rs 2,07,000 is interest.</p>

        <h2 className="heading-2 mt-8 mb-4">FD interest rates for senior citizens</h2>
        <p className="text-body mb-4">Senior citizens aged 60 and above usually earn 0.25% to 0.50% more than the regular FD rate, and a few small finance banks pay even higher. If you are a senior citizen, add that extra rate in the calculator above to see your higher maturity value. Interest above Rs 50,000 a year attracts TDS unless you submit Form 15H.</p>

        <h2 className="heading-2 mt-8 mb-4">Tax-saving FD vs regular FD</h2>
        <p className="text-body mb-4">A regular FD can be booked for any tenure from 7 days to 10 years and can be broken early if you need the money. A tax-saving FD has a fixed 5 year lock-in and lets you claim up to Rs 1.5 lakh under Section 80C, but it cannot be withdrawn early. In both cases the interest is taxable as per your income slab.</p>

        <h2 className="heading-2 mt-8 mb-4">Monthly income vs cumulative FD</h2>
        <p className="text-body mb-4">A cumulative FD reinvests the interest and pays it all at maturity, which is what this calculator shows. A non-cumulative FD pays interest out monthly or quarterly, which suits retirees who want a regular income, but the final value is slightly lower because the interest is not compounded. Always compare the latest FD rates across banks before you book.</p>
      </article>

      <ShareButton url="/calculators/fd" title="FD Calculator - Paisa Reality" />
      <InternalLinks title="Related" links={calcLinks} columns={2} />
      <FAQ items={FD_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}