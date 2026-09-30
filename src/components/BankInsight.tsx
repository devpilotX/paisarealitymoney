import Link from 'next/link';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

interface Row extends QueryResultRow { slug: string; name: string; rate_type: string; tenure: string; general_rate: string; senior_citizen_rate: string | null; as_of: string }

const pct = (v: number): string => `${v.toFixed(2)}%`;
const inr = (v: number): string => '\u20B9' + Math.round(v).toLocaleString('en-IN');

/** FD maturity with quarterly compounding, which Indian banks use for cumulative deposits. */
export function fdMaturity(principal: number, ratePct: number, years: number): number {
  return principal * Math.pow(1 + ratePct / 400, 4 * years);
}

export function emi(principal: number, ratePct: number, years: number): number {
  const r = ratePct / 1200;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const YEARS: Record<string, number> = { '1 year': 1, '2-3 years': 3, '5 years': 5 };

/**
 * Per-bank analysis that no other bank page shares: where each of this bank's
 * rates ranks among all banks we track, what a deposit grows to here, and what a
 * standard home loan costs here against the cheapest bank.
 */
export default async function BankInsight({ slug }: { slug: string }): Promise<React.ReactElement | null> {
  let rows: Row[] = [];
  try {
    rows = await query<Row>(
      `SELECT b.slug, b.name, r.rate_type, r.tenure, r.general_rate::text, r.senior_citizen_rate::text, r.effective_date::text AS as_of
         FROM bank_rates r JOIN banks b ON b.id = r.bank_id`,
    );
  } catch {
    return null;
  }
  const mine = rows.filter((r) => r.slug === slug);
  if (mine.length === 0) return null;
  const name = mine[0]!.name;

  const compare = (type: string, tenure: string, higherIsBetter: boolean): { rate: number; avg: number; rank: number; n: number; best: Row } | null => {
    // Only banks whose figures were taken on the same date: comparing a rate checked this week with
    // one from months ago would rank a bank on the calendar, not on its rate.
    const set = rows.filter((r) => r.rate_type === type && r.tenure === tenure && r.as_of === mine[0]!.as_of);
    const me = set.find((r) => r.slug === slug);
    if (!me || set.length < 3) return null;
    const sorted = [...set].sort((a, b) => (higherIsBetter ? Number(b.general_rate) - Number(a.general_rate) : Number(a.general_rate) - Number(b.general_rate)));
    const rate = Number(me.general_rate);
    return {
      rate,
      avg: set.reduce((a, r) => a + Number(r.general_rate), 0) / set.length,
      rank: sorted.findIndex((r) => Number(r.general_rate) === rate) + 1,
      n: set.length,
      best: sorted[0]!,
    };
  };

  const lines = [
    { label: 'FD, 1 year', c: compare('fd', '1 year', true), good: true },
    { label: 'FD, 2 to 3 years', c: compare('fd', '2-3 years', true), good: true },
    { label: 'FD, 5 years', c: compare('fd', '5 years', true), good: true },
    { label: 'Savings account', c: compare('savings', 'Regular', true), good: true },
    { label: 'Home loan', c: compare('home_loan', 'Up to 30 years', false), good: false },
    { label: 'Personal loan', c: compare('personal_loan', 'Up to 5 years', false), good: false },
  ].filter((l) => l.c);

  const fds = mine.filter((r) => r.rate_type === 'fd' && YEARS[r.tenure]);
  const home = compare('home_loan', 'Up to 30 years', false);

  return (
    <section className="my-12 space-y-6">
      {lines.length > 0 && (
        <div className="card-flat !p-0 overflow-hidden">
          <div className="p-6 pb-4">
            <h2 className="heading-3">How {name} compares</h2>
            <p className="mt-1 text-sm text-muted">Against the banks whose rates we took on the same date, {new Date(mine[0]!.as_of + 'T00:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. For deposits, rank 1 pays the most; for loans, rank 1 charges the least.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead><tr><th>Product</th><th className="!text-right">{name}</th><th className="!text-right">Average</th><th className="!text-right">Rank</th><th>Best rate</th></tr></thead>
              <tbody>
                {lines.map(({ label, c, good }) => {
                  const better = good ? c!.rate > c!.avg : c!.rate < c!.avg;
                  return (
                    <tr key={label}>
                      <td className="font-medium">{label}</td>
                      <td className={`text-right font-semibold ${better ? 'text-green-700' : 'text-ink'}`}>{pct(c!.rate)}</td>
                      <td className="text-right text-muted">{pct(c!.avg)}</td>
                      <td className="text-right tabular">{c!.rank} of {c!.n}</td>
                      <td>{c!.best.slug === slug ? <span className="text-muted">This bank</span> : <Link href={`/bank-rates/${c!.best.slug}`} className="link-internal">{c!.best.name}</Link>} <span className="text-muted-2">{pct(Number(c!.best.general_rate))}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {fds.length > 0 && (
          <div className="card-flat">
            <h2 className="heading-3">What {inr(100000)} grows to at {name}</h2>
            <p className="mt-1 text-sm text-muted">Cumulative FD, interest compounded quarterly, before tax.</p>
            <dl className="mt-5 space-y-3 text-[15px]">
              {fds.map((r) => {
                const y = YEARS[r.tenure]!;
                const gen = fdMaturity(100000, Number(r.general_rate), y);
                const sen = r.senior_citizen_rate ? fdMaturity(100000, Number(r.senior_citizen_rate), y) : null;
                return (
                  <div key={r.tenure} className="flex justify-between gap-4">
                    <dt className="text-muted">{y} year{y > 1 ? 's' : ''} at {pct(Number(r.general_rate))}</dt>
                    <dd className="text-right tabular"><span className="font-medium">{inr(gen)}</span>{sen && <span className="block text-[13px] text-muted-2">Senior citizen {inr(sen)}</span>}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-4 text-sm text-muted">Interest is taxed at your slab. The bank deducts 10% TDS once interest in a financial year crosses {inr(50000)}, or {inr(100000)} for senior citizens. If your income is below the taxable limit, submit Form 121 to the bank; it replaced Forms 15G and 15H in April 2026.</p>
          </div>
        )}
        {home && (
          <div className="card-flat">
            <h2 className="heading-3">A {inr(5000000)} home loan at {name}</h2>
            <p className="mt-1 text-sm text-muted">20 years at the bank&apos;s starting rate. Your rate depends on your credit score and loan size.</p>
            <dl className="mt-5 space-y-3 text-[15px]">
              <div className="flex justify-between gap-4"><dt className="text-muted">Monthly EMI at {pct(home.rate)}</dt><dd className="font-semibold tabular">{inr(emi(5000000, home.rate, 20))}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Total interest over 20 years</dt><dd className="tabular">{inr(emi(5000000, home.rate, 20) * 240 - 5000000)}</dd></div>
              {home.best.slug !== slug && (
                <div className="flex justify-between gap-4"><dt className="text-muted">At {home.best.name}, {pct(Number(home.best.general_rate))}</dt><dd className="tabular">{inr(emi(5000000, Number(home.best.general_rate), 20))} a month</dd></div>
              )}
            </dl>
            <p className="mt-4 text-sm"><Link href="/calculators/emi" className="link-internal">Work out your own EMI</Link></p>
          </div>
        )}
      </div>
    </section>
  );
}
