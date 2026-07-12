import Link from 'next/link';
import { formatNumber } from '@/lib/constants';

interface SchemeCardProps {
  slug: string;
  name: string;
  category: string;
  level: string;
  benefitSummary: string;
  benefitAmountMax: number | null;
  matchScore?: number;
  ministry?: string | null;
}

export default function SchemeCard({
  slug, name, category, level, benefitSummary,
  benefitAmountMax, matchScore, ministry,
}: SchemeCardProps): React.ReactElement {
  const matchColor =
    matchScore !== undefined && matchScore >= 80
      ? 'text-green-700'
      : matchScore !== undefined && matchScore >= 60
      ? 'text-navy'
      : 'text-muted-2';

  return (
    <div className="card group flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
          <span className="text-xs text-muted-2">
            {level === 'central' ? 'Central Govt' : 'State Govt'}
          </span>
        </div>
        {matchScore !== undefined && matchScore > 0 && (
          <span className={`flex-shrink-0 text-sm font-bold ${matchColor}`}>
            {matchScore}% match
          </span>
        )}
      </div>

      <Link href={`/schemes/${slug}`} className="no-underline">
        <h3 className="font-serif text-base font-bold text-navy mb-2 group-hover:text-brand-red transition-colors duration-200">
          {name}
        </h3>
      </Link>

      <p className="text-sm text-muted mb-3 line-clamp-2">{benefitSummary}</p>

      {benefitAmountMax !== null && benefitAmountMax > 0 && (
        <p className="text-sm font-semibold text-navy mb-3">
          Benefit: Up to Rs {formatNumber(benefitAmountMax)}
        </p>
      )}

      {ministry && (
        <p className="text-xs text-muted-2 mb-3">{ministry}</p>
      )}

      <Link
        href={`/schemes/${slug}`}
        title={`${name} - Eligibility, Benefits and Apply Online`}
        className="mt-auto inline-flex items-center text-sm font-bold text-navy no-underline
                   hover:text-brand-red transition-colors duration-200"
      >
        View Details
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
