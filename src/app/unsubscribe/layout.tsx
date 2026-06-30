import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsubscribe | Paisa Reality',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://paisareality.com/unsubscribe' },
};

export default function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
