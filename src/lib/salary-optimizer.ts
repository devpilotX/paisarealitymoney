/**
 * Salary Structure Optimizer — Constrained optimization engine
 * Minimizes net tax liability across old/new regime by optimally allocating CTC components.
 * References: IT Act Sections 10(13A), 10(5), 80C, 80CCD(2), 80D, 24(b)
 */

// --- Types ---

export interface OptimizerInputs {
  ctc: number;                    // Annual CTC
  isMetro: boolean;               // Metro city (50% HRA) or non-metro (40%)
  monthlyRent: number;            // Monthly rent paid
  ageGroup: 'general' | 'senior'; // Below 60 or 60+
  yearsAtEmployer: number;        // For gratuity valuation
  monthlyPhoneBill: number;       // Actual phone/internet
  annualTravelBudget: number;     // Realistic LTA spend
  existing80C: number;            // 80C investments outside salary (ELSS, PPF, LI, etc.)
  homeLoanInterest: number;       // Section 24(b)
  healthInsurance80D: number;     // Section 80D premium
  minBasicPct: number;            // Company policy min (e.g., 30)
  maxBasicPct: number;            // Company policy max (e.g., 50)
  hasNPS: boolean;                // Company offers NPS?
  hasFoodCoupons: boolean;        // Company offers food coupons?
}

export interface SalaryStructure {
  basic: number;
  hra: number;
  specialAllowance: number;
  lta: number;
  foodCoupons: number;
  npsEmployer: number;
  vehicleAllowance: number;
  phoneAllowance: number;
  epfEmployer: number;            // 12% of Basic (capped at ₹15,000/month base)
}

export interface OptimizationResult {
  bestRegime: 'old' | 'new';
  oldRegimeResult: RegimeResult;
  newRegimeResult: RegimeResult;
  naiveStructure: SalaryStructure;
  naiveTax: number;
  savingsVsNaive: number;
}

export interface RegimeResult {
  structure: SalaryStructure;
  tax: number;
  takeHome: number;
  deductions: DeductionBreakdown;
}

interface DeductionBreakdown {
  standardDeduction: number;
  hraExemption: number;
  section80C: number;
  section80CCD2: number;
  section80D: number;
  section24b: number;
  ltaExemption: number;
}

// --- Tax Slabs FY 2025-26 ---

function calcNewRegimeTax(taxableIncome: number): number {
  const slabs = [
    { limit: 400000, rate: 0 },
    { limit: 800000, rate: 0.05 },
    { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 },
    { limit: 2000000, rate: 0.20 },
    { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, slab.limit) - prev) * slab.rate;
    prev = slab.limit;
  }
  if (taxableIncome <= 1200000) tax = 0; // Section 87A rebate
  return Math.round(tax * 1.04); // 4% cess
}

function calcOldRegimeTax(taxableIncome: number, ageGroup: string): number {
  const slabs = ageGroup === 'senior'
    ? [{ limit: 300000, rate: 0 }, { limit: 500000, rate: 0.05 }, { limit: 1000000, rate: 0.20 }, { limit: Infinity, rate: 0.30 }]
    : [{ limit: 250000, rate: 0 }, { limit: 500000, rate: 0.05 }, { limit: 1000000, rate: 0.20 }, { limit: Infinity, rate: 0.30 }];
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, slab.limit) - prev) * slab.rate;
    prev = slab.limit;
  }
  if (taxableIncome <= 500000) tax = 0; // Section 87A rebate
  return Math.round(tax * 1.04);
}

// --- Structure Builder ---

function buildStructure(inputs: OptimizerInputs, basicPct: number): SalaryStructure {
  const basic = Math.round(inputs.ctc * basicPct / 100);
  const annualBasic = basic;

  // EPF employer: 12% of Basic, capped at Basic ≤ ₹15,000/month (₹1,80,000/year)
  const epfBase = Math.min(annualBasic, 180000);
  const epfEmployer = Math.round(epfBase * 0.12);

  // HRA: min of (metro_factor * Basic) — this is the max company can give
  const metroFactor = inputs.isMetro ? 0.50 : 0.40;
  const hra = Math.round(annualBasic * metroFactor);

  // NPS employer: up to 14% of Basic (Section 80CCD(2))
  const npsEmployer = inputs.hasNPS ? Math.round(annualBasic * 0.14) : 0;

  // Food coupons: ₹2,200/month = ₹26,400/year max
  const foodCoupons = inputs.hasFoodCoupons ? 26400 : 0;

  // LTA: capped at user's realistic travel budget
  const lta = Math.min(inputs.annualTravelBudget, Math.round(inputs.ctc * 0.05));

  // Phone/vehicle reimbursements
  const phoneAllowance = inputs.monthlyPhoneBill * 12;
  const vehicleAllowance = Math.min(21600, Math.round(inputs.ctc * 0.02));

  // Special Allowance = CTC - everything else (fully taxable buffer)
  const allocated = annualBasic + hra + epfEmployer + npsEmployer + foodCoupons + lta + phoneAllowance + vehicleAllowance;
  const specialAllowance = Math.max(0, inputs.ctc - allocated);

  return { basic: annualBasic, hra, specialAllowance, lta, foodCoupons, npsEmployer, vehicleAllowance, phoneAllowance, epfEmployer };
}

// --- Tax Computation for a Given Structure ---

