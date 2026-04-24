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

const CATEGORY_COLORS: Record<string, string> = {
  education: 'bg-blue-100 text-blue-800',
  housing: 'bg-orange-100 text-orange-800',
  business: 'bg-purple-100 text-purple-800',
  agriculture: 'bg-green-100 text-green-800',
  healthcare: 'bg-red-100 text-red-800',
  women: 'bg-pink-100 text-pink-800',
  'senior-citizen': 'bg-yellow-100 text-yellow-800',
  disability: 'bg-teal-100 text-teal-800',
  'skill-training': 'bg-indigo-100 text-indigo-800',
  pension: 'bg-gray-100 text-gray-800',
  insurance: 'bg-cyan-100 text-cyan-800',
  finance: 'bg-emerald-100 text-emerald-800',
  employment: 'bg-violet-100 text-violet-800',
  social: 'bg-amber-100 text-amber-800',
};

export default function SchemeCard({
  slug, name, category, level, benefitSummary,
  benefitAmountMax, matchScore, ministry,
}: SchemeCardProps): React.ReactElement {
  const categoryColor = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="card hover:border-primary transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColor}`}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
          <span className="text-xs text-gray-500">
            {level === 'central' ? 'Central Govt' : 'State Govt'}
          </span>
        </div>
        {matchScore !== undefined && matchScore > 0 && (
          <div className="flex-shrink-0 text-right">
            <span className={`text-sm font-bold ${
              matchScore >= 80 ? 'text-green-600' : matchScore >= 60 ? 'text-primary' : 'text-orange-500'
            }`}>
              {matchScore}% match
            </span>
          </div>
        )}
      </div>

      <Link href={`/schemes/${slug}`} className="no-underline">
        <h3 className="text-base font-semibold text-gray-900 mb-2 hover:text-primary transition-colors duration-200">
          {name}
        </h3>
      </Link>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{benefitSummary}</p>

      {benefitAmountMax !== null && benefitAmountMax > 0 && (
        <p className="text-sm font-medium text-primary mb-3">
          Benefit: Up to Rs {formatNumber(benefitAmountMax)}
        </p>
      )}

      {ministry && (
        <p className="text-xs text-gray-500 mb-3">{ministry}</p>
      )}

      <Link
        href={`/schemes/${slug}`}
        title={`${name} - Eligibility, Benefits and Apply Online`}
        className="inline-flex items-center text-sm font-medium text-primary no-underline
                   hover:underline transition-colors duration-200"
      >
        View Details
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
