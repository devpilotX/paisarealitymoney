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
    <Link href={`/bank-rates/${slug}`} className="card no-underline group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
            {name}
          </h3>
          <span className="text-xs text-gray-500">{typeLabel[type] ?? type}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {fdRate !== undefined && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-500">FD Rate</p>
            <p className="text-sm font-semibold text-primary">{fdRate.toFixed(2)}%</p>
          </div>
        )}
        {savingsRate !== undefined && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-500">Savings</p>
            <p className="text-sm font-semibold text-primary">{savingsRate.toFixed(2)}%</p>
          </div>
        )}
        {homeLoanRate !== undefined && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-500">Home Loan</p>
            <p className="text-sm font-semibold text-primary">{homeLoanRate.toFixed(2)}%</p>
          </div>
        )}
      </div>
    </Link>
  );
}