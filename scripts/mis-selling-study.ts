/**
 * Mis-selling data study, computed with the site's own Real Return engine.
 *
 *   npx ts-node --project tsconfig.scripts.json scripts/mis-selling-study.ts
 *
 * Why this exists: docs/backlink-strategy.md calls for a data study to pitch,
 * and a study is only worth pitching if the numbers are computed and anyone can
 * reproduce them. This script takes publicly typical policy structures, runs
 * them through src/lib/real-return.ts (the same code behind the Real Return
 * Checker), and prints the table.
 *
 * These are ILLUSTRATIVE STRUCTURES, not claims about any named product. Each
 * one states its own premium, term and maturity assumption. Nothing here is
 * attributed to a specific insurer, because we have not audited a specific
 * insurer's benefit illustration.
 */

import { analyzeOffer, INFLATION_PCT, FD_PCT, PPF_PCT, type OfferInput } from '../src/lib/real-return';

interface Scenario {
  label: string;
  note: string;
  input: OfferInput;
}

const base = {
  lumpsumPaid: 0,
  annualPayment: 0,
  payingYears: 0,
  maturityYear: 0,
  maturityAmount: 0,
  moneybacks: [] as Array<{ year: number; amount: number }>,
};

const SCENARIOS: Scenario[] = [
  {
    label: 'Endowment, 20-year',
    note: 'Rs 50,000 a year for 20 years, Rs 18,00,000 at maturity',
    input: { ...base, mode: 'endowment', annualPayment: 50_000, payingYears: 20, maturityYear: 20, maturityAmount: 18_00_000 },
  },
  {
    label: 'Endowment, pay 15 hold 25',
    note: 'Rs 1,00,000 a year for 15 years, Rs 25,00,000 at year 25',
    input: { ...base, mode: 'endowment', annualPayment: 1_00_000, payingYears: 15, maturityYear: 25, maturityAmount: 25_00_000 },
  },
  {
    label: 'Money-back, 20-year',
    note: 'Rs 40,000 a year for 20 years, Rs 1,00,000 back at years 5, 10 and 15, Rs 8,00,000 at maturity',
    input: {
      ...base, mode: 'moneyback', annualPayment: 40_000, payingYears: 20, maturityYear: 20, maturityAmount: 8_00_000,
      moneybacks: [{ year: 5, amount: 1_00_000 }, { year: 10, amount: 1_00_000 }, { year: 15, amount: 1_00_000 }],
    },
  },
  {
    label: 'ULIP-style, pay 10 hold 15',
    note: 'Rs 1,20,000 a year for 10 years, Rs 22,00,000 at year 15',
    input: { ...base, mode: 'endowment', annualPayment: 1_20_000, payingYears: 10, maturityYear: 15, maturityAmount: 22_00_000 },
  },
  {
    label: 'Single premium "double your money"',
    note: 'Rs 5,00,000 once, Rs 10,00,000 at year 12',
    input: { ...base, mode: 'lumpsum', lumpsumPaid: 5_00_000, maturityYear: 12, maturityAmount: 10_00_000 },
  },
];

const inr = (n: number): string => `Rs ${Math.round(n).toLocaleString('en-IN')}`;
const pct = (n: number | null): string => (n === null ? 'n/a' : `${n.toFixed(2)}%`);

console.log(`\nBenchmarks used by the engine: PPF ${PPF_PCT}%, FD ${FD_PCT}%, inflation ${INFLATION_PCT}%\n`);

const rows: Array<Record<string, string>> = [];
for (const s of SCENARIOS) {
  const r = analyzeOffer(s.input);
  const ppf = r.benchmarks.find((b) => b.name.toLowerCase().includes('ppf'));
  const gap = ppf ? ppf.futureValue - r.totalReceived : 0;
  rows.push({
    scenario: s.label,
    structure: s.note,
    paid: inr(r.totalPaid),
    received: inr(r.totalReceived),
    multiple: `${r.multiple.toFixed(2)}x`,
    annualReturn: pct(r.irrPct),
    vsInflation: r.irrPct === null ? 'n/a' : `${(r.irrPct - INFLATION_PCT).toFixed(2)} pts`,
    ppfWouldGive: ppf ? inr(ppf.futureValue) : 'n/a',
    costOfChoice: inr(gap),
    verdict: r.verdict.band,
    todayValue: inr(r.receivedTodayValue),
  });
  console.log(`--- ${s.label} ---`);
  console.log(`  ${s.note}`);
  console.log(`  paid ${inr(r.totalPaid)}  received ${inr(r.totalReceived)}  multiple ${r.multiple.toFixed(2)}x`);
  console.log(`  annual return (XIRR): ${pct(r.irrPct)}   versus inflation ${INFLATION_PCT}%: ${r.irrPct === null ? 'n/a' : (r.irrPct - INFLATION_PCT).toFixed(2)} points`);
  console.log(`  same payments into PPF: ${ppf ? inr(ppf.futureValue) : 'n/a'}   difference: ${inr(gap)}`);
  console.log(`  maturity in today's rupees at ${INFLATION_PCT}% inflation: ${inr(r.receivedTodayValue)}`);
  console.log(`  verdict band: ${r.verdict.band}  (${r.verdict.title})`);
  if (r.redFlags.length) console.log(`  red flags: ${r.redFlags.join(' | ')}`);
  console.log('');
}

const irrs = rows.map((r) => Number.parseFloat(r.annualReturn)).filter((n) => Number.isFinite(n));
const belowInflation = irrs.filter((n) => n < INFLATION_PCT).length;
const belowPpf = irrs.filter((n) => n < PPF_PCT).length;
console.log('===== SUMMARY =====');
console.log(`scenarios: ${irrs.length}`);
console.log(`annual return range: ${Math.min(...irrs).toFixed(2)}% to ${Math.max(...irrs).toFixed(2)}%`);
console.log(`below inflation (${INFLATION_PCT}%): ${belowInflation} of ${irrs.length}`);
console.log(`below PPF (${PPF_PCT}%): ${belowPpf} of ${irrs.length}`);
console.log(`every multiple quoted: ${rows.map((r) => r.multiple).join(', ')}`);
