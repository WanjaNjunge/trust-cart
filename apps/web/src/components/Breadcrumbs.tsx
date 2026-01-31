import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link href="/" className="text-secondary-500 hover:text-primary-600">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-secondary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.href ? (
              <Link href={item.href} className="text-secondary-500 hover:text-primary-600">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-secondary-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
