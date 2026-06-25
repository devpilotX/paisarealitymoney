/**
 * Government Scheme Benefit Maximizer. engine
 * ============================================
 * From a user's profile, finds the central government schemes they're eligible for, QUANTIFIES the
 * annual rupee benefit of each (the gap listing sites never fill), resolves conflicts/overlaps to
 * the combination that MAXIMISES total benefit, and surfaces near-misses.
 *
 * Key correctness choices:
 *  • Loans (MUDRA, Stand-Up India) are NOT counted as benefit. only their interest subvention is.
 *  • Insurance is valued at the equivalent private premium you'd otherwise pay, not the cover.
 *  • Cash / pension / subsidy schemes are counted at their face annual value.
 *  • One-time benefits (housing subsidy, toolkit) are reported separately from recurring annual ₹.
 *  • Conflicting schemes (e.g. PMAY-Urban vs PMAY-Gramin) are resolved by exact max-weight
 *    independent set, which can beat a greedy "take the biggest first" approach.
 *
 * Pure, deterministic functions + a versioned bundled dataset. Not legal/financial advice; verify
 * eligibility and amounts with the official source before applying.
 */

export const DATASET_VERSION = '2025-06-21';

// ---------------------------------------------------------------------------
// Profile & types
// ---------------------------------------------------------------------------

export type Gender = 'male' | 'female' | 'transgender';
export type Category = 'general' | 'obc' | 'sc' | 'st' | 'ews';
export type Occupation = 'employed' | 'self_employed' | 'farmer' | 'student' | 'unemployed' | 'retired' | 'homemaker' | 'daily_wage' | 'business';
export type Area = 'urban' | 'rural';
export type BenefitKind = 'recurring' | 'one-time' | 'facilitation';
export type BenefitType = 'cash' | 'subsidy' | 'insurance' | 'interest-subvention' | 'pension' | 'scholarship' | 'tax' | 'loan-access';

export interface SchemeProfile {
  age?: number;
  gender?: Gender;
  income?: number; // annual family income
  occupation?: Occupation;
  state?: string;
  category?: Category;
  area?: Area;
  hasLandholding?: boolean;
  disability?: boolean;
  bpl?: boolean;
  hasGirlChildUnder10?: boolean;
  isWidow?: boolean;
  enrolled?: string[]; // scheme ids already enrolled in
}

export interface SchemePredicates {
  minAge?: number;
  maxAge?: number;
  gender?: Gender;
  maxIncome?: number;
  occupations?: Occupation[];
  categories?: Category[];
  area?: Area;
  requiresBPL?: boolean;
  requiresDisability?: boolean;
  requiresLandholding?: boolean;
  requiresGirlChildUnder10?: boolean;
  requiresWidow?: boolean;
}

export interface Scheme {
  id: string;
  name: string;
  category: string;
  level: 'central' | 'state';
  benefitType: BenefitType;
  benefitKind: BenefitKind;
  predicates: SchemePredicates;
  /** Quantified annual (recurring) or total (one-time) rupee value for this profile. */
  quantify: (p: SchemeProfile) => number;
  valuationNote: string;
  howToApply: string;
  applyLink: string;
  source: string;
  lastVerified: string;
  conflictsWith?: string[];
}

export interface EligibleScheme {
  scheme: Scheme;
  annualValue: number;
  inOptimalSet: boolean;
}

export interface NearMiss {
  scheme: Scheme;
  reason: string;
}

export interface SchemeAnalysis {
  eligible: EligibleScheme[];
  optimalSet: EligibleScheme[];
  totalAnnualBenefit: number;
  totalOneTimeBenefit: number;
  facilitationSchemes: EligibleScheme[];
  nearMisses: NearMiss[];
  conflictsResolved: boolean;
}

// ---------------------------------------------------------------------------
// Benefit-quantification helpers
// ---------------------------------------------------------------------------

/** Rough marginal tax rate (incl. cess) from annual income, for tax-linked schemes. */
function marginalRate(income: number | undefined): number {
  const i = income ?? 0;
  if (i <= 700000) return 0;
  if (i <= 1000000) return 0.104;
  if (i <= 1200000) return 0.156;
  if (i <= 1500000) return 0.208;
  return 0.312;
}

