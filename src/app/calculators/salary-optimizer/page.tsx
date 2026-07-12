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
import { optimizeSalaryStructure, type OptimizerInputs, type OptimizationResult } from '@/lib/salary-optimizer';

const OPTIMIZER_FAQS = [
  { question: 'What is salary structure optimization?', answer: 'Salary structure optimization means finding the best allocation of your CTC across components (Basic, HRA, Special Allowance, NPS, Food Coupons, LTA, etc.) to legally minimize your income tax. The optimal split depends on your rent, city, investments, and tax regime. it\'s different for every person.' },
  { question: 'How much can I save by restructuring my salary?', answer: 'Depending on your CTC level and personal situation, optimizing your salary structure can save ₹30,000 to ₹1,00,000+ per year in taxes. The savings are highest for CTCs between ₹10-25 LPA where deductions under the old regime can significantly reduce tax liability.' },
  { question: 'Is this legal?', answer: 'Absolutely. Salary structuring is a legitimate tax planning method recognized by the Income Tax Act. Every component referenced here (HRA under Section 10(13A), NPS under 80CCD(2), LTA under Section 10(5), food coupons under Section 17(2)) has explicit provisions in the Act. You\'re simply choosing how your compensation is split.' },
  { question: 'How do I implement this?', answer: 'Most companies with flexi-benefit plans send a "declaration form" once a year (usually in March/April) where you choose your salary components. Take the optimal structure from this tool and enter those values in your company\'s form. If unsure, share the results with your HR team.' },
  { question: 'Does this account for EPF?', answer: 'Yes. EPF employer contribution (12% of Basic, capped at ₹15,000/month wage) is factored in. Lowering Basic reduces your EPF contribution and employer match. the optimizer balances this trade-off against tax savings.' },
];

function StructureTable({ label, structure, highlight }: { label: string; structure: { basic: number; hra: number; specialAllowance: number; lta: number; foodCoupons: number; npsEmployer: number; vehicleAllowance: number; phoneAllowance: number; epfEmployer: number }; highlight?: boolean }): React.ReactElement {
  const rows = [
    { name: 'Basic Salary', value: structure.basic },
    { name: 'HRA', value: structure.hra },
    { name: 'Special Allowance', value: structure.specialAllowance },
    { name: 'LTA', value: structure.lta },
    { name: 'Food Coupons', value: structure.foodCoupons },
    { name: 'NPS (Employer)', value: structure.npsEmployer },
    { name: 'Vehicle Allowance', value: structure.vehicleAllowance },
    { name: 'Phone Allowance', value: structure.phoneAllowance },
    { name: 'EPF (Employer)', value: structure.epfEmployer },
  ].filter(r => r.value > 0);

  return (
    <div className={`card ${highlight ? 'border-primary border-2' : ''}`}>
      <h3 className="text-base font-semibold mb-3">{label}</h3>
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.name} className="flex justify-between text-sm">
            <span className="text-muted">{r.name}</span>
            <span className="font-medium">{formatINR(r.value)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
          <span>Total CTC</span>
          <span>{formatINR(rows.reduce((s, r) => s + r.value, 0))}</span>
        </div>
      </div>
    </div>
  );
}

