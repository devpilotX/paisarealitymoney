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

const HRA_FAQS = [
  { question: 'What is HRA exemption?', answer: 'HRA (House Rent Allowance) exemption reduces your taxable income if you are a salaried employee paying rent. The exemption is the minimum of three amounts: actual HRA received, 50% of salary (metro) or 40% (non-metro), and rent paid minus 10% of salary. This exemption is only available under the old tax regime.' },
  { question: 'Can I claim HRA if I have a home loan?', answer: 'Yes, you can claim both HRA exemption and home loan tax benefits if you live in a rented house in one city (for work) and own a house in another city. However, if you live in your own house and still claim HRA, the tax department may question this during assessment.' },
  { question: 'Do I need rent receipts for HRA?', answer: 'Yes, rent receipts are required if your annual rent exceeds Rs 1 lakh. For rent above Rs 1 lakh per year, you also need to provide the landlord PAN number. Keep monthly rent receipts and rent agreement as proof.' },
];

export default function HRACalculatorPage(): React.ReactElement {
  const [basicSalary, setBasicSalary] = useState<number>(40000);
  const [da, setDa] = useState<number>(0);
  const [hraReceived, setHraReceived] = useState<number>(20000);
  const [rentPaid, setRentPaid] = useState<number>(15000);
  const [city, setCity] = useState<string>('metro');

  const result = useMemo(() => {
    const annualBasicDA = (basicSalary + da) * 12;
    const annualHRA = hraReceived * 12;
    const annualRent = rentPaid * 12;
    const metroPercent = city === 'metro' ? 0.50 : 0.40;

    const exemption1 = annualHRA;
    const exemption2 = annualBasicDA * metroPercent;
    const exemption3 = Math.max(0, annualRent - annualBasicDA * 0.10);

    const hraExemption = Math.min(exemption1, exemption2, exemption3);
    const taxableHRA = annualHRA - hraExemption;

    trackCalculatorUse('hra');
    return {
      annualHRA, hraExemption: Math.round(hraExemption), taxableHRA: Math.round(taxableHRA),
      exemption1: Math.round(exemption1), exemption2: Math.round(exemption2), exemption3: Math.round(exemption3),
    };
  }, [basicSalary, da, hraReceived, rentPaid, city]);

  const calcLinks = [
    { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
    { href: '/calculators/gratuity', label: 'Gratuity Calculator' },
    { href: '/calculators/emi', label: 'EMI Calculator' },
    { href: '/calculators/ppf', label: 'PPF Calculator' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'HRA Calculator' }]} />
      <h1 className="heading-1 mb-6">HRA Calculator (House Rent Allowance)</h1>
      <AdBanner format="horizontal" />

      <div className="my-8">
        <Calculator
          title="Calculate HRA Exemption"
          description="Find out how much of your HRA is tax-exempt under the old tax regime."
          result={
            <>
              <CalcResult items={[
                { label: 'HRA Exemption (per year)', value: formatINR(result.hraExemption), highlight: true },
                { label: 'Taxable HRA (per year)', value: formatINR(result.taxableHRA) },
              ]} />
              <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p className="font-medium text-gray-700">Exemption is the minimum of:</p>
                <p className="text-gray-600">1. Actual HRA received: {formatINR(result.exemption1)}</p>
                <p className="text-gray-600">2. {city === 'metro' ? '50%' : '40%'} of Basic+DA: {formatINR(result.exemption2)}</p>
                <p className="text-gray-600">3. Rent paid minus 10% of Basic+DA: {formatINR(result.exemption3)}</p>
              </div>
            </>
          }
        >
          <CalcSlider id="basic" label="Monthly Basic Salary" value={basicSalary} onChange={setBasicSalary} min={5000} max={300000} step={1000} prefix="Rs " />
          <CalcSlider id="da" label="Monthly Dearness Allowance (DA)" value={da} onChange={setDa} min={0} max={100000} step={500} prefix="Rs " />
          <CalcSlider id="hra" label="Monthly HRA Received" value={hraReceived} onChange={setHraReceived} min={0} max={200000} step={500} prefix="Rs " />
          <CalcSlider id="rent" label="Monthly Rent Paid" value={rentPaid} onChange={setRentPaid} min={0} max={200000} step={500} prefix="Rs " />
          <CalcSelect id="city" label="City Type" value={city} onChange={setCity} options={[
            { value: 'metro', label: 'Metro (Delhi, Mumbai, Kolkata, Chennai)' },
            { value: 'non_metro', label: 'Non-Metro (Other cities)' },
          ]} />
        </Calculator>
      </div>

      <InArticleAd />

      <article className="max-w-3xl my-8">
        <h2 className="heading-2 mb-4">How HRA Exemption Works</h2>
        <p className="text-body mb-4">HRA exemption is calculated as the minimum of three values: (1) Actual HRA received from employer, (2) 50% of basic salary + DA for metro cities or 40% for non-metro cities, and (3) Actual rent paid minus 10% of basic salary + DA.</p>
        <p className="text-body mb-4">Metro cities for HRA purposes are Delhi, Mumbai, Kolkata, and Chennai only. All other cities, including Bangalore, Hyderabad, and Pune, are considered non-metro.</p>
        <p className="text-body mb-4">Note: HRA exemption is available only under the old tax regime. If you opt for the new tax regime, you cannot claim HRA exemption. Use our Income Tax Calculator to compare which regime is better for you.</p>
      </article>

      <ShareButton url="/calculators/hra" title="HRA Calculator - Paisa Reality" />
      <InternalLinks title="Other Calculators" links={calcLinks} columns={2} />
      <FAQ items={HRA_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}