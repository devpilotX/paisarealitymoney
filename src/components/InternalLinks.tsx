import Link from 'next/link';

interface InternalLink {
  href: string;
  label: string;
  description?: string;
}

interface InternalLinksProps {
  title: string;
  links: InternalLink[];
  columns?: 2 | 3 | 4;
}

export default function InternalLinks({
  title,
  links,
  columns = 3,
}: InternalLinksProps): React.ReactElement {
  const gridClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-8">
      <h2 className="heading-3 mb-4">{title}</h2>
      <div className={`grid ${gridClass} gap-3`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block p-4 rounded-lg border border-gray-200 no-underline
                       transition-all duration-200 ease-in-out
                       hover:border-primary hover:shadow-sm group"
          >
            <span className="text-base font-medium text-primary group-hover:text-primary-600">
              {link.label}
            </span>
            {link.description && (
              <span className="block mt-1 text-sm text-gray-500">{link.description}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}