import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Paisa Reality',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://paisareality.com/signup' },
};

export default function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