function computeOldRegimeTax(structure: SalaryStructure, inputs: OptimizerInputs): { tax: number; deductions: DeductionBreakdown } {
  const annualRent = inputs.monthlyRent * 12;

  // HRA exemption: min(actual HRA, rent - 10% Basic, metro_factor * Basic)
  const hraExempt1 = structure.hra;
  const hraExempt2 = Math.max(0, annualRent - structure.basic * 0.10);
  const hraExempt3 = structure.basic * (inputs.isMetro ? 0.50 : 0.40);
  const hraExemption = inputs.monthlyRent > 0 ? Math.min(hraExempt1, hraExempt2, hraExempt3) : 0;

  // Section 80C: EPF employee (12% of PF-wage) + user's existing 80C, cap 1.5L
  const epfEmployee = Math.round(Math.min(structure.basic, 180000) * 0.12);
  const section80C = Math.min(150000, epfEmployee + inputs.existing80C);

  // Section 80CCD(2): employer NPS contribution (no cap under 80CCD(2) but max 14% of Basic)
  const section80CCD2 = structure.npsEmployer;

  // Section 80D
  const section80D = Math.min(inputs.ageGroup === 'senior' ? 50000 : 25000, inputs.healthInsurance80D);

  // Section 24(b) home loan interest
  const section24b = Math.min(200000, inputs.homeLoanInterest);

  // LTA exemption (assume user will travel)
  const ltaExemption = structure.lta;

  const standardDeduction = 50000;

  // Gross salary for tax = CTC - EPF employer (not taxable) - NPS employer (exempt under 80CCD(2))
  const grossSalary = inputs.ctc - structure.epfEmployer - structure.npsEmployer;

  const taxableIncome = Math.max(0,
    grossSalary
    - standardDeduction
    - hraExemption
    - section80C
    - section80D
    - section24b
    - ltaExemption
    - structure.foodCoupons
    - structure.phoneAllowance
    - structure.vehicleAllowance
  );

  const tax = calcOldRegimeTax(taxableIncome, inputs.ageGroup);
  const deductions: DeductionBreakdown = { standardDeduction, hraExemption, section80C, section80CCD2, section80D, section24b, ltaExemption };
  return { tax, deductions };
}

function computeNewRegimeTax(structure: SalaryStructure, inputs: OptimizerInputs): { tax: number; deductions: DeductionBreakdown } {
  // New regime: only standard deduction ₹75,000 + NPS employer 80CCD(2) allowed
  const standardDeduction = 75000;
  const section80CCD2 = structure.npsEmployer;

  const grossSalary = inputs.ctc - structure.epfEmployer - structure.npsEmployer;
  const taxableIncome = Math.max(0, grossSalary - standardDeduction);

  const tax = calcNewRegimeTax(taxableIncome);
  const deductions: DeductionBreakdown = { standardDeduction, hraExemption: 0, section80C: 0, section80CCD2, section80D: 0, section24b: 0, ltaExemption: 0 };
  return { tax, deductions };
}

// --- Main Optimizer (Grid Search) ---

export function optimizeSalaryStructure(inputs: OptimizerInputs): OptimizationResult {
  let bestOld: RegimeResult | null = null;
  let bestNew: RegimeResult | null = null;

  // Search Basic from min to max in 1% steps
  const minPct = Math.max(30, inputs.minBasicPct);
  const maxPct = Math.min(50, inputs.maxBasicPct);

  for (let pct = minPct; pct <= maxPct; pct += 1) {
    const structure = buildStructure(inputs, pct);

    // Old regime evaluation
    const oldResult = computeOldRegimeTax(structure, inputs);
    const oldTakeHome = inputs.ctc - oldResult.tax - structure.epfEmployer;
    if (!bestOld || oldResult.tax < bestOld.tax) {
      bestOld = { structure, tax: oldResult.tax, takeHome: oldTakeHome, deductions: oldResult.deductions };
    }

    // New regime evaluation
    const newResult = computeNewRegimeTax(structure, inputs);
    const newTakeHome = inputs.ctc - newResult.tax - structure.epfEmployer;
    if (!bestNew || newResult.tax < bestNew.tax) {
      bestNew = { structure, tax: newResult.tax, takeHome: newTakeHome, deductions: newResult.deductions };
    }
  }

  // Fallback (should never hit with valid inputs)
  if (!bestOld || !bestNew) {
    const fallback = buildStructure(inputs, 40);
    const fallbackOld = computeOldRegimeTax(fallback, inputs);
    const fallbackNew = computeNewRegimeTax(fallback, inputs);
    bestOld = { structure: fallback, tax: fallbackOld.tax, takeHome: inputs.ctc - fallbackOld.tax - fallback.epfEmployer, deductions: fallbackOld.deductions };
    bestNew = { structure: fallback, tax: fallbackNew.tax, takeHome: inputs.ctc - fallbackNew.tax - fallback.epfEmployer, deductions: fallbackNew.deductions };
  }

  // Naive structure: 40% Basic, no optimization awareness
  const naiveStructure = buildStructure(inputs, 40);
  const naiveOldTax = computeOldRegimeTax(naiveStructure, inputs).tax;
  const naiveNewTax = computeNewRegimeTax(naiveStructure, inputs).tax;
  const naiveTax = Math.min(naiveOldTax, naiveNewTax);

  const bestRegime = bestOld.tax <= bestNew.tax ? 'old' as const : 'new' as const;
  const winnerTax = bestRegime === 'old' ? bestOld.tax : bestNew.tax;
  const savingsVsNaive = Math.max(0, naiveTax - winnerTax);

  return { bestRegime, oldRegimeResult: bestOld, newRegimeResult: bestNew, naiveStructure, naiveTax, savingsVsNaive };
}
