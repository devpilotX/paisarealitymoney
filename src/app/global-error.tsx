'use client';

/**
 * Root error boundary. Without this file a failure in the root layout falls
 * through to the Pages Router 500 page, which an App Router build does not
 * emit: the production log showed "Failed to load static file for page: /500
 * ENOENT .next/server/pages/500.html". This renders a real page instead.
 *
 * It must declare its own <html> and <body> because it replaces the root
 * layout when it renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3EAD6',
          color: '#1F1B16',
          fontFamily: 'Georgia, serif',
          padding: '24px',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.75rem' }}>Something went wrong</h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            The page could not be loaded. Your data is safe, nothing was saved or sent. Please try
            again, and if it keeps happening the home page will still work.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '0.8rem', opacity: 0.7 }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                fontFamily: 'system-ui, sans-serif',
                backgroundColor: '#1C3A5E',
                color: '#fff',
                border: 0,
                borderRadius: '4px',
                padding: '0.6rem 1.1rem',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                fontFamily: 'system-ui, sans-serif',
                border: '1px solid #1C3A5E',
                color: '#1C3A5E',
                borderRadius: '4px',
                padding: '0.6rem 1.1rem',
                textDecoration: 'none',
              }}
            >
              Go to home page
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
