import type { Metadata } from 'next';

// User dashboard is private. Block from search as a backup to the robots.txt disallow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
