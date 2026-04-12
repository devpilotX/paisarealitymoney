import { formatNumber } from '@/lib/constants';
import SchemeCard from '@/components/SchemeCard';
import type { MatchedScheme } from '@/lib/matcher';

interface SchemeResultsProps {
  schemes: MatchedScheme[];
  totalBenefit: number;
  isLoading: boolean;
}

export default function SchemeResults({
  schemes, totalBenefit, isLoading,
}: SchemeResultsProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-body mt-4">Checking your eligibility against 1,000+ schemes...</p>
      </div>
    );
  }

  if (schemes.length === 0) {
    return <div />;
  }

  return (
    <div className="py-8">
      {/* Summary */}
      <div className="bg-primary-50 rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {schemes.length} Scheme{schemes.length > 1 ? 's' : ''} Found
            </h2>
            <p className="text-base text-gray-600 mt-1">
              Based on your profile, you may be eligible for these government schemes.
            </p>
          </div>
          {totalBenefit > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Total potential value</p>
              <p className="text-2xl font-bold text-primary">
                Rs {formatNumber(totalBenefit)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category filter badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from(new Set(schemes.map((s) => s.category))).map((cat) => {
          const count = schemes.filter((s) => s.category === cat).length;
          return (
            <span key={cat} className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
            </span>
          );
        })}
      </div>

      {/* Scheme cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            slug={scheme.slug}
            name={scheme.name}
            category={scheme.category}
            level={scheme.level}
            benefitSummary={scheme.benefitSummary}
            benefitAmountMax={scheme.benefitAmountMax}
            matchScore={scheme.matchScore}
            ministry={scheme.ministry}
          />
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        Disclaimer: Eligibility shown is indicative. Actual eligibility depends on detailed criteria
        verified by the implementing agency. Always check official government websites before applying.
      </p>
    </div>
  );
}