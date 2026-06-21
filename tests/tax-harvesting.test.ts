/**
 * Equity Tax-Loss & Gain Harvesting Optimizer — test suite (26 cases incl. brute force)
 * Run: npx ts-node --project tsconfig.scripts.json tests/tax-harvesting.test.ts
 */

import {
  type HarvestInputs,
  type HarvestLot,
  type Pools,
  LTCG_EXEMPTION,
  classifyHolding,
  classifyLot,
  computeTax,
  analyzeHarvest,
} from '../src/lib/tax-harvesting';

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; console.log(`  \u2713 ${msg}`); }
  else { failed++; console.error(`  \u2717 ${msg}`); }
}
function test(name: string, fn: () => void): void { console.log(`\n${name}`); fn(); }

// Brute-force minimum tax over all loss allocations (grid), to verify the greedy set-off.
function bruteForceTax(pools: Pools, slabPct: number, step = 5000): number {
  const slab = slabPct / 100;
  const grossLTCG = pools.equityLTCG;
  const exempt = Math.min(grossLTCG, LTCG_EXEMPTION);
  const taxableLTCG0 = grossLTCG - exempt;
  let best = Infinity;
  for (let lUse = 0; lUse <= Math.min(pools.ltcl, taxableLTCG0); lUse += step) {
    const ltcgAfterL = taxableLTCG0 - lUse;
    for (let sD = 0; sD <= Math.min(pools.stcl, pools.debtGain); sD += step) {
      for (let sS = 0; sS <= Math.min(pools.stcl - sD, pools.equitySTCG); sS += step) {
        const sL = Math.min(pools.stcl - sD - sS, ltcgAfterL);
        const debt = pools.debtGain - sD;
        const stcg = pools.equitySTCG - sS;
        const ltcg = ltcgAfterL - sL;
        const tax = (debt * slab + stcg * 0.20 + ltcg * 0.125) * 1.04;
        if (tax < best) best = tax;
      }
    }
  }
  return Math.round(best);
}

function lot(over: Partial<HarvestLot>): HarvestLot {
  return { id: over.id ?? 'l', name: over.name ?? 'Lot', assetType: over.assetType ?? 'equity', buyDate: over.buyDate ?? '2023-01-01', buyPrice: over.buyPrice ?? 100, qty: over.qty ?? 100, currentPrice: over.currentPrice ?? 120 };
}
function inputs(over: Partial<HarvestInputs>): HarvestInputs {
  return { lots: over.lots ?? [], realizedSTCG: over.realizedSTCG ?? 0, realizedLTCG: over.realizedLTCG ?? 0, realizedDebtGain: over.realizedDebtGain ?? 0, carriedForwardSTCL: over.carriedForwardSTCL ?? 0, carriedForwardLTCL: over.carriedForwardLTCL ?? 0, currentDate: over.currentDate ?? '2026-01-15', marginalSlabPct: over.marginalSlabPct ?? 31.2 };
}

// ---------------------------------------------------------------------------

test('1. Holding classification: 12-month anniversary is still short-term; the next day is long-term', () => {
  assert(classifyHolding('2024-06-21', '2025-06-21').isLong === false, 'exactly 12 months → short-term');
  assert(classifyHolding('2024-06-21', '2025-06-22').isLong === true, '12 months + 1 day → long-term');
  assert(classifyHolding('2020-01-01', '2026-01-01').isLong === true, '6 years → long-term');
});

test('2. daysToLong is positive for short-term and zero for long-term', () => {
  const st = classifyHolding('2025-12-01', '2026-01-15');
  assert(!st.isLong && st.daysToLong > 0, `short-term, ${st.daysToLong} days to long`);
  assert(classifyHolding('2020-01-01', '2026-01-15').daysToLong === 0, 'long-term → 0 days');
});

