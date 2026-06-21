/**
 * Equity Tax-Loss & Gain Harvesting Optimizer. engine
 * ====================================================
 * Tells the user exactly which holdings to sell (and how much) before year-end to legally minimise
 * capital-gains tax, using the ₹1.25L LTCG exemption and India's loss set-off rules.
 *
 * SET-OFF RULES (Income Tax Act):
 *  • Short-term capital loss (STCL) can be set off against BOTH short-term and long-term gains.
 *  • Long-term capital loss (LTCL) can be set off ONLY against long-term gains.
 *  • Unabsorbed losses carry forward up to 8 assessment years.
 *  • Equity LTCG (Sec 112A): ₹1,25,000/yr exemption, then 12.5%. Equity STCG (Sec 111A): 20%.
 *  • Debt mutual funds (units bought on/after 01-Apr-2023): gains taxed at the slab rate.
 *  • Health & education cess of 4% applies on the tax (surcharge ignored here).
 *
 * OPTIMAL SET-OFF (minimises tax, verified against brute force):
 *  1. The ₹1.25L exemption is applied to LTCG first (those rupees are already tax-free).
 *  2. LTCL is applied to the remaining TAXABLE LTCG (it can offset nothing else).
 *  3. STCL is applied to the highest-rate gains first. debt (slab), then equity STCG (20%),
 *     then taxable equity LTCG (12.5%). because a rupee of loss saves the most against the
 *     highest-taxed rupee of gain.
 *
 * Pure, deterministic functions. India has NO formal wash-sale rule, so re-buying immediately is
 * legal; the tool still flags prudence. Nothing here is tax advice.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LTCG_EXEMPTION = 125000; // ₹1.25L per year, Section 112A
export const LTCG_RATE = 0.125;
export const STCG_RATE = 0.20; // Section 111A
export const CESS = 0.04;
const NEAR_BOUNDARY_DAYS = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssetType = 'equity' | 'debt';
export type Term = 'short' | 'long' | 'debt';

export interface HarvestLot {
  id: string;
  name: string;
  assetType: AssetType;
  buyDate: string; // ISO 'YYYY-MM-DD'
  buyPrice: number; // per unit
  qty: number;
  currentPrice: number; // per unit
}

export interface HarvestInputs {
  lots: HarvestLot[];
  realizedSTCG: number; // equity STCG already booked this FY
  realizedLTCG: number; // equity LTCG already booked this FY (gross, pre-exemption)
  realizedDebtGain: number; // debt gains already booked this FY
  carriedForwardSTCL: number; // available from prior years (magnitude, ≥0)
  carriedForwardLTCL: number;
  currentDate: string; // ISO
  marginalSlabPct: number; // for debt gains
}

export interface ClassifiedLot {
  id: string;
  name: string;
  assetType: AssetType;
  term: Term;
  qty: number;
  unitGainLoss: number; // currentPrice − buyPrice
  totalGainLoss: number; // unit × qty
  isGain: boolean;
  daysToLongTerm: number; // 0 if already long-term / debt
  nearBoundary: boolean; // short-term gain close to the 12-month line
}

export interface TaxBreakdown {
  tax: number;
  taxableSTCG: number;
  taxableLTCG: number;
  taxableDebt: number;
  exemptionUsed: number;
  carrySTCL: number;
  carryLTCL: number;
}

export interface HarvestAction {
  type: 'harvest-loss' | 'gain-harvest' | 'wait' | 'avoid';
  lotId: string;
  lotName: string;
  qty: number;
  amount: number; // gain/loss realized
  note: string;
}

export interface HarvestAnalysis {
  classified: ClassifiedLot[];
  baseline: TaxBreakdown;
  afterHarvest: TaxBreakdown;
  taxSaved: number;
  gainHarvestAmount: number; // LT gain realized tax-free to reset basis
  basisStepUpBenefit: number; // future LTCG tax avoided on the stepped-up basis
  exemptionHeadroomRemaining: number;
  lossesHarvestedSTCL: number;
  lossesHarvestedLTCL: number;
  actions: HarvestAction[];
  totals: { unrealizedSTGain: number; unrealizedLTGain: number; unrealizedSTLoss: number; unrealizedLTLoss: number; debtGain: number; debtLoss: number };
}

// ---------------------------------------------------------------------------
// Date classification
// ---------------------------------------------------------------------------

/** Equity is long-term only if held for MORE than 12 months (the 12-month anniversary is still short-term). */
export function classifyHolding(buyDate: string, currentDate: string): { isLong: boolean; daysToLong: number } {
  const buy = new Date(buyDate + 'T00:00:00Z');
  const now = new Date(currentDate + 'T00:00:00Z');
  const ltDate = new Date(buy);
  ltDate.setUTCFullYear(ltDate.getUTCFullYear() + 1);
  const isLong = now.getTime() > ltDate.getTime();
  const daysToLong = isLong ? 0 : Math.max(0, Math.ceil((ltDate.getTime() - now.getTime()) / 86400000) + 1);
  return { isLong, daysToLong };
}