export default function SalaryOptimizerPage(): React.ReactElement {
  const [ctc, setCtc] = useState<number>(1200000);
  const [isMetro, setIsMetro] = useState<string>('metro');
  const [monthlyRent, setMonthlyRent] = useState<number>(15000);
  const [ageGroup, setAgeGroup] = useState<string>('general');
  const [yearsAtEmployer, setYearsAtEmployer] = useState<number>(3);
  const [monthlyPhoneBill, setMonthlyPhoneBill] = useState<number>(1000);
  const [annualTravelBudget, setAnnualTravelBudget] = useState<number>(30000);
  const [existing80C, setExisting80C] = useState<number>(50000);
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(0);
  const [healthInsurance80D, setHealthInsurance80D] = useState<number>(25000);
  const [minBasicPct, setMinBasicPct] = useState<number>(30);
  const [maxBasicPct, setMaxBasicPct] = useState<number>(50);
  const [hasNPS, setHasNPS] = useState<string>('no');
  const [hasFoodCoupons, setHasFoodCoupons] = useState<string>('yes');

  useEffect(() => { trackCalculatorUse('salary-optimizer'); }, []);

  const result: OptimizationResult = useMemo(() => {
    const inputs: OptimizerInputs = {
      ctc, isMetro: isMetro === 'metro', monthlyRent, ageGroup: ageGroup as 'general' | 'senior',
      yearsAtEmployer, monthlyPhoneBill, annualTravelBudget, existing80C,
      homeLoanInterest, healthInsurance80D, minBasicPct, maxBasicPct,
      hasNPS: hasNPS === 'yes', hasFoodCoupons: hasFoodCoupons === 'yes',
    };
    return optimizeSalaryStructure(inputs);
  }, [ctc, isMetro, monthlyRent, ageGroup, yearsAtEmployer, monthlyPhoneBill, annualTravelBudget, existing80C, homeLoanInterest, healthInsurance80D, minBasicPct, maxBasicPct, hasNPS, hasFoodCoupons]);

  const winner = result.bestRegime === 'old' ? result.oldRegimeResult : result.newRegimeResult;

  const calcLinks = [
    { href: '/calculators/lifecycle-tax-optimizer', label: 'Old vs New Tax Regime Optimizer' },
    { href: '/calculators/tax-harvesting', label: 'Tax Loss Harvesting Optimizer' },
    { href: '/calculators/debt-optimizer', label: 'Debt Payoff Optimizer' },
    { href: '/score', label: 'Money Health Score' },
  ];

  return (
    <div className="container-main py-6">
      <Breadcrumb items={[{ label: 'Calculators', href: '/calculators' }, { label: 'Salary Structure Optimizer' }]} />
      <h1 className="heading-1 mb-3">Salary Structure Optimizer</h1>
      <p className="text-body mb-6 max-w-2xl">
        Restructure your salary components to legally reduce tax. See exactly how much you can save by changing your CTC split.
      </p>
      <AdBanner format="horizontal" />

      {/* Inputs */}
      <div className="my-8">
        <Calculator title="Your Details" description="Enter your CTC and personal details. All computation happens in your browser. nothing is sent to any server.">
          <CalcSlider id="ctc" label="Annual CTC" value={ctc} onChange={setCtc} min={300000} max={50000000} step={50000} prefix="₹ " />
          <CalcSelect id="city" label="City Type" value={isMetro} onChange={setIsMetro} options={[{ value: 'metro', label: 'Metro (Delhi, Mumbai, Kolkata, Chennai)' }, { value: 'non-metro', label: 'Non-Metro' }]} />
          <CalcSlider id="rent" label="Monthly Rent Paid" value={monthlyRent} onChange={setMonthlyRent} min={0} max={200000} step={1000} prefix="₹ " />
          <CalcSelect id="age" label="Age Group" value={ageGroup} onChange={setAgeGroup} options={[{ value: 'general', label: 'Below 60 years' }, { value: 'senior', label: '60+ years (Senior Citizen)' }]} />
          <CalcSlider id="years" label="Years at Current Employer" value={yearsAtEmployer} onChange={setYearsAtEmployer} min={0} max={35} step={1} suffix=" yrs" />
          <CalcSlider id="phone" label="Monthly Phone/Internet Bill" value={monthlyPhoneBill} onChange={setMonthlyPhoneBill} min={0} max={5000} step={100} prefix="₹ " />
          <CalcSlider id="lta" label="Annual Travel Budget (for LTA)" value={annualTravelBudget} onChange={setAnnualTravelBudget} min={0} max={200000} step={5000} prefix="₹ " />
          <CalcSlider id="existing80c" label="Existing 80C Investments (PPF, ELSS, LI, etc.)" value={existing80C} onChange={setExisting80C} min={0} max={150000} step={5000} prefix="₹ " />
          <CalcSlider id="homeloan" label="Home Loan Interest (Annual)" value={homeLoanInterest} onChange={setHomeLoanInterest} min={0} max={500000} step={10000} prefix="₹ " />
          <CalcSlider id="health" label="Health Insurance Premium (80D)" value={healthInsurance80D} onChange={setHealthInsurance80D} min={0} max={75000} step={5000} prefix="₹ " />
          <CalcSlider id="minbasic" label="Company Min Basic %" value={minBasicPct} onChange={setMinBasicPct} min={20} max={50} step={5} suffix="%" />
          <CalcSlider id="maxbasic" label="Company Max Basic %" value={maxBasicPct} onChange={setMaxBasicPct} min={30} max={60} step={5} suffix="%" />
          <CalcSelect id="nps" label="Company Offers NPS?" value={hasNPS} onChange={setHasNPS} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          <CalcSelect id="food" label="Company Offers Food Coupons?" value={hasFoodCoupons} onChange={setHasFoodCoupons} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        </Calculator>
      </div>

      {/* Results Summary */}
      <div className="max-w-2xl my-8">
        <h2 className="heading-2 mb-4">Optimization Result</h2>

        {result.savingsVsNaive > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-center">
            <p className="text-sm text-green-700 mb-1">You can save up to</p>
            <p className="text-3xl font-bold text-green-800">{formatINR(result.savingsVsNaive)}<span className="text-base font-normal">/year</span></p>
            <p className="text-sm text-green-600 mt-1">by switching to the optimal structure below ({result.bestRegime === 'old' ? 'Old Regime' : 'New Regime'})</p>
          </div>
        )}

        {/* Regime comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className={`card ${result.bestRegime === 'old' ? 'border-primary border-2' : ''}`}>
            <h3 className="text-base font-semibold mb-1">Old Regime</h3>
            <p className="text-2xl font-bold text-primary">{formatINR(result.oldRegimeResult.tax)}</p>
            <p className="text-xs text-muted-2 mt-1">Annual tax with optimal structure</p>
            {result.bestRegime === 'old' && <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Recommended</span>}
          </div>
          <div className={`card ${result.bestRegime === 'new' ? 'border-primary border-2' : ''}`}>
            <h3 className="text-base font-semibold mb-1">New Regime</h3>
            <p className="text-2xl font-bold text-primary">{formatINR(result.newRegimeResult.tax)}</p>
            <p className="text-xs text-muted-2 mt-1">Annual tax with optimal structure</p>
            {result.bestRegime === 'new' && <span className="inline-block mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Recommended</span>}
          </div>
        </div>
      </div>

      <InArticleAd />

      {/* Optimal Structure Table */}
      <div className="max-w-2xl my-8">
        <h2 className="heading-2 mb-4">Recommended Salary Breakup</h2>
        <StructureTable label={`Optimal Structure (${result.bestRegime === 'old' ? 'Old' : 'New'} Regime)`} structure={winner.structure} highlight />

        {/* Deductions breakdown for old regime */}
        {result.bestRegime === 'old' && (
          <div className="card mt-4">
            <h3 className="text-base font-semibold mb-3">Deductions Applied</h3>
            <div className="space-y-2">
              {result.oldRegimeResult.deductions.standardDeduction > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Standard Deduction</span><span className="font-medium">{formatINR(result.oldRegimeResult.deductions.standardDeduction)}</span></div>}
              {result.oldRegimeResult.deductions.hraExemption > 0 && <div className="flex justify-between text-sm"><span className="text-muted">HRA Exemption (Sec 10(13A))</span><span className="font-medium">{formatINR(result.oldRegimeResult.deductions.hraExemption)}</span></div>}
              {result.oldRegimeResult.deductions.section80C > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Section 80C</span><span className="font-medium">{formatINR(result.oldRegimeResult.deductions.section80C)}</span></div>}
              {result.oldRegimeResult.deductions.section80CCD2 > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Section 80CCD(2). NPS</span><span className="font-medium">{formatINR(result.oldRegimeResult.deductions.section80CCD2)}</span></div>}
              {result.oldRegimeResult.deductions.section80D > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Section 80D. Health Insurance</span><span className="font-medium">{formatINR(result.oldRegimeResult.deductions.section80D)}</span></div>}
              {result.oldRegimeResult.deductions.section24b > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Section 24(b). Home Loan Interest</span><span className="font-medium">{formatINR(result.oldRegimeResult.deductions.section24b)}</span></div>}
              {result.oldRegimeResult.deductions.ltaExemption > 0 && <div className="flex justify-between text-sm"><span className="text-muted">LTA Exemption (Sec 10(5))</span><span className="font-medium">{formatINR(result.oldRegimeResult.deductions.ltaExemption)}</span></div>}
            </div>
          </div>
        )}

        {/* Monthly take-home estimate */}
        <div className="card mt-4 bg-primary-50">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-navy">Estimated Monthly Take-Home</span>
            <span className="text-xl font-bold text-primary">{formatINR(Math.round(winner.takeHome / 12))}</span>
          </div>
          <p className="text-xs text-muted-2 mt-1">After tax and EPF deduction. Excludes variable pay, bonuses, reimbursements.</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-2xl my-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Disclaimer:</strong> This is an educational modeling tool that demonstrates tax implications of different salary configurations under the Income Tax Act, 1961. It does not constitute tax or financial advice. Results are estimates. Actual outcomes depend on employer policies, your actual expenses/investments, and interpretation of tax rules. Consult a qualified Chartered Accountant before implementing changes.
        </p>
      </div>

      <ShareButton url="/calculators/salary-optimizer" title="Salary Structure Optimizer - Paisa Reality" />
      <InternalLinks title="Related Smart Tools" links={calcLinks} columns={2} />
      <FAQ items={OPTIMIZER_FAQS} />
      <AdBanner format="horizontal" className="mt-8" />
    </div>
  );
}
