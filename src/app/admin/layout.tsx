import type { Metadata } from 'next';

// Admin is private. Block from search as a backup to the robots.txt disallow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
