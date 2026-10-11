import type { Metadata } from 'next';

// The site is English-only for search. Keep all /hi pages out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HiLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  // lang="hi" so screen readers switch to a Hindi voice and browsers pick Devanagari fonts and hyphenation.
  return <div lang="hi">{children}</div>;
}
