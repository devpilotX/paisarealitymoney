import Link from 'next/link';
import { formatDate } from '@/lib/constants';

interface LastReviewedProps {
  /** Date the content was last fact-checked (YYYY-MM-DD). */
  date: string;
  className?: string;
}

/**
 * "Last reviewed" stamp for YMYL content (guides, calculators, tax pages).
 * Update the date whenever the page's facts are re-verified, not on cosmetic
 * edits — the date is a promise, not a decoration.
 */
export default function LastReviewed({ date, className = '' }: LastReviewedProps): React.ReactElement {
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      Last reviewed on {formatDate(date)} by the Paisa Reality editorial team ·{' '}
      <Link href="/editorial-policy" className="underline hover:text-gray-700">
        Editorial policy
      </Link>
    </p>
  );
}
