import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Government Scheme Finder: Check Schemes You Qualify For',
  description:
    'Find central and state government schemes you may qualify for. Fill a simple form and we match you with active schemes by age, income, and category.',
  path: '/schemes',
  keywords: ['government scheme finder', 'sarkari yojana', 'schemes i am eligible for', 'government schemes india'],
});

export default function SchemesLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
