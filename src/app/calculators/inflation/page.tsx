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

const INFLATION_FAQS = [
  { question: 'What is inflation?', answer: 'Inflation is the rate at which the general level of prices for goods and services rises over time. When inflation goes up, each rupee buys fewer goods than before. For example, if inflation is 6% per year, something that costs Rs 100 today will cost Rs 106 next year.' },
  { question: 'What is the current inflation rate in India?', answer: 'India\'s Consumer Price Index (CPI) based inflation has averaged around 5-6% over the past decade. The Reserve Bank of India (RBI) targets an inflation rate of 4% (with a tolerance band of 2% to 6%). Food inflation can be higher at 7-8% in some years.' },
  { question: 'How does inflation affect my savings?', answer: 'If your savings earn 6% interest but inflation is 6%, your real return is 0%. Your money is not actually growing in purchasing power. To beat inflation, your investments need to earn returns higher than the inflation rate. This is why equity investments (which historically return 12-15%) are recommended for long-term goals.' },
];

export default function InflationCalculatorPage(): React.ReactElement {
  const [currentCost, setCurrentCost] = useState<number>(100000);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [years, setYears] = useState<number>(10);

  const result = useMemo(() => {
    const futureCost = currentCost * Math.pow(1 + inflationRate / 100, years);
    const purchasingPower = currentCost / Math.pow(1 + inflationRate / 100, years);
    const totalIncrease = futureCost - currentCost;
    const percentIncrease = ((futureCost / currentCost) - 1) * 100;

    trackCalculatorUse('inflation');
    return {
      futureCost: Math.round(futureCost),
      purchasingPower: Math.round(purchasingPower),
      totalIncrease: Math.round(totalIncrease),
      percentIncrease: Math.round(percentIncrease),
    };
  }, [currentCost, inflationRate, years]);

  const calcLinks = [
    { href: '/calculators/sip', label: 'SIP Calculator' },
    { href: '/calculators/fd', label: 'FD Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Inflation Calculator' }]} />
      <h1 className="heading-1 mb-6">Inflation Calculator</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate Impact of Inflation"
          description="See how inflation reduces the value of your money over time."
          result={
            <CalcResult items={[
              { label: `Cost after ${years} years`, value: formatINR(result.futureCost), highlight: true },
              { label: 'Increase in cost', value: `${formatINR(result.totalIncrease)} (${result.percentIncrease}%)` },
              { label: `Value of ${formatINR(currentCost)} today in ${years} years`, value: formatINR(result.purchasingPower) },
            ]} />
          }
        >
          <CalcSlider id="cost" label="Current Cost / Amount" value={currentCost} onChange={setCurrentCost} min={1000} max={10000000} step={1000} prefix="Rs " />
          <CalcSlider id="rate" label="Expected Inflation Rate" value={inflationRate} onChange={setInflationRate} min={1} max={15} step={0.5} suffix="%" />
          <CalcSlider id="years" label="Time Period" value={years} onChange={setYears} min={1} max={30} suffix=" years" />
        </Calculator>
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How Inflation Calculator Works</h2>
        <p className="text-body mb-4">This calculator shows two things: (1) How much something that costs a certain amount today will cost in the future, and (2) How much the purchasing power of your current money will decrease over time.</p>
        <p className="text-body mb-4">For example, if a product costs Rs 1,00,000 today and inflation averages 6% per year, that same product will cost Rs 1,79,085 in 10 years. Conversely, Rs 1,00,000 today will only buy Rs 55,839 worth of goods in 10 years.</p>
        <h2 className="heading-2 mt-8 mb-4">How to Beat Inflation</h2>
        <p className="text-body mb-4">To maintain and grow your purchasing power, your investments must earn returns higher than inflation. Fixed deposits at 7% barely beat 6% inflation. SIP in equity mutual funds (historical returns 12-15%) can significantly beat inflation over 10+ year periods. Real estate, gold, and NPS are other options to consider.</p>
        <p className="text-body mb-4">The key is to start investing early. Even small monthly SIPs of Rs 2,000-5,000 can grow into substantial wealth over 15-20 years through the power of compounding, helping you stay ahead of inflation.</p>
      </article>

      <ShareButton url="/calculators/inflation" title="Inflation Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={INFLATION_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}