// ---------------------------------------------------------------------------
// Dataset (versioned, ~26 high-impact central schemes)
// ---------------------------------------------------------------------------

export const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan', name: 'PM-KISAN Samman Nidhi', category: 'agriculture', level: 'central',
    benefitType: 'cash', benefitKind: 'recurring',
    predicates: { occupations: ['farmer'], requiresLandholding: true },
    quantify: () => 6000, valuationNote: '₹2,000 × 3 instalments a year, direct cash transfer.',
    howToApply: 'Register at pmkisan.gov.in or your local revenue office / CSC with land records and Aadhaar.',
    applyLink: 'https://pmkisan.gov.in', source: 'pmkisan.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pmjay', name: 'Ayushman Bharat (PM-JAY)', category: 'healthcare', level: 'central',
    benefitType: 'insurance', benefitKind: 'recurring',
    predicates: { maxIncome: 300000 },
    quantify: () => 20000, valuationNote: '₹5L family health cover; valued at the ~₹20k/yr premium of an equivalent private family floater.',
    howToApply: 'Check eligibility at beneficiary.nha.gov.in, then get your card at an empanelled hospital with Aadhaar + ration card.',
    applyLink: 'https://beneficiary.nha.gov.in', source: 'pmjay.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pmsby', name: 'PM Suraksha Bima Yojana', category: 'insurance', level: 'central',
    benefitType: 'insurance', benefitKind: 'recurring',
    predicates: { minAge: 18, maxAge: 70 },
    quantify: () => 500, valuationNote: '₹2L accident cover for a ₹20 premium; valued at ~₹500/yr equivalent private accident cover.',
    howToApply: 'Enable auto-debit of ₹20/yr from your bank savings account.',
    applyLink: 'https://www.jansuraksha.gov.in', source: 'jansuraksha.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pmjjby', name: 'PM Jeevan Jyoti Bima Yojana', category: 'insurance', level: 'central',
    benefitType: 'insurance', benefitKind: 'recurring',
    predicates: { minAge: 18, maxAge: 50 },
    quantify: () => 2000, valuationNote: '₹2L life cover for ₹436; valued at ~₹2,000/yr equivalent term premium.',
    howToApply: 'Enrol via your bank; ₹436/yr auto-debited from your savings account.',
    applyLink: 'https://www.jansuraksha.gov.in', source: 'jansuraksha.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'mgnrega', name: 'MGNREGA (100 days work)', category: 'employment', level: 'central',
    benefitType: 'cash', benefitKind: 'recurring',
    predicates: { area: 'rural', occupations: ['unemployed', 'daily_wage', 'farmer', 'homemaker'] },
    quantify: () => 24000, valuationNote: 'Up to 100 days of work; valued at ~₹24,000/yr (≈80 days × ~₹300 typical wage).',
    howToApply: 'Apply for a job card at your Gram Panchayat; demand work in writing.',
    applyLink: 'https://nrega.nic.in', source: 'nrega.nic.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pm-svanidhi', name: 'PM SVANidhi (street vendor)', category: 'business', level: 'central',
    benefitType: 'interest-subvention', benefitKind: 'recurring',
    predicates: { area: 'urban', occupations: ['self_employed', 'daily_wage', 'business'] },
    quantify: () => 2100, valuationNote: '7% interest subvention on a working-capital loan (~₹30k) plus digital-payment cashback.',
    howToApply: 'Apply at pmsvanidhi.mohua.gov.in or a bank/ULB with your vending certificate.',
    applyLink: 'https://pmsvanidhi.mohua.gov.in', source: 'pmsvanidhi.mohua.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'kisan-credit-card', name: 'Kisan Credit Card', category: 'agriculture', level: 'central',
    benefitType: 'interest-subvention', benefitKind: 'recurring',
    predicates: { occupations: ['farmer'], requiresLandholding: true },
    quantify: () => 9000, valuationNote: 'Interest subvention (effective ~4% vs ~9%) on crop credit up to ₹3L ≈ ₹9,000/yr saved.',
    howToApply: 'Apply at any bank branch with land documents and Aadhaar.',
    applyLink: 'https://pmkisan.gov.in/Documents/KCC.pdf', source: 'agriwelfare.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pm-fasal-bima', name: 'PM Fasal Bima Yojana', category: 'agriculture', level: 'central',
    benefitType: 'insurance', benefitKind: 'recurring',
    predicates: { occupations: ['farmer'], requiresLandholding: true },
    quantify: () => 3000, valuationNote: 'Crop insurance where the government subsidises most of the premium; valued at ~₹3,000/yr premium saved.',
    howToApply: 'Enrol via your bank at the time of a crop loan, or through a CSC.',
    applyLink: 'https://pmfby.gov.in', source: 'pmfby.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'nsp-scholarship', name: 'National Scholarship (post-matric)', category: 'education', level: 'central',
    benefitType: 'scholarship', benefitKind: 'recurring',
    predicates: { occupations: ['student'], categories: ['sc', 'st', 'obc', 'ews'], maxIncome: 800000, minAge: 14 },
    quantify: () => 12000, valuationNote: 'Maintenance allowance + fees; varies by course. valued at ~₹12,000/yr.',
    howToApply: 'Apply at scholarships.gov.in (window usually Jul to Nov) with income & caste certificates.',
    applyLink: 'https://scholarships.gov.in', source: 'scholarships.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'ignoaps', name: 'Old Age Pension (IGNOAPS)', category: 'senior-citizen', level: 'central',
    benefitType: 'pension', benefitKind: 'recurring',
    predicates: { minAge: 60, requiresBPL: true },
    quantify: (p) => ((p.age ?? 60) >= 80 ? 6000 : 2400), valuationNote: '₹200/mo (60 to 79) or ₹500/mo (80+) central share; states often add more.',
    howToApply: 'Apply at your Block/District social welfare office with age & BPL proof.',
    applyLink: 'https://nsap.nic.in', source: 'nsap.nic.in', lastVerified: '2025-06-21',
    conflictsWith: ['ignoaps', 'igndps', 'ignwps'],
  },
  {
    id: 'igndps', name: 'Disability Pension (IGNDPS)', category: 'disability', level: 'central',
    benefitType: 'pension', benefitKind: 'recurring',
    predicates: { minAge: 18, requiresBPL: true, requiresDisability: true },
    quantify: (p) => ((p.age ?? 18) >= 80 ? 6000 : 3600), valuationNote: '₹300/mo (18 to 79) or ₹500/mo (80+) central share for 80%+ disability.',
    howToApply: 'Apply at your Block/District social welfare office with a disability certificate (80%+) & BPL proof.',
    applyLink: 'https://nsap.nic.in', source: 'nsap.nic.in', lastVerified: '2025-06-21',
    conflictsWith: ['ignoaps', 'igndps', 'ignwps'],
  },
  {
    id: 'ignwps', name: 'Widow Pension (IGNWPS)', category: 'women', level: 'central',
    benefitType: 'pension', benefitKind: 'recurring',
    predicates: { gender: 'female', minAge: 40, requiresBPL: true, requiresWidow: true },
    quantify: (p) => ((p.age ?? 40) >= 80 ? 6000 : 3600), valuationNote: '₹300/mo (40 to 79) or ₹500/mo (80+) central share for BPL widows.',
    howToApply: 'Apply at your Block/District social welfare office with spouse death certificate & BPL proof.',
    applyLink: 'https://nsap.nic.in', source: 'nsap.nic.in', lastVerified: '2025-06-21',
    conflictsWith: ['ignoaps', 'igndps', 'ignwps'],
  },
  {
    id: 'sukanya-samriddhi', name: 'Sukanya Samriddhi Yojana', category: 'women', level: 'central',
    benefitType: 'tax', benefitKind: 'recurring',
    predicates: { requiresGirlChildUnder10: true },
    quantify: (p) => Math.round(Math.min(150000, 150000) * marginalRate(p.income)) || 3000,
    valuationNote: 'Up to ₹1.5L/yr deposit qualifies for 80C; benefit valued at your tax saved (min ₹3,000 illustrative) plus a high tax-free interest rate.',
    howToApply: 'Open an account at a post office or bank for your daughter (under 10) with her birth certificate.',
    applyLink: 'https://www.nsiindia.gov.in', source: 'nsiindia.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pm-poshan', name: 'PM POSHAN (Mid-Day Meal)', category: 'education', level: 'central',
    benefitType: 'subsidy', benefitKind: 'recurring',
    predicates: { occupations: ['student'], minAge: 6, maxAge: 14 },
    quantify: () => 3000, valuationNote: 'Free cooked school lunch; valued at ~₹3,000/yr of meals.',
    howToApply: 'Automatic for children in government & aided schools (Classes 1 to 8).',
    applyLink: 'https://pmposhan.education.gov.in', source: 'education.gov.in', lastVerified: '2025-06-21',
  },
  // ---- One-time benefits ----
  {
    id: 'pmay-urban', name: 'PM Awas Yojana. Urban', category: 'housing', level: 'central',
    benefitType: 'subsidy', benefitKind: 'one-time',
    predicates: { area: 'urban', maxIncome: 1800000, minAge: 21 },
    quantify: () => 267000, valuationNote: 'Credit-linked interest subsidy of up to ₹2.67L on a home loan (one-time).',
    howToApply: 'Apply at pmaymis.gov.in or a CSC with Aadhaar & income proof.',
    applyLink: 'https://pmay-urban.gov.in', source: 'pmay-urban.gov.in', lastVerified: '2025-06-21',
    conflictsWith: ['pmay-gramin'],
  },
  {
    id: 'pmay-gramin', name: 'PM Awas Yojana. Gramin', category: 'housing', level: 'central',
    benefitType: 'subsidy', benefitKind: 'one-time',
    predicates: { area: 'rural', requiresBPL: true },
    quantify: () => 130000, valuationNote: '₹1.20L to 1.30L grant to build a pucca rural house (one-time).',
    howToApply: 'Identified via SECC data; apply through your Gram Panchayat if not listed.',
    applyLink: 'https://pmayg.nic.in', source: 'pmayg.nic.in', lastVerified: '2025-06-21',
    conflictsWith: ['pmay-urban'],
  },
  {
    id: 'pm-vishwakarma', name: 'PM Vishwakarma (artisans)', category: 'skill-training', level: 'central',
    benefitType: 'subsidy', benefitKind: 'one-time',
    predicates: { occupations: ['self_employed'], minAge: 18 },
    quantify: () => 15000, valuationNote: 'Free toolkit (~₹15,000) plus skill stipend; collateral-light credit at 5% (subvention not counted here).',
    howToApply: 'Register at pmvishwakarma.gov.in; verified by Gram Panchayat/ULB.',
    applyLink: 'https://pmvishwakarma.gov.in', source: 'pmvishwakarma.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pmkvy', name: 'PM Kaushal Vikas (PMKVY)', category: 'skill-training', level: 'central',
    benefitType: 'subsidy', benefitKind: 'one-time',
    predicates: { occupations: ['unemployed', 'student'], minAge: 15, maxAge: 45 },
    quantify: () => 8000, valuationNote: 'Free certified skill training plus a one-time stipend (~₹8,000).',
    howToApply: 'Enrol at a PMKVY training centre via pmkvyofficial.org.',
    applyLink: 'https://www.pmkvyofficial.org', source: 'pmkvyofficial.org', lastVerified: '2025-06-21',
  },
  {
    id: 'ujjwala', name: 'PM Ujjwala (LPG connection)', category: 'social', level: 'central',
    benefitType: 'subsidy', benefitKind: 'one-time',
    predicates: { gender: 'female', requiresBPL: true },
    quantify: () => 1600, valuationNote: 'Free LPG connection with stove and first refill (one-time, ~₹1,600).',
    howToApply: 'Apply at your nearest LPG distributor with BPL & Aadhaar.',
    applyLink: 'https://www.pmuy.gov.in', source: 'pmuy.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'swachh-bharat-toilet', name: 'Swachh Bharat (toilet grant)', category: 'social', level: 'central',
    benefitType: 'subsidy', benefitKind: 'one-time',
    predicates: { area: 'rural', requiresBPL: true },
    quantify: () => 12000, valuationNote: '₹12,000 incentive to build a household toilet (one-time).',
    howToApply: 'Apply through your Gram Panchayat / Block office.',
    applyLink: 'https://swachhbharatmission.gov.in', source: 'swachhbharatmission.gov.in', lastVerified: '2025-06-21',
  },
  {
    id: 'pmmvy', name: 'PM Matru Vandana Yojana', category: 'women', level: 'central',
    benefitType: 'cash', benefitKind: 'one-time',
    predicates: { gender: 'female', minAge: 19, maxAge: 45 },
    quantify: () => 5000, valuationNote: '₹5,000 maternity cash benefit for the first living child (one-time).',
    howToApply: 'Register at your Anganwadi/health centre with your MCP card & bank details.',
    applyLink: 'https://pmmvy.wcd.gov.in', source: 'wcd.nic.in', lastVerified: '2025-06-21',
  },
  // ---- Facilitation (₹0 direct grant. access/credit, shown but not summed) ----
  {
    id: 'mudra', name: 'PM MUDRA Yojana', category: 'business', level: 'central',
    benefitType: 'loan-access', benefitKind: 'facilitation',
    predicates: { occupations: ['self_employed', 'business'], minAge: 18 },
    quantify: () => 0, valuationNote: 'Collateral-free business loan up to ₹10L. The loan itself is NOT a benefit. only access; counted as ₹0.',
    howToApply: 'Apply at any bank/NBFC/MFI with a business plan and KYC.',
    applyLink: 'https://www.mudra.org.in', source: 'mudra.org.in', lastVerified: '2025-06-21',
  },
  {
    id: 'stand-up-india', name: 'Stand-Up India', category: 'business', level: 'central',
    benefitType: 'loan-access', benefitKind: 'facilitation',
    predicates: { occupations: ['self_employed', 'business'], minAge: 18, categories: ['sc', 'st'] },
    quantify: () => 0, valuationNote: 'Loan of ₹10L to ₹1Cr for SC/ST & women entrepreneurs. Loan access, not a grant. counted as ₹0.',
    howToApply: 'Apply at standupmitra.in or your bank with a business plan.',
    applyLink: 'https://www.standupmitra.in', source: 'standupmitra.in', lastVerified: '2025-06-21',
  },
  {
    id: 'apy', name: 'Atal Pension Yojana', category: 'pension', level: 'central',
    benefitType: 'pension', benefitKind: 'facilitation',
    predicates: { minAge: 18, maxAge: 40 },
    quantify: () => 0, valuationNote: 'Guaranteed ₹1k to 5k/mo pension from 60. funded by your own contributions, so counted as ₹0 free benefit.',
    howToApply: 'Enrol at your bank; monthly contribution auto-debited.',
    applyLink: 'https://www.npscra.nsdl.co.in', source: 'npscra.nsdl.co.in', lastVerified: '2025-06-21',
  },
  {
    id: 'jan-dhan', name: 'PM Jan Dhan Yojana', category: 'finance', level: 'central',
    benefitType: 'insurance', benefitKind: 'recurring',
    predicates: { minAge: 10 },
    quantify: () => 300, valuationNote: 'Zero-balance account with ₹2L accident cover (RuPay); valued at ~₹300/yr.',
    howToApply: 'Open at any bank with Aadhaar. no minimum balance.',
    applyLink: 'https://pmjdy.gov.in', source: 'pmjdy.gov.in', lastVerified: '2025-06-21',
  },
];

