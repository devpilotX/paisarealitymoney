import Link from 'next/link';
import { SITE_URL } from '@/lib/seo';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps): React.ReactElement {
  // Build BreadcrumbList JSON-LD with Home first, then each item.
  // The current page (last item, no href) may omit the URL per Google guidance.
  const itemListElement: Array<Record<string, unknown>> = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    ...items.map((item, index) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
      };
      if (item.href) {
        entry.item = `${SITE_URL}${item.href}`;
      }
      return entry;
    }),
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav aria-label="Breadcrumb" className="py-3">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-2">
          <li>
            <Link
              href="/"
              className="no-underline text-muted-2 hover:text-brand-red transition-colors duration-200"
            >
              Home
            </Link>
          </li>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.label} className="flex items-center gap-1">
                <span className="text-muted-2" aria-hidden="true">
                  /
                </span>
                {isLast || !item.href ? (
                  <span className="text-navy font-medium">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="no-underline text-muted-2 hover:text-brand-red transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
