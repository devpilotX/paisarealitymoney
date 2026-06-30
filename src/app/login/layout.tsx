import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | Paisa Reality',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://paisareality.com/login' },
};

export default function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
