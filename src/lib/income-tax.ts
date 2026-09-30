/**
 * Indian income tax for individuals, FY 2026-27 (AY 2027-28). Budget 2026 kept
 * the FY 2025-26 slabs, rebate and standard deductions. Pure functions shared by
 * the income tax calculator page and its tests.
 */

/**
 * Surcharge on income tax, with marginal relief at every threshold: crossing a
 * threshold can never cost more extra tax than the income above it.
 * New regime caps surcharge at 25%; old regime goes to 37% above 5 crore.
 */
function applySurcharge(taxable: number, baseTax: (income: number) => number, regime: 'new' | 'old'): number {
  const bands: Array<{ over: number; rate: number }> = [
    { over: 5_00_00_000, rate: regime === 'new' ? 0.25 : 0.37 },
    { over: 2_00_00_000, rate: 0.25 },
    { over: 1_00_00_000, rate: 0.15 },
    { over: 50_00_000, rate: 0.10 },
  ];
  const rateFor = (income: number): number => bands.find((b) => income > b.over)?.rate ?? 0;
  const tax = baseTax(taxable);
  const band = bands.find((b) => taxable > b.over);
  if (!band) return tax;
  const withSurcharge = tax * (1 + band.rate);
  const atThreshold = baseTax(band.over) * (1 + rateFor(band.over));
  return Math.min(withSurcharge, atThreshold + (taxable - band.over));
}

function slabTax(taxableIncome: number, slabs: Array<{ limit: number; rate: number }>): number {
  let tax = 0;
  let prevLimit = 0;
  for (const slab of slabs) {
    if (taxableIncome <= prevLimit) break;
    tax += (Math.min(taxableIncome, slab.limit) - prevLimit) * slab.rate;
    prevLimit = slab.limit;
  }
  return tax;
}

const NEW_REGIME_SLABS = [
  { limit: 400000, rate: 0 },
  { limit: 800000, rate: 0.05 },
  { limit: 1200000, rate: 0.10 },
  { limit: 1600000, rate: 0.15 },
  { limit: 2000000, rate: 0.20 },
  { limit: 2400000, rate: 0.25 },
  { limit: Infinity, rate: 0.30 },
];

export function calcNewRegimeTax(income: number): number {
  // Standard deduction Rs 75,000 under the new regime (unchanged for FY 2026-27)
  const taxableIncome = Math.max(0, income - 75000);
  const base = (ti: number): number => {
    const t = slabTax(ti, NEW_REGIME_SLABS);
    // Section 87A: no tax up to Rs 12 lakh taxable, and marginal relief just above it,
    // so tax never exceeds the income earned over Rs 12 lakh.
    if (ti <= 1200000) return 0;
    return Math.min(t, ti - 1200000);
  };
  let tax = applySurcharge(taxableIncome, base, 'new');
  // Health and education cess 4%
  tax = tax * 1.04;
  return Math.round(tax);
}

export function calcOldRegimeTax(income: number, deductions80C: number, deductions80D: number, hra: number, otherDeductions: number, ageGroup: string): number {
  // Standard deduction Rs 50,000
  const taxableIncome = Math.max(0, income - 50000 - Math.min(deductions80C, 150000) - Math.min(deductions80D, 75000) - hra - otherDeductions);

  const slabs = ageGroup === 'senior' ? [
    { limit: 300000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ] : ageGroup === 'super_senior' ? [
    { limit: 500000, rate: 0 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ] : [
    { limit: 250000, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 },
  ];

  const base = (ti: number): number => {
    // Section 87A rebate (max Rs 12,500): no tax up to Rs 5 lakh taxable under the old regime.
    if (ti <= 500000) return 0;
    return slabTax(ti, slabs);
  };
  let tax = applySurcharge(taxableIncome, base, 'old');
  tax = tax * 1.04;
  return Math.round(tax);
}
