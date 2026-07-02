import { query } from '@/lib/db';
import { formatDate } from '@/lib/constants';
import type { QueryResultRow } from 'pg';

interface RatesAsOfProps {
  /** Limit the freshness date to one rate type (fd, savings, home_loan, ...). */
  rateType?: string;
  /** Limit to a single bank slug (used on per-bank pages). */
  bankSlug?: string;
  className?: string;
}

interface DateRow extends QueryResultRow {
  d: string | null;
}

/**
 * Server component that shows when the displayed bank rates were last
 * verified. Bank rates are YMYL data — never show a rate without its date.
 */
export default async function RatesAsOf({ rateType, bankSlug, className = '' }: RatesAsOfProps): Promise<React.ReactElement | null> {
  let asOf: string | null = null;
  try {
    if (bankSlug) {
      const rows = await query<DateRow>(
        'SELECT max(br.effective_date)::text AS d FROM bank_rates br JOIN banks b ON br.bank_id = b.id WHERE b.slug = $1',
        [bankSlug]
      );
      asOf = rows[0]?.d ?? null;
    } else if (rateType) {
      const rows = await query<DateRow>('SELECT max(effective_date)::text AS d FROM bank_rates WHERE rate_type = $1', [
        rateType,
      ]);
      asOf = rows[0]?.d ?? null;
    } else {
      const rows = await query<DateRow>('SELECT max(effective_date)::text AS d FROM bank_rates');
      asOf = rows[0]?.d ?? null;
    }
  } catch {
    return null;
  }
  if (!asOf) return null;

  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      Rates as of {formatDate(asOf)}. Banks revise rates without notice, so always verify on the bank&apos;s official
      website or branch before you book a deposit or apply for a loan.
    </p>
  );
}
