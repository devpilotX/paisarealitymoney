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

const SIP_FAQS = [
  { question: 'What is SIP?', answer: 'SIP stands for Systematic Investment Plan. It allows you to invest a fixed amount in mutual funds at regular intervals (usually monthly). SIP helps you build wealth through the power of compounding and rupee cost averaging, which means you buy more units when prices are low and fewer when prices are high.' },
  { question: 'What returns can I expect from SIP?', answer: 'Returns depend on the type of mutual fund. Equity funds have historically given 12% to 15% average annual returns over 10+ year periods. Debt funds typically give 6% to 8%. Hybrid funds fall in between. Past performance does not guarantee future results. This calculator shows projected returns based on the rate you enter.' },
  { question: 'Is SIP better than Fixed Deposit?', answer: 'SIP in equity mutual funds can potentially give higher returns than FD over long periods (10+ years), but comes with market risk. FD gives guaranteed returns but lower growth. A balanced approach is to put emergency funds in FD and long-term savings in SIP. Consult a financial advisor for personalized advice.' },
];

export default function SIPCalculatorPage(): React.ReactElement {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(5000);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [timePeriod, setTimePeriod] = useState<number>(10);

  const result = useMemo(() => {
    const P = monthlyInvestment;
    const r = expectedReturn / 12 / 100;
    const n = timePeriod * 12;

    if (P <= 0 || r <= 0 || n <= 0) return { futureValue: 0, totalInvested: 0, totalReturns: 0 };

    const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const totalInvested = P * n;
    const totalReturns = futureValue - totalInvested;

    trackCalculatorUse('sip');
    return { futureValue, totalInvested, totalReturns };
  }, [monthlyInvestment, expectedReturn, timePeriod]);

  const calcLinks = [
    { href: '/calculators/fd', label: 'FD Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
    { href: '/calculators/nps', label: 'NPS Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'SIP Calculator' }]} />
      <h1 className="heading-1 mb-6">SIP Calculator</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate SIP Returns"
          description="See how your monthly SIP investment grows over time with compounding."
          result={
            <CalcResult items={[
              { label: 'Future Value', value: formatINR(Math.round(result.futureValue)), highlight: true },
              { label: 'Total Invested', value: formatINR(Math.round(result.totalInvested)) },
              { label: 'Wealth Gained', value: formatINR(Math.round(result.totalReturns)) },
            ]} />
          }
        >
          <CalcSlider id="monthly" label="Monthly Investment" value={monthlyInvestment} onChange={setMonthlyInvestment} min={500} max={200000} step={500} prefix="Rs " />
          <CalcSlider id="return" label="Expected Annual Return" value={expectedReturn} onChange={setExpectedReturn} min={1} max={30} step={0.5} suffix="%" />
          <CalcSlider id="period" label="Time Period" value={timePeriod} onChange={setTimePeriod} min={1} max={40} suffix=" years" />
        </Calculator>
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How SIP Calculator Works</h2>
        <p className="text-body mb-4">This calculator uses the compound interest formula for SIP investments. Each monthly installment is assumed to grow at the expected annual return rate, compounded monthly. The future value represents the total corpus you would accumulate at the end of the investment period.</p>
        <p className="text-body mb-4">For example, investing Rs 5,000 per month at 12% annual return for 10 years would give you approximately Rs 11.6 lakh, of which Rs 6 lakh is your investment and Rs 5.6 lakh is returns from compounding.</p>
        <h2 className="heading-2 mt-8 mb-4">Power of Starting Early</h2>
        <p className="text-body mb-4">Starting SIP early makes a massive difference due to compounding. Rs 5,000/month for 30 years at 12% grows to Rs 1.76 crore. But starting just 10 years later, the same SIP for 20 years gives only Rs 49.96 lakh. The extra 10 years of compounding adds over Rs 1.26 crore.</p>
      </article>

      <ShareButton url="/calculators/sip" title="SIP Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={SIP_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}