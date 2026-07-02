/**
 * Real Return Checker — the engine behind India's first purpose-built
 * mis-selling exposer.
 *
 * Agents pitch money-back policies, endowment plans, and "double your money"
 * schemes using totals ("pay 6 lakh, get 14 lakh!"). The only honest measure
 * of such an offer is its internal rate of return (XIRR) — the single annual
 * rate that makes all the cash flows balance. This module computes it exactly
 * and puts it next to boring benchmarks everyone understands (savings, FD,
 * PPF, inflation, index funds).
 *
 * Everything here is pure and browser-safe: no network, no storage. Inputs
 * never leave the user's device.
 */

export interface CashFlow {
  /** Years from the first payment (0 = today). Fractions allowed. */
  t: number;
  /** Negative = you pay, positive = you receive. */
  amount: number;
}

export interface Moneyback {
  year: number;
  amount: number;
}

export type OfferMode = 'lumpsum' | 'endowment' | 'moneyback';

export interface OfferInput {
  mode: OfferMode;
  /** lumpsum: one-time amount paid today. */
  lumpsumPaid: number;
  /** endowment / moneyback: payment per year and number of paying years. */
  annualPayment: number;
  payingYears: number;
  /** Year the final maturity amount lands (from start). */
  maturityYear: number;
  /** Final amount received at maturityYear. */
  maturityAmount: number;
  /** moneyback: intermediate payouts. */
  moneybacks: Moneyback[];
}

export interface Benchmark {
  name: string;
  ratePct: number;
  /** What the same payments would grow to by the horizon at this rate. */
  futureValue: number;
  note: string;
}

export type VerdictBand =
  | 'invalid'
  | 'loss'
  | 'below-savings'
  | 'below-inflation'
  | 'below-ppf'
  | 'moderate'
  | 'competitive'
  | 'too-good';

export interface Verdict {
  band: VerdictBand;
  title: string;
  message: string;
}

export interface RealReturnResult {
  valid: boolean;
  /** Annualised real return of the offer (XIRR), in percent. */
  irrPct: number | null;
  totalPaid: number;
  totalReceived: number;
  /** totalReceived / totalPaid — the number agents quote. */
  multiple: number;
  horizonYears: number;
  /** Years to double at this return (null when return <= 0). */
  doublingYears: number | null;
  /** What all the money you receive is worth in today's rupees at INFLATION_PCT. */
  receivedTodayValue: number;
  benchmarks: Benchmark[];
  verdict: Verdict;
  redFlags: string[];
  assumptions: string[];
}

export const INFLATION_PCT = 6.0;
export const SAVINGS_PCT = 3.0;
export const FD_PCT = 6.5;
export const PPF_PCT = 7.1;
export const EQUITY_PCT = 12.0;

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function npv(flows: readonly CashFlow[], rate: number): number {
  let total = 0;
  for (const flow of flows) {
    total += flow.amount / Math.pow(1 + rate, flow.t);
  }
  return total;
}

function npvDerivative(flows: readonly CashFlow[], rate: number): number {
  let total = 0;
  for (const flow of flows) {
    if (flow.t === 0) continue;
    total += (-flow.t * flow.amount) / Math.pow(1 + rate, flow.t + 1);
  }
  return total;
}

/**
 * Annualised internal rate of return for a set of dated cash flows.
 * Newton-Raphson with a bisection fallback; null when no meaningful rate
 * exists (all flows one-signed, or no sign change in the search range).
 */