test('3. Lot classification: gain/loss and term', () => {
  const g = classifyLot(lot({ buyPrice: 100, currentPrice: 150, qty: 10, buyDate: '2023-01-01' }), '2026-01-15');
  assert(g.isGain && g.term === 'long' && g.totalGainLoss === 500, 'LT gain ₹500');
  const l = classifyLot(lot({ buyPrice: 200, currentPrice: 150, qty: 10, buyDate: '2025-10-01' }), '2026-01-15');
  assert(!l.isGain && l.term === 'short' && l.totalGainLoss === -500, 'ST loss ₹500');
  const d = classifyLot(lot({ assetType: 'debt', buyPrice: 100, currentPrice: 110, qty: 10 }), '2026-01-15');
  assert(d.term === 'debt', 'debt classified as debt');
});

test('4. computeTax: pure LTCG under ₹1.25L is fully exempt (zero tax)', () => {
  const t = computeTax({ equitySTCG: 0, equityLTCG: 100000, debtGain: 0, stcl: 0, ltcl: 0 }, 31.2);
  assert(t.tax === 0, 'LTCG ₹1L → ₹0 tax');
  assert(t.exemptionUsed === 100000, 'exemption used = 1L');
});

test('5. computeTax: exemption is never exceeded', () => {
  const t = computeTax({ equitySTCG: 0, equityLTCG: 500000, debtGain: 0, stcl: 0, ltcl: 0 }, 31.2);
  assert(t.exemptionUsed === LTCG_EXEMPTION, `exemption capped at ₹1.25L (got ${t.exemptionUsed})`);
  assert(t.taxableLTCG === 500000 - LTCG_EXEMPTION, 'taxable LTCG = gross − exemption');
});

test('6. computeTax: LTCG above exemption taxed at 12.5% + 4% cess', () => {
  const t = computeTax({ equitySTCG: 0, equityLTCG: 325000, debtGain: 0, stcl: 0, ltcl: 0 }, 31.2);
  // taxable = 200000 → 200000 × 0.125 × 1.04 = 26000
  assert(t.tax === 26000, `tax ₹${t.tax} == ₹26,000`);
});

test('7. computeTax: STCG taxed at 20% + cess', () => {
  const t = computeTax({ equitySTCG: 100000, equityLTCG: 0, debtGain: 0, stcl: 0, ltcl: 0 }, 31.2);
  assert(t.tax === Math.round(100000 * 0.20 * 1.04), `STCG tax ₹${t.tax} == ₹20,800`);
});

test('8. LTCL offsets only LTCG, never STCG', () => {
  const t = computeTax({ equitySTCG: 200000, equityLTCG: 0, debtGain: 0, stcl: 0, ltcl: 100000 }, 31.2);
  assert(t.taxableSTCG === 200000, 'LTCL cannot reduce STCG');
  assert(t.carryLTCL === 100000, 'LTCL carried forward (no LTCG to absorb it)');
});

test('9. STCL prefers the higher-rate bucket (STCG 20% before taxable LTCG 12.5%)', () => {
  const t = computeTax({ equitySTCG: 100000, equityLTCG: 325000, debtGain: 0, stcl: 100000, ltcl: 0 }, 31.2);
  assert(t.taxableSTCG === 0, 'STCL wiped out the 20% STCG first');
  assert(t.taxableLTCG === 200000, 'taxable LTCG untouched by STCL');
});

test('10. STCL prefers debt (slab 31.2%) over equity STCG (20%)', () => {
  const t = computeTax({ equitySTCG: 100000, equityLTCG: 0, debtGain: 100000, stcl: 100000, ltcl: 0 }, 31.2);
  assert(t.taxableDebt === 0, 'STCL cleared the slab-taxed debt gain first');
  assert(t.taxableSTCG === 100000, 'STCG left intact (lower rate)');
});

test('11. Greedy set-off == brute-force minimum (case A)', () => {
  const p: Pools = { equitySTCG: 100000, equityLTCG: 325000, debtGain: 50000, stcl: 120000, ltcl: 80000 };
  assert(computeTax(p, 31.2).tax === bruteForceTax(p, 31.2), `greedy ${computeTax(p, 31.2).tax} == brute ${bruteForceTax(p, 31.2)}`);
});

test('12. Greedy set-off == brute-force minimum (case B: debt-heavy)', () => {
  const p: Pools = { equitySTCG: 50000, equityLTCG: 200000, debtGain: 150000, stcl: 100000, ltcl: 50000 };
  assert(computeTax(p, 30).tax === bruteForceTax(p, 30), `greedy ${computeTax(p, 30).tax} == brute ${bruteForceTax(p, 30)}`);
});

