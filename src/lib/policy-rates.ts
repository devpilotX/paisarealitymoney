/**
 * Government-set interest rates with provenance.
 *
 * Small savings rates are notified quarterly by the Ministry of Finance
 * (Department of Economic Affairs); RBI policy rates change at MPC meetings;
 * the EPF rate is declared yearly by the EPFO. Update this file when they
 * change and bump the as-of fields — the page displays them verbatim.
 *
 * Verified 3 July 2026 against the 30 June 2026 DEA notification (unchanged
 * for the 9th straight quarter), the June 2026 MPC outcome, and the EPFO
 * circular of 1 July 2026.
 */

export const SMALL_SAVINGS_QUARTER = 'July to September 2026 (Q2 FY 2026-27)';
export const SMALL_SAVINGS_ANNOUNCED = '2026-06-30';
export const SMALL_SAVINGS_NEXT_REVISION = '2026-10-01';
export const POLICY_RATES_SOURCE = 'Ministry of Finance (DEA) quarterly notification; RBI MPC; EPFO circular';

export interface SmallSavingsScheme {
  name: string;
  ratePct: number;
  compounding: string;
  taxNote: string;
  note: string;
}

export const SMALL_SAVINGS: SmallSavingsScheme[] = [
  {
    name: 'Sukanya Samriddhi Yojana (SSY)',
    ratePct: 8.2,
    compounding: 'Yearly',
    taxNote: 'EEE: 80C deduction, tax-free interest and maturity',
    note: 'For a girl child under 10; deposits for 15 years, matures at 21',
  },
  {
    name: 'Senior Citizens Savings Scheme (SCSS)',
    ratePct: 8.2,
    compounding: 'Quarterly payout',
    taxNote: '80C deduction; interest taxable, TDS above Rs 50,000',
    note: 'Age 60+ (55+ for retirees); 5-year term, max Rs 30 lakh',
  },
  {
    name: 'National Savings Certificate (NSC)',
    ratePct: 7.7,
    compounding: 'Yearly (paid at maturity)',
    taxNote: '80C deduction; interest taxable but reinvested counts for 80C',
    note: '5-year lock-in, no early exit except death or court order',
  },
  {
    name: 'Kisan Vikas Patra (KVP)',
    ratePct: 7.5,
    compounding: 'Yearly',
    taxNote: 'No 80C benefit; interest taxable',
    note: 'Money doubles in 115 months at the current rate',
  },
  {
    name: 'Post Office Time Deposit: 5 years',
    ratePct: 7.5,
    compounding: 'Quarterly',
    taxNote: '80C deduction (5-year TD only); interest taxable',
    note: 'The only Post Office TD with a tax break',
  },
  {
    name: 'Post Office Monthly Income Scheme (POMIS)',
    ratePct: 7.4,
    compounding: 'Monthly payout',
    taxNote: 'No 80C benefit; interest taxable',
    note: 'Max Rs 9 lakh single / Rs 15 lakh joint; 5-year term',
  },
  {
    name: 'Public Provident Fund (PPF)',
    ratePct: 7.1,
    compounding: 'Yearly',
    taxNote: 'EEE: 80C deduction, tax-free interest and maturity',
    note: '15-year term; Rs 500 to Rs 1.5 lakh per year; sovereign guarantee',
  },
  {
    name: 'Post Office Time Deposit: 3 years',
    ratePct: 7.1,
    compounding: 'Quarterly',
    taxNote: 'No 80C benefit; interest taxable',
    note: '',
  },
  {
    name: 'Post Office Time Deposit: 2 years',
    ratePct: 7.0,
    compounding: 'Quarterly',
    taxNote: 'No 80C benefit; interest taxable',
    note: '',
  },
  {
    name: 'Post Office Time Deposit: 1 year',
    ratePct: 6.9,
    compounding: 'Quarterly',
    taxNote: 'No 80C benefit; interest taxable',
    note: '',
  },
  {
    name: 'Post Office Recurring Deposit (5 years)',
    ratePct: 6.7,
    compounding: 'Quarterly',
    taxNote: 'No 80C benefit; interest taxable',
    note: 'Monthly deposits, minimum Rs 100',
  },
  {
    name: 'Post Office Savings Account',
    ratePct: 4.0,
    compounding: 'Yearly',
    taxNote: 'Interest up to Rs 3,500 exempt u/s 10(15)(i), plus 80TTA',
    note: '',
  },
];

export interface PolicyRate {
  name: string;
  ratePct: number;
  note: string;
}

export const RBI_RATES_AS_OF = '2026-06-06';
export const RBI_NEXT_MPC = '3 to 5 August 2026';

export const RBI_RATES: PolicyRate[] = [
  { name: 'Repo rate', ratePct: 5.25, note: 'The rate banks borrow at from RBI; home loan EBLR rates track this' },
  { name: 'Standing Deposit Facility (SDF)', ratePct: 5.0, note: 'Floor of the policy corridor' },
  { name: 'Marginal Standing Facility (MSF)', ratePct: 5.5, note: 'Ceiling of the policy corridor' },
  { name: 'Bank Rate', ratePct: 5.5, note: 'Aligned with MSF' },
];

export const RBI_STANCE = 'Neutral';

export const EPF_RATE_PCT = 8.25;
export const EPF_RATE_YEAR = 'FY 2025-26';
export const EPF_NOTIFIED = '2026-07-01';