export function irr(flows: readonly CashFlow[]): number | null {
  const hasNegative = flows.some((f) => f.amount < 0);
  const hasPositive = flows.some((f) => f.amount > 0);
  if (!hasNegative || !hasPositive || flows.length < 2) return null;

  // Newton-Raphson from a sensible starting guess.
  let rate = 0.08;
  for (let i = 0; i < 100; i++) {
    const value = npv(flows, rate);
    if (Math.abs(value) < 1e-9) return rate;
    const slope = npvDerivative(flows, rate);
    if (!Number.isFinite(slope) || Math.abs(slope) < 1e-12) break;
    const next = rate - value / slope;
    if (!Number.isFinite(next) || next <= -0.999) break;
    if (Math.abs(next - rate) < 1e-11) return next;
    rate = next;
  }

  // Bisection fallback: scan for a sign change, then narrow it down.
  let lo = -0.95;
  let hi = -0.95;
  let loVal = npv(flows, lo);
  let found = false;
  for (let r = -0.9; r <= 10.0001; r += 0.05) {
    const value = npv(flows, r);
    if ((loVal < 0 && value > 0) || (loVal > 0 && value < 0)) {
      hi = r;
      found = true;
      break;
    }
    lo = r;
    loVal = value;
  }
  if (!found) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const value = npv(flows, mid);
    if (Math.abs(value) < 1e-9 || (hi - lo) / 2 < 1e-11) return mid;
    if ((value < 0) === (loVal < 0)) {
      lo = mid;
      loVal = value;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/** Build the dated cash flows an offer describes. Payments land at the START of each year. */
export function buildFlows(input: OfferInput): CashFlow[] {
  const flows: CashFlow[] = [];
  if (input.mode === 'lumpsum') {
    if (input.lumpsumPaid > 0) flows.push({ t: 0, amount: -input.lumpsumPaid });
  } else {
    for (let y = 0; y < input.payingYears; y++) {
      if (input.annualPayment > 0) flows.push({ t: y, amount: -input.annualPayment });
    }
  }
  if (input.mode === 'moneyback') {
    for (const mb of input.moneybacks) {
      if (mb.amount > 0 && mb.year > 0) flows.push({ t: mb.year, amount: mb.amount });
    }
  }
  if (input.maturityAmount > 0) flows.push({ t: input.maturityYear, amount: input.maturityAmount });
  return flows;
}

/** Future value, at the horizon, of investing the offer's payments at `ratePct` instead. */
export function futureValueOfPayments(flows: readonly CashFlow[], ratePct: number, horizonYears: number): number {
  const rate = ratePct / 100;
  let total = 0;
  for (const flow of flows) {
    if (flow.amount >= 0) continue;
    total += -flow.amount * Math.pow(1 + rate, horizonYears - flow.t);
  }
  return total;
}

function verdictFor(irrPct: number | null): Verdict {
  if (irrPct === null) {
    return {
      band: 'invalid',
      title: 'Could not compute a return',
      message: 'These numbers do not describe a complete offer. Check that you entered what you pay and what you get back.',
    };
  }
  if (irrPct < 0) {
    return {
      band: 'loss',
      title: 'You get back less than you pay',
      message: 'This is a guaranteed loss, not an investment. Any "benefit" here is coming from something other than returns.',
    };
  }
  if (irrPct < SAVINGS_PCT) {
    return {
      band: 'below-savings',
      title: 'Worse than a savings account',
      message: `A plain savings account (~${SAVINGS_PCT}%) beats this offer. Locking money up for years at this rate needs a very good non-financial reason.`,
    };
  }
  if (irrPct < INFLATION_PCT) {
    return {
      band: 'below-inflation',
      title: 'Below inflation — your money loses buying power',
      message: `At ~${INFLATION_PCT}% inflation, this return means the money you get back buys less than the money you put in. The rupee amount grows; its value does not.`,
    };
  }
  if (irrPct < PPF_PCT) {
    return {
      band: 'below-ppf',
      title: 'PPF beats this — government-guaranteed and tax-free',
      message: `PPF currently pays ${PPF_PCT}% tax-free with a sovereign guarantee. An offer below that needs a strong justification, like genuine insurance cover you actually need.`,
    };
  }
  if (irrPct < 9) {
    return {
      band: 'moderate',
      title: 'Moderate return — read the lock-in and guarantee terms',
      message: 'This is in fixed-income territory. Check what is guaranteed versus "projected", what the surrender penalty is, and how long your money is locked.',
    };
  }
  if (irrPct < 15) {
    return {
      band: 'competitive',
      title: 'Competitive — IF these numbers are guaranteed',
      message: 'This beats most fixed-income options. Insist on seeing which figures are contractually guaranteed and which are marketing "projections at 8%". Projections are not promises.',
    };
  }
  return {
    band: 'too-good',
    title: 'Too good to be true?',
    message: 'Legitimate guaranteed returns in India rarely exceed ~9%. "Guaranteed" returns at this level are the classic pattern of chit fraud, Ponzi schemes, and MLM pitches. Check RBI/SEBI registration before paying anyone.',
  };
}

function buildRedFlags(input: OfferInput, irrPct: number | null, horizonYears: number): string[] {
  const flags: string[] = [];
  if (irrPct === null) return flags;

  if (input.mode !== 'lumpsum' && irrPct < PPF_PCT && horizonYears >= 10) {
    flags.push(
      'Long lock-in with a sub-PPF return is the signature of traditional endowment and money-back policies. Commissions on these can be 25% or more of your first-year payment, which is why they are pushed so hard.'
    );
    flags.push(
      'If the pitch bundles insurance: check the actual life cover. A pure term plan often gives 10 to 20 times more cover for a fraction of the cost, leaving the rest free to earn market returns.'
    );
  }
  if (irrPct >= 15) {
    flags.push(
      'Ask one question: WHO guarantees this return, and are they regulated by RBI, SEBI, or IRDAI? If the answer involves "the company" or "the community", treat it as unsafe.'
    );
    flags.push('Classic fraud tells: pressure to decide today, returns paid from new members joining, no written contract, payouts in cash.');
  }
  if (input.mode === 'moneyback') {
    flags.push(
      'Money-back payouts feel like gifts but they are your own premium coming back to you slowly. The IRR above already accounts for their timing — that IS the real return including every payout.'
    );
  }
  if (irrPct >= 0 && irrPct < INFLATION_PCT) {
    flags.push('"Your money is safe" is not the same as "your money grows". Below inflation, safety is an illusion — the loss is just invisible.');
  }
  return flags;
}

export function analyzeOffer(input: OfferInput): RealReturnResult {
  const flows = buildFlows(input);
  const totalPaid = flows.filter((f) => f.amount < 0).reduce((sum, f) => sum - f.amount, 0);
  const totalReceived = flows.filter((f) => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);
  const horizonYears = flows.reduce((max, f) => Math.max(max, f.t), 0);
  const valid = totalPaid > 0 && totalReceived > 0 && horizonYears > 0;

  const rate = valid ? irr(flows) : null;
  const irrPct = rate === null ? null : round2(rate * 100);

  const doublingYears = rate !== null && rate > 0 ? round2(Math.log(2) / Math.log(1 + rate)) : null;

  const inflationRate = INFLATION_PCT / 100;
  const receivedTodayValue = round2(
    flows.filter((f) => f.amount > 0).reduce((sum, f) => sum + f.amount / Math.pow(1 + inflationRate, f.t), 0)
  );

  const benchmarkDefs: Array<{ name: string; ratePct: number; note: string }> = [
    { name: 'Savings account', ratePct: SAVINGS_PCT, note: 'Fully liquid, no lock-in' },
    { name: 'Bank FD', ratePct: FD_PCT, note: 'Typical large-bank rate, interest taxable' },
    { name: 'PPF', ratePct: PPF_PCT, note: 'Government-guaranteed, completely tax-free' },
    { name: 'Inflation', ratePct: INFLATION_PCT, note: 'The bar just to preserve buying power' },
    { name: 'Nifty index fund (long-run avg)', ratePct: EQUITY_PCT, note: 'Market-linked, volatile, not guaranteed' },
  ];
  const benchmarks: Benchmark[] = benchmarkDefs.map((b) => ({
    ...b,
    futureValue: round2(futureValueOfPayments(flows, b.ratePct, horizonYears)),
  }));

  return {
    valid,
    irrPct,
    totalPaid: round2(totalPaid),
    totalReceived: round2(totalReceived),
    multiple: totalPaid > 0 ? round2(totalReceived / totalPaid) : 0,
    horizonYears,
    doublingYears,
    receivedTodayValue,
    benchmarks,
    verdict: verdictFor(valid ? irrPct : null),
    redFlags: buildRedFlags(input, valid ? irrPct : null, horizonYears),
    assumptions: [
      'Payments are treated as made at the start of each year; payouts at the stated year-end.',
      `Inflation assumed at ${INFLATION_PCT}% for buying-power figures; benchmark rates are indicative and change over time.`,
      'Money-back payouts are assumed spent or held, not reinvested; the IRR fully accounts for their timing either way.',
      'This is education, not advice: we show the mathematics of the offer you typed in. Verify guaranteed figures from the official policy document, not the sales illustration.',
    ],
  };
}

export const DEFAULT_OFFER: OfferInput = {
  mode: 'endowment',
  lumpsumPaid: 100000,
  annualPayment: 50000,
  payingYears: 15,
  maturityYear: 20,
  maturityAmount: 1400000,
  moneybacks: [],
};
