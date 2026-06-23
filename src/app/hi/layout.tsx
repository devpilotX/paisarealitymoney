import type { Metadata } from 'next';

// The site is English-only for search. Keep all /hi pages out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HiLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
