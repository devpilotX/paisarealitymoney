import Link from 'next/link';
import { query } from '@/lib/db';
import type { QueryResultRow } from 'pg';

type Fuel = 'petrol' | 'diesel';

interface Row extends QueryResultRow { slug: string; name: string; state: string; price: string }

const inr = (v: number, d = 2): string => '\u20B9' + v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

async function load(fuel: Fuel): Promise<Row[]> {
  try {
    return await query<Row>(
      `SELECT c.slug, c.name, c.state, f.${fuel}_price::text AS price
         FROM fuel_prices f JOIN cities c ON c.id = f.city_id
        WHERE f.price_date = (SELECT MAX(price_date) FROM fuel_prices)
        ORDER BY f.${fuel}_price, c.name`,
    );
  } catch {
    return [];
  }
}

/**
 * City-specific fuel analysis for /petrol-price/[city] and /diesel-price/[city]:
 * how the city ranks against the 50 we track, why (state VAT), and what common
 * fills cost at today's rate.
 */
export default async function FuelCityInsight({ fuel, citySlug }: { fuel: Fuel; citySlug: string }): Promise<React.ReactElement | null> {
  const rows = await load(fuel);
  const me = rows.find((r) => r.slug === citySlug);
  if (!me || rows.length < 2) return null;
  const price = Number(me.price);
  const avg = rows.reduce((a, r) => a + Number(r.price), 0) / rows.length;
  const rank = rows.findIndex((r) => r.slug === citySlug) + 1;
  const cheapest = rows[0]!;
  const dearest = rows[rows.length - 1]!;
  const peers = rows.filter((r) => r.state === me.state && r.slug !== citySlug);
  const label = fuel === 'petrol' ? 'Petrol' : 'Diesel';

  const fills = fuel === 'petrol'
    ? [
        { what: 'Scooter, 5 litres', litres: 5 },
        { what: 'Hatchback tank, 35 litres', litres: 35 },
        { what: 'Month of commuting, 30 km a day at 15 km/L', litres: 60 },
      ]
    : [
        { what: 'SUV tank, 50 litres', litres: 50 },
        { what: 'Month of driving, 40 km a day at 16 km/L', litres: 75 },
        { what: 'Tractor, 20 litres', litres: 20 },
      ];

  return (
    <section className="my-12 grid gap-6 lg:grid-cols-2">
      <div className="card-flat">
        <h2 className="heading-3">How {me.name} compares today</h2>
        <dl className="mt-5 space-y-3 text-[15px]">
          <div className="flex justify-between gap-4"><dt className="text-muted">{label} in {me.name}</dt><dd className="font-semibold tabular">{inr(price)} / L</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Average of {rows.length} cities</dt><dd className="tabular">{inr(avg)} / L</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Difference</dt><dd className={`tabular font-medium ${price > avg ? 'text-brand-red' : 'text-green-700'}`}>{price >= avg ? '+' : '-'}{inr(Math.abs(price - avg))} / L</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Rank, cheapest first</dt><dd className="tabular">{rank} of {rows.length}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Cheapest today</dt><dd className="tabular"><Link href={`/${fuel}-price/${cheapest.slug}`} className="link-internal">{cheapest.name}</Link> {inr(Number(cheapest.price))}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Dearest today</dt><dd className="tabular"><Link href={`/${fuel}-price/${dearest.slug}`} className="link-internal">{dearest.name}</Link> {inr(Number(dearest.price))}</dd></div>
        </dl>
        <p className="mt-5 pt-4 border-t border-line text-sm text-muted leading-relaxed">
          {`Most of the gap between cities is state VAT. Excise duty and the oil company's base price are the same across India, so ${me.name} pays ${me.state}'s VAT rate on top.`}
          {peers.length > 0 && <>{' '}Other {me.state} cities today: {peers.map((p, i) => (
            <span key={p.slug}>{i > 0 ? ', ' : ''}<Link href={`/${fuel}-price/${p.slug}`} className="link-internal">{p.name}</Link> {inr(Number(p.price))}</span>
          ))}.</>}
        </p>
      </div>

      <div className="card-flat">
        <h2 className="heading-3">What a fill costs in {me.name}</h2>
        <p className="mt-2 text-sm text-muted">At today&apos;s rate of {inr(price)} a litre.</p>
        <dl className="mt-5 space-y-3 text-[15px]">
          {fills.map((f) => (
            <div key={f.what} className="flex justify-between gap-4"><dt className="text-muted">{f.what}</dt><dd className="font-medium tabular">{inr(price * f.litres, 0)}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          {`Compared with the cheapest city, ${cheapest.name}, a 35-litre fill here costs ${inr(Math.abs(price - Number(cheapest.price)) * 35, 0)} ${price >= Number(cheapest.price) ? 'more' : 'less'}.`}
        </p>
      </div>
    </section>
  );
}
