import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Paisa Reality',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://paisareality.com/forgot-password' },
};

export default function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