test('13. Greedy set-off == brute-force minimum (case C: low slab)', () => {
  const p: Pools = { equitySTCG: 100000, equityLTCG: 300000, debtGain: 100000, stcl: 150000, ltcl: 100000 };
  assert(computeTax(p, 10.4).tax === bruteForceTax(p, 10.4), `greedy ${computeTax(p, 10.4).tax} == brute ${bruteForceTax(p, 10.4)}`);
});

test('14. Greedy set-off == brute-force minimum (case D: no losses)', () => {
  const p: Pools = { equitySTCG: 75000, equityLTCG: 250000, debtGain: 25000, stcl: 0, ltcl: 0 };
  assert(computeTax(p, 31.2).tax === bruteForceTax(p, 31.2), 'matches with no losses');
});

test('15. Greedy set-off == brute-force minimum (case E: losses exceed gains)', () => {
  const p: Pools = { equitySTCG: 50000, equityLTCG: 175000, debtGain: 0, stcl: 200000, ltcl: 150000 };
  assert(computeTax(p, 31.2).tax === bruteForceTax(p, 31.2), 'matches when losses dominate');
});

test('16. Harvesting: tax after ≤ tax before, and tax saved is non-negative', () => {
  const lots: HarvestLot[] = [
    lot({ id: 'a', buyPrice: 200, currentPrice: 120, qty: 100, buyDate: '2025-09-01' }), // ST loss 8000
    lot({ id: 'b', buyPrice: 100, currentPrice: 180, qty: 100, buyDate: '2024-01-01' }), // LT gain 8000
  ];
  const a = analyzeHarvest(inputs({ lots, realizedSTCG: 100000, currentDate: '2026-01-15' }));
  assert(a.afterHarvest.tax <= a.baseline.tax, `after ${a.afterHarvest.tax} ≤ before ${a.baseline.tax}`);
  assert(a.taxSaved >= 0, `tax saved ₹${a.taxSaved} ≥ 0`);
});

test('17. Loss harvesting offsets a realized STCG and cuts tax', () => {
  const lots: HarvestLot[] = [lot({ id: 'a', buyPrice: 200, currentPrice: 100, qty: 1000, buyDate: '2025-09-01' })]; // ST loss 100000
  const a = analyzeHarvest(inputs({ lots, realizedSTCG: 100000, currentDate: '2026-01-15' }));
  assert(a.baseline.tax === Math.round(100000 * 0.20 * 1.04), 'baseline taxes the ₹1L STCG');
  assert(a.afterHarvest.tax === 0, 'harvested ₹1L STCL wipes it out');
  assert(a.lossesHarvestedSTCL === 100000, 'STCL harvested = ₹1L');
});

test('18. Gain harvesting fills the exemption headroom tax-free and books a basis benefit', () => {
  const lots: HarvestLot[] = [lot({ id: 'g', buyPrice: 100, currentPrice: 300, qty: 1000, buyDate: '2024-01-01' })]; // LT gain 200000
  const a = analyzeHarvest(inputs({ lots, currentDate: '2026-01-15' }));
  assert(a.gainHarvestAmount === LTCG_EXEMPTION, `harvest ₹1.25L of gain (got ${a.gainHarvestAmount})`);
  assert(a.afterHarvest.tax === 0, 'gain-harvest stays within exemption → ₹0 tax');
  assert(a.basisStepUpBenefit === Math.round(LTCG_EXEMPTION * 0.125 * 1.04), `basis benefit ₹${a.basisStepUpBenefit}`);
});

test('19. Realized LTCG consumes the exemption, shrinking gain-harvest headroom', () => {
  const lots: HarvestLot[] = [lot({ id: 'g', buyPrice: 100, currentPrice: 300, qty: 1000, buyDate: '2024-01-01' })];
  const a = analyzeHarvest(inputs({ lots, realizedLTCG: 100000, currentDate: '2026-01-15' }));
  assert(a.gainHarvestAmount === LTCG_EXEMPTION - 100000, `only ₹25k headroom left (got ${a.gainHarvestAmount})`);
});

