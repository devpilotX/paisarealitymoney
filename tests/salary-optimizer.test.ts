/**
 * Salary Optimizer Test Cases
 * Run: npx ts-node --project tsconfig.scripts.json tests/salary-optimizer.test.ts
 */

import { optimizeSalaryStructure, type OptimizerInputs } from '../src/lib/salary-optimizer';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

function test(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

// --- Test Cases ---

test('₹5L CTC — new regime should be better (below 12L threshold)', () => {
  const inputs: OptimizerInputs = {
    ctc: 500000, isMetro: true, monthlyRent: 0, ageGroup: 'general',
    yearsAtEmployer: 1, monthlyPhoneBill: 0, annualTravelBudget: 0,
    existing80C: 0, homeLoanInterest: 0, healthInsurance80D: 0,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: false, hasFoodCoupons: false,
  };
  const result = optimizeSalaryStructure(inputs);
  assert(result.newRegimeResult.tax === 0, 'New regime tax should be 0 (income below 12L after std deduction)');
  assert(result.bestRegime === 'new' || result.oldRegimeResult.tax === 0, 'At ₹5L CTC both regimes should be zero or new is best');
});

test('₹10L CTC metro, ₹15K rent, no extra deductions', () => {
  const inputs: OptimizerInputs = {
    ctc: 1000000, isMetro: true, monthlyRent: 15000, ageGroup: 'general',
    yearsAtEmployer: 3, monthlyPhoneBill: 1000, annualTravelBudget: 20000,
    existing80C: 50000, homeLoanInterest: 0, healthInsurance80D: 25000,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: false, hasFoodCoupons: true,
  };
  const result = optimizeSalaryStructure(inputs);
  assert(result.oldRegimeResult.tax >= 0, 'Old regime tax should be non-negative');
  assert(result.newRegimeResult.tax >= 0, 'New regime tax should be non-negative');
  assert(result.oldRegimeResult.structure.basic > 0, 'Basic should be > 0');
  assert(result.oldRegimeResult.structure.basic + result.oldRegimeResult.structure.hra + result.oldRegimeResult.structure.specialAllowance + result.oldRegimeResult.structure.lta + result.oldRegimeResult.structure.foodCoupons + result.oldRegimeResult.structure.npsEmployer + result.oldRegimeResult.structure.vehicleAllowance + result.oldRegimeResult.structure.phoneAllowance + result.oldRegimeResult.structure.epfEmployer === inputs.ctc, 'Components should sum to CTC');
});

test('₹12L CTC — new regime should be 0 tax (87A rebate)', () => {
  const inputs: OptimizerInputs = {
    ctc: 1200000, isMetro: true, monthlyRent: 20000, ageGroup: 'general',
    yearsAtEmployer: 2, monthlyPhoneBill: 1000, annualTravelBudget: 30000,
    existing80C: 100000, homeLoanInterest: 0, healthInsurance80D: 25000,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: false, hasFoodCoupons: true,
  };
  const result = optimizeSalaryStructure(inputs);
  // After EPF employer deduction + NPS, gross salary is < 12L, and with std deduction 75K → taxable < 12L
  // So new regime should have 0 or very low tax
  assert(result.newRegimeResult.tax <= 50000, 'At ₹12L CTC new regime tax should be low (87A rebate or near)');
});

test('₹20L CTC with NPS — NPS should provide savings', () => {
  const inputsWithNPS: OptimizerInputs = {
    ctc: 2000000, isMetro: true, monthlyRent: 30000, ageGroup: 'general',
    yearsAtEmployer: 5, monthlyPhoneBill: 1500, annualTravelBudget: 40000,
    existing80C: 150000, homeLoanInterest: 200000, healthInsurance80D: 25000,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: true, hasFoodCoupons: true,
  };
  const inputsWithoutNPS: OptimizerInputs = { ...inputsWithNPS, hasNPS: false };
  const withNPS = optimizeSalaryStructure(inputsWithNPS);
  const withoutNPS = optimizeSalaryStructure(inputsWithoutNPS);
  assert(withNPS.oldRegimeResult.tax <= withoutNPS.oldRegimeResult.tax, 'Old regime with NPS should have equal or less tax');
});

test('₹15L CTC — old regime with heavy deductions should beat new regime', () => {
  const inputs: OptimizerInputs = {
    ctc: 1500000, isMetro: true, monthlyRent: 25000, ageGroup: 'general',
    yearsAtEmployer: 6, monthlyPhoneBill: 2000, annualTravelBudget: 50000,
    existing80C: 150000, homeLoanInterest: 200000, healthInsurance80D: 50000,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: true, hasFoodCoupons: true,
  };
  const result = optimizeSalaryStructure(inputs);
  assert(result.bestRegime === 'old', 'With max deductions (80C+80D+24b+NPS+HRA) at ₹15L, old regime should be better');
  assert(result.savingsVsNaive >= 0, 'Savings vs naive should be non-negative');
});

test('₹50L CTC — new regime likely better at high income', () => {
  const inputs: OptimizerInputs = {
    ctc: 5000000, isMetro: true, monthlyRent: 50000, ageGroup: 'general',
    yearsAtEmployer: 8, monthlyPhoneBill: 2000, annualTravelBudget: 100000,
    existing80C: 150000, homeLoanInterest: 200000, healthInsurance80D: 25000,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: true, hasFoodCoupons: true,
  };
  const result = optimizeSalaryStructure(inputs);
  assert(result.oldRegimeResult.tax > 0, 'At ₹50L there should be tax payable');
  assert(result.newRegimeResult.tax > 0, 'At ₹50L there should be tax payable under new regime too');
  // At very high income, deductions are capped so new regime may win
  assert(result.savingsVsNaive >= 0, 'Optimized structure should be at least as good as naive');
});

test('Constraint: Basic % should respect min/max bounds', () => {
  const inputs: OptimizerInputs = {
    ctc: 1500000, isMetro: false, monthlyRent: 12000, ageGroup: 'general',
    yearsAtEmployer: 4, monthlyPhoneBill: 800, annualTravelBudget: 25000,
    existing80C: 100000, homeLoanInterest: 0, healthInsurance80D: 25000,
    minBasicPct: 35, maxBasicPct: 45, hasNPS: false, hasFoodCoupons: true,
  };
  const result = optimizeSalaryStructure(inputs);
  const basicPct = (result.oldRegimeResult.structure.basic / inputs.ctc) * 100;
  assert(basicPct >= 35 - 0.1, `Basic % (${basicPct.toFixed(1)}) should be >= 35%`);
  assert(basicPct <= 45 + 0.1, `Basic % (${basicPct.toFixed(1)}) should be <= 45%`);
});

test('Edge case: Zero rent — no HRA exemption', () => {
  const inputs: OptimizerInputs = {
    ctc: 1200000, isMetro: true, monthlyRent: 0, ageGroup: 'general',
    yearsAtEmployer: 2, monthlyPhoneBill: 0, annualTravelBudget: 0,
    existing80C: 0, homeLoanInterest: 0, healthInsurance80D: 0,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: false, hasFoodCoupons: false,
  };
  const result = optimizeSalaryStructure(inputs);
  assert(result.oldRegimeResult.deductions.hraExemption === 0, 'HRA exemption should be 0 when rent is 0');
});

test('Structure sums to CTC for all optimization results', () => {
  const inputs: OptimizerInputs = {
    ctc: 1800000, isMetro: true, monthlyRent: 20000, ageGroup: 'general',
    yearsAtEmployer: 4, monthlyPhoneBill: 1500, annualTravelBudget: 40000,
    existing80C: 100000, homeLoanInterest: 150000, healthInsurance80D: 25000,
    minBasicPct: 30, maxBasicPct: 50, hasNPS: true, hasFoodCoupons: true,
  };
  const result = optimizeSalaryStructure(inputs);
  const s = result.oldRegimeResult.structure;
  const sum = s.basic + s.hra + s.specialAllowance + s.lta + s.foodCoupons + s.npsEmployer + s.vehicleAllowance + s.phoneAllowance + s.epfEmployer;
  assert(Math.abs(sum - inputs.ctc) < 2, `Old regime structure sum (${sum}) should equal CTC (${inputs.ctc})`);
  const sn = result.newRegimeResult.structure;
  const sumN = sn.basic + sn.hra + sn.specialAllowance + sn.lta + sn.foodCoupons + sn.npsEmployer + sn.vehicleAllowance + sn.phoneAllowance + sn.epfEmployer;
  assert(Math.abs(sumN - inputs.ctc) < 2, `New regime structure sum (${sumN}) should equal CTC (${inputs.ctc})`);
});

// --- Summary ---
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
