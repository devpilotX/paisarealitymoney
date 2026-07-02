import Link from 'next/link';
import { formatDate } from '@/lib/constants';

interface DataProvenanceProps {
  /** Date the underlying data was last verified against its source (YYYY-MM-DD). */
  asOf?: string | null;
  /** Human-readable source label. */
  source?: string | null;
  className?: string;
}

/**
 * One-line disclosure of where a price came from and when it was last
 * verified. Every price surface should render this — trust is the product.
 */
export default function DataProvenance({ asOf, source, className = '' }: DataProvenanceProps): React.ReactElement {
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      {asOf ? <>Data verified as of {formatDate(asOf)}. </> : null}
      {source ? <>Source: {source}. </> : null}
      <Link href="/methodology" className="underline hover:text-gray-700">
        How we verify prices
      </Link>
    </p>
  );
}