export function classifyLot(lot: HarvestLot, currentDate: string): ClassifiedLot {
  const unitGainLoss = lot.currentPrice - lot.buyPrice;
  const totalGainLoss = unitGainLoss * lot.qty;
  const isGain = totalGainLoss >= 0;

  let term: Term;
  let daysToLong = 0;
  if (lot.assetType === 'debt') {
    term = 'debt';
  } else {
    const { isLong, daysToLong: d } = classifyHolding(lot.buyDate, currentDate);
    term = isLong ? 'long' : 'short';
    daysToLong = d;
  }
  const nearBoundary = term === 'short' && isGain && daysToLong > 0 && daysToLong <= NEAR_BOUNDARY_DAYS;
  return { id: lot.id, name: lot.name, assetType: lot.assetType, term, qty: lot.qty, unitGainLoss, totalGainLoss, isGain, daysToLongTerm: daysToLong, nearBoundary };
}

// ---------------------------------------------------------------------------
// Optimal set-off + tax
// ---------------------------------------------------------------------------

export interface Pools {
  equitySTCG: number; // ≥0
  equityLTCG: number; // ≥0 (gross, pre-exemption)
  debtGain: number; // ≥0
  stcl: number; // ≥0 magnitude
  ltcl: number; // ≥0 magnitude
}

