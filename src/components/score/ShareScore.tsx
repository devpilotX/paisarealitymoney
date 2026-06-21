'use client';

import { useState } from 'react';

/** Copy-link and WhatsApp share for the public result page. */
export default function ShareScore({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={copy} className="btn-secondary">{copied ? 'Link copied!' : 'Copy link'}</button>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-secondary no-underline">Share on WhatsApp</a>
    </div>
  );
}
