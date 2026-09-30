'use client';

import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }): React.ReactElement {
  return (
    <div className="container-main py-20 sm:py-28 text-center">
      <p className="text-sm font-medium text-muted-2">Something went wrong</p>
      <h1 className="heading-1 mt-3">This page did not load</h1>
      <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
        It is usually a passing problem on our side. Try again in a moment. If it keeps happening, tell us which page it was.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-secondary">Go to the homepage</Link>
      </div>
      <p className="mt-8 text-sm text-muted-2">
        <Link href="/contact" className="link-internal">Report the problem</Link>
      </p>
    </div>
  );
}
