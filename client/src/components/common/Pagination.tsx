import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/helpers';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showSummary?: boolean;
  className?: string;
}

type PageToken = number | 'ellipsis-left' | 'ellipsis-right';

function buildPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PageToken[] {
  const totalSlots = siblingCount * 2 + 5;
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftCount }, (_, idx) => idx + 1);
    return [...leftRange, 'ellipsis-right', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + 2 * siblingCount;
    const start = totalPages - rightCount + 1;
    const rightRange = Array.from({ length: rightCount }, (_, idx) => start + idx);
    return [1, 'ellipsis-left', ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, idx) => leftSibling + idx
  );
  return [1, 'ellipsis-left', ...middleRange, 'ellipsis-right', totalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 20,
  onPageChange,
  siblingCount = 1,
  showSummary = true,
  className,
}: PaginationProps) {
  const pageTokens = useMemo(
    () => buildPageRange(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems !== undefined ? (safePage - 1) * pageSize + 1 : null;
  const endItem =
    totalItems !== undefined ? Math.min(safePage * pageSize, totalItems) : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className
      )}
    >
      {showSummary && totalItems !== undefined && totalItems > 0 ? (
        <p className="text-xs text-slate-600 dark:text-text-muted">
          Showing <span className="font-medium text-slate-900 dark:text-text-main">{startItem}</span>
          {' – '}
          <span className="font-medium text-slate-900 dark:text-text-main">{endItem}</span> of{' '}
          <span className="font-medium text-slate-900 dark:text-text-main">{totalItems}</span>
        </p>
      ) : (
        <p className="text-xs text-slate-600 dark:text-text-muted">
          Page <span className="font-medium text-slate-900 dark:text-text-main">{safePage}</span> of{' '}
          <span className="font-medium text-slate-900 dark:text-text-main">{totalPages}</span>
        </p>
      )}

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700/80 dark:bg-card dark:text-text-muted dark:hover:bg-slate-800 dark:hover:text-text-main"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {pageTokens.map((token) => {
          if (typeof token !== 'number') {
            return (
              <span
                key={token}
                className="inline-flex h-8 w-8 items-center justify-center text-slate-400 dark:text-text-muted"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isActive = token === safePage;
          return (
            <button
              key={token}
              type="button"
              onClick={() => onPageChange(token)}
              aria-label={`Page ${token}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2.5 text-xs font-medium transition',
                isActive
                  ? 'border border-accent/40 bg-accent/15 text-accent'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700/80 dark:bg-card dark:text-text-muted dark:hover:bg-slate-800 dark:hover:text-text-main'
              )}
            >
              {token}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700/80 dark:bg-card dark:text-text-muted dark:hover:bg-slate-800 dark:hover:text-text-main"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
