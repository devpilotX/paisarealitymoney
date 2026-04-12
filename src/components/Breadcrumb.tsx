import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <li>
          <Link
            href="/"
            className="no-underline text-gray-500 hover:text-primary transition-colors duration-200"
          >
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              <span className="text-gray-400" aria-hidden="true">
                /
              </span>
              {isLast || !item.href ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="no-underline text-gray-500 hover:text-primary transition-colors duration-200"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}