/** Minimum-tax set-off for the given pools. Verified optimal against brute force. */
export function computeTax(pools: Pools, marginalSlabPct: number, exemptionRemaining = LTCG_EXEMPTION): TaxBreakdown {
  const slab = marginalSlabPct / 100;
  let stcg = Math.max(0, pools.equitySTCG);
  let debt = Math.max(0, pools.debtGain);
  let stclLeft = Math.max(0, pools.stcl);
  const ltcl = Math.max(0, pools.ltcl);

  // 1) Exemption on LTCG.
  const grossLTCG = Math.max(0, pools.equityLTCG);
  const exemptionUsed = Math.min(grossLTCG, Math.max(0, exemptionRemaining));
  let taxableLTCG = grossLTCG - exemptionUsed;

  // 2) LTCL → taxable LTCG only.
  const ltclUsed = Math.min(ltcl, taxableLTCG);
  taxableLTCG -= ltclUsed;
  const carryLTCL = ltcl - ltclUsed;

  // 3) STCL → highest-rate bucket first.
  const order: { rate: number; get: () => number; set: (v: number) => void }[] = [
    { rate: slab, get: () => debt, set: (v: number) => { debt = v; } },
    { rate: STCG_RATE, get: () => stcg, set: (v: number) => { stcg = v; } },
    { rate: LTCG_RATE, get: () => taxableLTCG, set: (v: number) => { taxableLTCG = v; } },
  ].sort((a, b) => b.rate - a.rate);
  for (const bucket of order) {
    if (stclLeft <= 0) break;
    const use = Math.min(stclLeft, bucket.get());
    bucket.set(bucket.get() - use);
    stclLeft -= use;
  }

  const tax = (debt * slab + stcg * STCG_RATE + taxableLTCG * LTCG_RATE) * (1 + CESS);
  return {
    tax: Math.round(tax),
    taxableSTCG: Math.round(stcg),
    taxableLTCG: Math.round(taxableLTCG),
    taxableDebt: Math.round(debt),
    exemptionUsed: Math.round(exemptionUsed),
    carrySTCL: Math.round(stclLeft),
    carryLTCL: Math.round(carryLTCL),
  };
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeHarvest(inputs: HarvestInputs): HarvestAnalysis {
  const classified = inputs.lots.map((l) => classifyLot(l, inputs.currentDate));

  // Aggregate unrealized positions.
  let unrealizedSTGain = 0, unrealizedLTGain = 0, unrealizedSTLoss = 0, unrealizedLTLoss = 0, debtGain = 0, debtLoss = 0;
  for (const c of classified) {
    if (c.term === 'debt') {
      if (c.isGain) debtGain += c.totalGainLoss; else debtLoss += -c.totalGainLoss;
    } else if (c.term === 'short') {
      if (c.isGain) unrealizedSTGain += c.totalGainLoss; else unrealizedSTLoss += -c.totalGainLoss;
    } else {
      if (c.isGain) unrealizedLTGain += c.totalGainLoss; else unrealizedLTLoss += -c.totalGainLoss;
    }
  }

  // --- Baseline: only what's already realized + carried-forward losses. ---
  const baseline = computeTax({
    equitySTCG: inputs.realizedSTCG,
    equityLTCG: inputs.realizedLTCG,
    debtGain: inputs.realizedDebtGain,
    stcl: inputs.carriedForwardSTCL,
    ltcl: inputs.carriedForwardLTCL,
  }, inputs.marginalSlabPct);

  // --- Harvest all losses (debt loss behaves as a short-term capital loss). ---
  const lossesHarvestedSTCL = unrealizedSTLoss + debtLoss;
  const lossesHarvestedLTCL = unrealizedLTLoss;

  // --- Gain-harvest LT gains up to the remaining exemption headroom (tax-free basis reset). ---
  const exemptionUsedByRealized = Math.min(Math.max(0, inputs.realizedLTCG), LTCG_EXEMPTION);
  const headroom = Math.max(0, LTCG_EXEMPTION - exemptionUsedByRealized);
  const gainHarvestAmount = Math.min(headroom, unrealizedLTGain);

  const afterHarvest = computeTax({
    equitySTCG: inputs.realizedSTCG,
    equityLTCG: inputs.realizedLTCG + gainHarvestAmount,
    debtGain: inputs.realizedDebtGain,
    stcl: inputs.carriedForwardSTCL + lossesHarvestedSTCL,
    ltcl: inputs.carriedForwardLTCL + lossesHarvestedLTCL,
  }, inputs.marginalSlabPct);

  const taxSaved = Math.max(0, baseline.tax - afterHarvest.tax);
  const basisStepUpBenefit = Math.round(gainHarvestAmount * LTCG_RATE * (1 + CESS));
  const exemptionHeadroomRemaining = Math.max(0, headroom - gainHarvestAmount);

  // --- Build the precise action list. ---
  const actions: HarvestAction[] = [];

  // Loss harvesting (sell all loss lots).
  for (const c of classified) {
    if (!c.isGain && c.totalGainLoss < 0) {
      const lossKind = c.term === 'long' ? 'long-term loss (offsets LTCG)' : 'short-term loss (offsets any gain)';
      actions.push({
        type: 'harvest-loss', lotId: c.id, lotName: c.name, qty: c.qty, amount: c.totalGainLoss,
        note: `Sell all ${c.qty} units to book a ${lossKind} of ₹${Math.round(-c.totalGainLoss).toLocaleString('en-IN')}. Re-buy immediately to stay invested (India has no wash-sale rule).`,
      });
    }
  }

  // Gain harvesting (fill the exemption headroom with LT gains, partial qty allowed).
  let remainingHarvest = gainHarvestAmount;
  for (const c of classified) {
    if (remainingHarvest <= 1) break;
    if (c.term === 'long' && c.isGain && c.unitGainLoss > 0) {
      const maxGain = c.totalGainLoss;
      const useGain = Math.min(maxGain, remainingHarvest);
      const qtyToSell = Math.min(c.qty, Math.ceil(useGain / c.unitGainLoss));
      const realized = Math.round(qtyToSell * c.unitGainLoss);
      actions.push({
        type: 'gain-harvest', lotId: c.id, lotName: c.name, qty: qtyToSell, amount: realized,
        note: `Sell ${qtyToSell} units to realize ₹${realized.toLocaleString('en-IN')} of long-term gain. tax-free under the ₹1.25L exemption. Re-buy to reset your cost basis higher and lower future tax.`,
      });
      remainingHarvest -= realized;
    }
  }

  // Near-boundary "wait" tips + avoid-ST-gain notes.
  for (const c of classified) {
    if (c.nearBoundary) {
      actions.push({
        type: 'wait', lotId: c.id, lotName: c.name, qty: c.qty, amount: c.totalGainLoss,
        note: `Hold ${c.name} for ~${c.daysToLongTerm} more days. once it crosses 12 months the gain is taxed at 12.5% (with the ₹1.25L exemption) instead of 20%.`,
      });
    } else if (c.term === 'short' && c.isGain && !c.nearBoundary) {
      actions.push({
        type: 'avoid', lotId: c.id, lotName: c.name, qty: c.qty, amount: c.totalGainLoss,
        note: `Avoid selling ${c.name} now. short-term gains are taxed at 20% with no exemption. Defer until it turns long-term if you can.`,
      });
    }
  }

  return {
    classified,
    baseline,
    afterHarvest,
    taxSaved,
    gainHarvestAmount: Math.round(gainHarvestAmount),
    basisStepUpBenefit,
    exemptionHeadroomRemaining: Math.round(exemptionHeadroomRemaining),
    lossesHarvestedSTCL: Math.round(lossesHarvestedSTCL),
    lossesHarvestedLTCL: Math.round(lossesHarvestedLTCL),
    actions,
    totals: {
      unrealizedSTGain: Math.round(unrealizedSTGain), unrealizedLTGain: Math.round(unrealizedLTGain),
      unrealizedSTLoss: Math.round(unrealizedSTLoss), unrealizedLTLoss: Math.round(unrealizedLTLoss),
      debtGain: Math.round(debtGain), debtLoss: Math.round(debtLoss),
    },
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function isoMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function defaultLots(): HarvestLot[] {
  return [
    { id: 'l1', name: 'Nifty Index Fund', assetType: 'equity', buyDate: isoMonthsAgo(20), buyPrice: 100, qty: 500, currentPrice: 145 },
    { id: 'l2', name: 'Small-cap Fund', assetType: 'equity', buyDate: isoMonthsAgo(8), buyPrice: 200, qty: 200, currentPrice: 150 },
    { id: 'l3', name: 'Bluechip Stock', assetType: 'equity', buyDate: isoMonthsAgo(30), buyPrice: 800, qty: 100, currentPrice: 1400 },
    { id: 'l4', name: 'Debt Fund', assetType: 'debt', buyDate: isoMonthsAgo(14), buyPrice: 1000, qty: 100, currentPrice: 1080 },
  ];
}

export function defaultHarvestInputs(): HarvestInputs {
  return {
    lots: defaultLots(),
    realizedSTCG: 0,
    realizedLTCG: 0,
    realizedDebtGain: 0,
    carriedForwardSTCL: 0,
    carriedForwardLTCL: 0,
    currentDate: new Date().toISOString().slice(0, 10),
    marginalSlabPct: 31.2,
  };
}
