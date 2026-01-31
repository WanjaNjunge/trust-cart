import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParams?: Record<string, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  queryParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...queryParams, page: String(page) });
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <ul className="flex items-center gap-1">
        {/* Previous */}
        <li>
          {currentPage > 1 ? (
            <Link
              href={buildUrl(currentPage - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary-600 hover:bg-secondary-100"
              aria-label="Previous page"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </span>
          )}
        </li>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <li key={index}>
            {page === 'ellipsis' ? (
              <span className="flex h-10 w-10 items-center justify-center text-secondary-400">
                ...
              </span>
            ) : page === currentPage ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-medium text-white">
                {page}
              </span>
            ) : (
              <Link
                href={buildUrl(page)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary-600 hover:bg-secondary-100"
              >
                {page}
              </Link>
            )}
          </li>
        ))}

        {/* Next */}
        <li>
          {currentPage < totalPages ? (
            <Link
              href={buildUrl(currentPage + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary-600 hover:bg-secondary-100"
              aria-label="Next page"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