test('20. Edge: only losses → zero tax and losses carried forward', () => {
  const lots: HarvestLot[] = [
    lot({ id: 'a', buyPrice: 200, currentPrice: 100, qty: 100, buyDate: '2025-09-01' }), // ST loss 10000
    lot({ id: 'b', buyPrice: 300, currentPrice: 200, qty: 100, buyDate: '2024-01-01' }), // LT loss 10000
  ];
  const a = analyzeHarvest(inputs({ lots, currentDate: '2026-01-15' }));
  assert(a.afterHarvest.tax === 0, 'no gains → zero tax');
  assert(a.afterHarvest.carrySTCL === 10000 && a.afterHarvest.carryLTCL === 10000, 'both losses carried forward');
});

test('21. Edge: total gains under ₹1.25L → harvested fully tax-free', () => {
  const lots: HarvestLot[] = [lot({ id: 'g', buyPrice: 100, currentPrice: 150, qty: 1000, buyDate: '2024-01-01' })]; // LT gain 50000
  const a = analyzeHarvest(inputs({ lots, currentDate: '2026-01-15' }));
  assert(a.gainHarvestAmount === 50000, 'all ₹50k gain harvested');
  assert(a.afterHarvest.tax === 0, 'fully tax-free');
});

test('22. Edge: debt gains are taxed at slab, not 20%/12.5%', () => {
  const t = computeTax({ equitySTCG: 0, equityLTCG: 0, debtGain: 100000, stcl: 0, ltcl: 0 }, 30);
  assert(t.tax === Math.round(100000 * 0.30 * 1.04), `debt ₹1L @30% slab = ₹${t.tax}`);
});

test('23. Near-boundary short-term gain triggers a "wait" action', () => {
  const lots: HarvestLot[] = [lot({ id: 's', buyPrice: 100, currentPrice: 130, qty: 100, buyDate: '2025-02-01' })]; // ~11.5 months at 2026-01-15
  const a = analyzeHarvest(inputs({ lots, currentDate: '2026-01-15' }));
  const wait = a.actions.find((x) => x.type === 'wait');
  assert(wait !== undefined, 'a wait-a-bit tip is generated near the 12-month line');
});

test('24. Action list: every loss lot gets a harvest-loss action', () => {
  const lots: HarvestLot[] = [
    lot({ id: 'a', buyPrice: 200, currentPrice: 100, qty: 100, buyDate: '2025-09-01' }),
    lot({ id: 'b', buyPrice: 300, currentPrice: 250, qty: 100, buyDate: '2024-01-01' }),
  ];
  const a = analyzeHarvest(inputs({ lots, currentDate: '2026-01-15' }));
  const lossActions = a.actions.filter((x) => x.type === 'harvest-loss');
  assert(lossActions.length === 2, 'both loss lots are flagged to harvest');
});

test('25. Partial-lot gain harvest never realizes more than the headroom', () => {
  const lots: HarvestLot[] = [lot({ id: 'g', buyPrice: 100, currentPrice: 1000, qty: 1000, buyDate: '2024-01-01' })]; // huge LT gain
  const a = analyzeHarvest(inputs({ lots, currentDate: '2026-01-15' }));
  const gh = a.actions.find((x) => x.type === 'gain-harvest');
  assert(gh !== undefined && gh.qty < 1000, 'only a partial quantity is sold');
  assert(a.afterHarvest.tax === 0, 'still within exemption');
});

test('26. Reproducible & coherent bundle', () => {
  const inp = inputs({ lots: [lot({ id: 'a', buyPrice: 100, currentPrice: 180, qty: 100, buyDate: '2024-01-01' })], currentDate: '2026-01-15' });
  const a = analyzeHarvest(inp);
  const b = analyzeHarvest(inp);
  assert(a.afterHarvest.tax === b.afterHarvest.tax, 'deterministic');
  assert(a.classified.length === 1, 'one classified lot');
  assert(a.exemptionHeadroomRemaining >= 0, 'headroom non-negative');
});

// --- Summary ---
console.log(`\n${'='.repeat(48)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
