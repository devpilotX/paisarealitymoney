import { formatINR } from '@/lib/constants';
import PriceChart from '@/components/PriceChart';
import type { NationalSnapshot, SeriesPoint } from '@/lib/national-prices';

interface Props {
  metal: 'gold' | 'silver';
  snapshot: NationalSnapshot | null;
  series: SeriesPoint[];
  priceDate: string;
  cityCount?: number;
}

/**
 * National "rate today in India" headline for the gold/silver hubs: the
 * average across tracked cities, today's change, the cross-city range, and a
 * trend chart. Server-rendered text (the numbers are in the HTML, which is what
 * the head-term query needs); the chart is the reused PriceChart client widget.
 */
export default function NationalRateHeadline({
  metal,
  snapshot,
  series,
  priceDate,
  cityCount = 50,
}: Props): React.ReactElement | null {
  if (!snapshot) return null;
  const isGold = metal === 'gold';
  const label = isGold ? 'Gold' : 'Silver';
  const color = isGold ? '#B8860B' : '#64748B';

  const change = snapshot.changeAmount;
  const changeCls =
    change == null || change === 0 ? 'price-neutral' : change > 0 ? 'price-up' : 'price-down';
  const arrow = change == null || change === 0 ? '' : change > 0 ? '\u25B2' : '\u25BC';

  const chartData = series.map((p) => ({ date: p.date, price: p.value }));

  return (
    <section className="card my-6" aria-label={`National ${label.toLowerCase()} rate today in India`}>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        {isGold ? (
          <>
            <div>
              <p className="eyebrow">24K Gold, India average</p>
              <p className="text-3xl font-extrabold text-navy leading-tight">
                {formatINR(snapshot.k24PerGram ?? 0)}
                <span className="text-base font-medium text-muted"> /gram</span>
              </p>
              {snapshot.k24Per10gram != null && (
                <p className="text-sm text-muted-2">{formatINR(snapshot.k24Per10gram)} per 10 grams</p>
              )}
            </div>
            {snapshot.k22PerGram != null && (
              <div>
                <p className="eyebrow">22K Gold</p>
                <p className="text-2xl font-bold text-navy leading-tight">
                  {formatINR(snapshot.k22PerGram)}
                  <span className="text-sm font-medium text-muted"> /gram</span>
                </p>
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="eyebrow">Silver, India average</p>
            <p className="text-3xl font-extrabold text-navy leading-tight">
              {formatINR(snapshot.perKg ?? 0)}
              <span className="text-base font-medium text-muted"> /kg</span>
            </p>
            {snapshot.perGram != null && (
              <p className="text-sm text-muted-2">{formatINR(snapshot.perGram)} per gram</p>
            )}
          </div>
        )}

        {change != null && (
          <div>
            <p className="eyebrow">Today&apos;s change</p>
            <p className={`text-lg font-semibold ${changeCls}`}>
              {arrow} {formatINR(Math.abs(change))}
              {snapshot.changePercent != null && (
                <span className="text-sm">
                  {' '}
                  ({snapshot.changePercent > 0 ? '+' : ''}
                  {snapshot.changePercent}%)
                </span>
              )}
            </p>
          </div>
        )}

        {snapshot.dayHigh != null && snapshot.dayLow != null && (
          <div>
            <p className="eyebrow">Across cities</p>
            <p className="text-sm text-muted">
              {formatINR(snapshot.dayLow)} to {formatINR(snapshot.dayHigh)}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-2 mt-3">
        India average across {cityCount}+ tracked cities, {priceDate}. Indicative market rate; verify
        with your local jeweller before buying.
      </p>

      {chartData.length > 1 && (
        <div className="mt-5">
          <PriceChart
            data={chartData}
            title={`${label} price trend in India (${chartData.length} days, ${isGold ? '24K per gram' : 'per gram'})`}
            color={color}
          />
        </div>
      )}
    </section>
  );
}