// ---------------------------------------------------------------------------
// Schema validator
// ---------------------------------------------------------------------------

export function validateScheme(s: Scheme): string[] {
  const errs: string[] = [];
  if (!s.id) errs.push('missing id');
  if (!s.name) errs.push(`${s.id}: missing name`);
  if (typeof s.quantify !== 'function') errs.push(`${s.id}: missing quantify fn`);
  if (!s.source) errs.push(`${s.id}: missing source`);
  if (!s.lastVerified) errs.push(`${s.id}: missing lastVerified`);
  if (!s.applyLink || !/^https?:\/\//.test(s.applyLink)) errs.push(`${s.id}: invalid applyLink`);
  if (!s.valuationNote) errs.push(`${s.id}: missing valuationNote`);
  return errs;
}

// ---------------------------------------------------------------------------
// Eligibility engine
// ---------------------------------------------------------------------------

interface PredCheck { ok: boolean; reason?: string }

function checkPredicates(p: SchemeProfile, pred: SchemePredicates): PredCheck {
  if (pred.minAge !== undefined && (p.age ?? -1) < pred.minAge) return { ok: false, reason: `available from age ${pred.minAge}` };
  if (pred.maxAge !== undefined && (p.age ?? 999) > pred.maxAge) return { ok: false, reason: `only up to age ${pred.maxAge}` };
  if (pred.gender && p.gender !== pred.gender) return { ok: false, reason: `for ${pred.gender} applicants` };
  if (pred.maxIncome !== undefined && (p.income ?? 0) > pred.maxIncome) return { ok: false, reason: `income must be ≤ ₹${pred.maxIncome.toLocaleString('en-IN')}` };
  if (pred.occupations && (!p.occupation || !pred.occupations.includes(p.occupation))) return { ok: false, reason: `for ${pred.occupations.join('/')}` };
  if (pred.categories && (!p.category || !pred.categories.includes(p.category))) return { ok: false, reason: `for ${pred.categories.join('/').toUpperCase()} category` };
  if (pred.area && p.area !== pred.area) return { ok: false, reason: `for ${pred.area} areas` };
  if (pred.requiresBPL && !p.bpl) return { ok: false, reason: 'requires a BPL ration card' };
  if (pred.requiresDisability && !p.disability) return { ok: false, reason: 'requires a disability certificate' };
  if (pred.requiresLandholding && !p.hasLandholding) return { ok: false, reason: 'requires agricultural landholding' };
  if (pred.requiresGirlChildUnder10 && !p.hasGirlChildUnder10) return { ok: false, reason: 'requires a girl child under 10' };
  if (pred.requiresWidow && !p.isWidow) return { ok: false, reason: 'for widows' };
  return { ok: true };
}

export function isEligible(scheme: Scheme, p: SchemeProfile): boolean {
  return checkPredicates(p, scheme.predicates).ok;
}

/** Count how many predicates fail (for near-miss ranking). */
function countFailedPredicates(p: SchemeProfile, pred: SchemePredicates): number {
  let n = 0;
  const single = (k: keyof SchemePredicates): boolean => {
    const sub: SchemePredicates = { [k]: pred[k] } as SchemePredicates;
    return !checkPredicates(p, sub).ok;
  };
  for (const k of Object.keys(pred) as (keyof SchemePredicates)[]) if (single(k)) n++;
  return n;
}

// ---------------------------------------------------------------------------
// Max-weight independent set (exact) for conflict resolution
// ---------------------------------------------------------------------------

export interface MwisItem { id: string; value: number; conflicts: Set<string> }

/** Exact maximum-weight independent set via recursive include/exclude (small N). */
export function maxWeightIndependentSet(items: MwisItem[]): { ids: string[]; total: number } {
  const byId = new Map(items.map((it) => [it.id, it]));
  let bestIds: string[] = [];
  let bestTotal = -1;

  const recurse = (idx: number, chosen: string[], chosenSet: Set<string>, total: number): void => {
    if (idx === items.length) {
      if (total > bestTotal) { bestTotal = total; bestIds = [...chosen]; }
      return;
    }
    const item = items[idx]!;
    // Option 1: skip it.
    recurse(idx + 1, chosen, chosenSet, total);
    // Option 2: take it, if no conflict with already-chosen.
    let conflict = false;
    for (const c of item.conflicts) if (chosenSet.has(c)) { conflict = true; break; }
    if (!conflict) {
      chosen.push(item.id); chosenSet.add(item.id);
      recurse(idx + 1, chosen, chosenSet, total + item.value);
      chosen.pop(); chosenSet.delete(item.id);
    }
    void byId;
  };
  recurse(0, [], new Set(), 0);
  return { ids: bestIds, total: bestTotal < 0 ? 0 : bestTotal };
}

/** Greedy benchmark: take highest-value first, skip anything that conflicts. */
export function greedyConflictResolve(items: MwisItem[]): { ids: string[]; total: number } {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const chosen: string[] = [];
  const chosenSet = new Set<string>();
  let total = 0;
  for (const it of sorted) {
    let conflict = false;
    for (const c of it.conflicts) if (chosenSet.has(c)) { conflict = true; break; }
    if (!conflict) { chosen.push(it.id); chosenSet.add(it.id); total += it.value; }
  }
  return { ids: chosen, total };
}

// ---------------------------------------------------------------------------
// Top-level analysis
// ---------------------------------------------------------------------------

export function analyzeSchemes(profile: SchemeProfile, dataset: Scheme[] = SCHEMES): SchemeAnalysis {
  const enrolled = new Set(profile.enrolled ?? []);
  const eligibleSchemes = dataset.filter((s) => isEligible(s, profile));

  // Build conflict graph over recurring + one-time (facilitation excluded from totals).
  const valued = eligibleSchemes.map((s) => ({ scheme: s, annualValue: Math.max(0, Math.round(s.quantify(profile))) }));

  // Resolve conflicts among ALL eligible schemes (one MWIS over the conflict graph).
  const mwisItems: MwisItem[] = valued.map((v) => ({
    id: v.scheme.id,
    value: v.annualValue,
    conflicts: new Set(v.scheme.conflictsWith ?? []),
  }));
  const optimal = maxWeightIndependentSet(mwisItems);
  const optimalIds = new Set(optimal.ids);
  const hasConflicts = valued.some((v) => (v.scheme.conflictsWith ?? []).some((c) => optimalIds.has(c) === false && eligibleSchemes.some((e) => e.id === c)));

  const eligible: EligibleScheme[] = valued.map((v) => ({
    scheme: v.scheme,
    annualValue: v.annualValue,
    inOptimalSet: optimalIds.has(v.scheme.id),
  })).sort((a, b) => b.annualValue - a.annualValue);

  const optimalSet = eligible.filter((e) => e.inOptimalSet && !enrolled.has(e.scheme.id));

  let totalAnnualBenefit = 0;
  let totalOneTimeBenefit = 0;
  const facilitationSchemes: EligibleScheme[] = [];
  for (const e of eligible) {
    if (e.scheme.benefitKind === 'facilitation') { facilitationSchemes.push(e); continue; }
    if (!e.inOptimalSet || enrolled.has(e.scheme.id)) continue;
    if (e.scheme.benefitKind === 'recurring') totalAnnualBenefit += e.annualValue;
    else totalOneTimeBenefit += e.annualValue;
  }

  // Near-misses: ineligible schemes that fail exactly one predicate.
  const nearMisses: NearMiss[] = [];
  for (const s of dataset) {
    if (isEligible(s, profile)) continue;
    if (countFailedPredicates(profile, s.predicates) === 1) {
      const reason = checkPredicates(profile, s.predicates).reason ?? 'one criterion not met';
      nearMisses.push({ scheme: s, reason });
    }
  }
  nearMisses.sort((a, b) => b.scheme.quantify(profile) - a.scheme.quantify(profile));

  return {
    eligible,
    optimalSet,
    totalAnnualBenefit,
    totalOneTimeBenefit,
    facilitationSchemes,
    nearMisses: nearMisses.slice(0, 6),
    conflictsResolved: hasConflicts,
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_SCHEME_PROFILE: SchemeProfile = {
  age: 35,
  gender: 'male',
  income: 250000,
  occupation: 'farmer',
  state: 'Uttar Pradesh',
  category: 'obc',
  area: 'rural',
  hasLandholding: true,
  disability: false,
  bpl: true,
  hasGirlChildUnder10: false,
  isWidow: false,
  enrolled: [],
};
