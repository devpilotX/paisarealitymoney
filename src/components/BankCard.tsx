import Link from 'next/link';

interface BankCardProps {
  slug: string;
  name: string;
  type: string;
  fdRate?: number;
  savingsRate?: number;
  homeLoanRate?: number;
}

export default function BankCard({
  slug, name, type, fdRate, savingsRate, homeLoanRate,
}: BankCardProps): React.ReactElement {
  const typeLabel: Record<string, string> = {
    public: 'Public Sector', private: 'Private Sector',
    small_finance: 'Small Finance Bank', cooperative: 'Cooperative Bank',
  };

  return (
    <Link href={`/bank-rates/${slug}`} className="card group no-underline">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-serif font-bold text-navy group-hover:text-brand-red transition-colors">
            {name}
          </h3>
          <p className="text-xs text-muted-2">{typeLabel[type] ?? type}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {fdRate !== undefined && (
          <div>
            <p className="text-xs text-muted-2">FD Rate</p>
            <p className="font-bold text-navy">{Number(fdRate).toFixed(2)}%</p>
          </div>
        )}
        {savingsRate !== undefined && (
          <div>
            <p className="text-xs text-muted-2">Savings</p>
            <p className="font-semibold text-ink">{Number(savingsRate).toFixed(2)}%</p>
          </div>
        )}
        {homeLoanRate !== undefined && (
          <div>
            <p className="text-xs text-muted-2">Home Loan</p>
            <p className="font-semibold text-ink">{Number(homeLoanRate).toFixed(2)}%</p>
          </div>
        )}
      </div>
    </Link>
  );
}
