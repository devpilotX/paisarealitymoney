'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center px-6">
        <p className="font-serif text-6xl font-bold text-brand-red mb-4">!</p>
        <h1 className="font-serif text-3xl font-bold text-navy mb-3">Something went wrong</h1>
        <p className="text-muted mb-8 max-w-md mx-auto">
          We encountered an unexpected error. This is usually temporary. Please try again.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
