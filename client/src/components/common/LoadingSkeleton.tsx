import { cn } from '@/utils/helpers';

export type SkeletonVariant =
  | 'text'
  | 'title'
  | 'avatar'
  | 'card'
  | 'table-row'
  | 'code'
  | 'rect';

export interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  title: 'h-7 w-3/5 rounded-md',
  avatar: 'h-10 w-10 rounded-full',
  card: 'h-36 w-full rounded-xl',
  'table-row': 'h-12 w-full rounded-lg',
  code: 'h-48 w-full rounded-xl',
  rect: 'h-24 w-full rounded-lg',
};

export function LoadingSkeleton({
  variant = 'text',
  count = 1,
  width,
  height,
  className,
}: LoadingSkeletonProps) {
  const style =
    width !== undefined || height !== undefined
      ? {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }
      : undefined;

  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      {Array.from({ length: Math.max(1, count) }).map((_, index) => (
        <div
          key={index}
          style={style}
          className={cn(
            'skeleton-shimmer bg-slate-200/70 dark:bg-slate-800/80',
            variantClasses[variant],
            className
          )}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-card',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading card"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="skeleton-shimmer h-5 w-1/3 rounded bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="skeleton-shimmer h-6 w-16 rounded-full bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="skeleton-shimmer h-4 w-full rounded bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="skeleton-shimmer h-4 w-4/5 rounded bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="skeleton-shimmer h-3 w-20 rounded bg-slate-200/70 dark:bg-slate-800/80" />
        <div className="skeleton-shimmer h-3 w-24 rounded bg-slate-200/70 dark:bg-slate-800/80" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-card"
      role="status"
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="skeleton-shimmer h-9 w-full rounded-lg bg-slate-200/70 dark:bg-slate-800/80" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="skeleton-shimmer h-12 w-full rounded-lg bg-slate-200/60 dark:bg-slate-800/60"
        />
      ))}
    </div>
  );
}

export function PageLoadingFallback() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer h-9 w-9 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
            <div className="skeleton-shimmer h-6 w-40 rounded bg-slate-200/80 dark:bg-slate-800" />
          </div>
          <div className="skeleton-shimmer h-9 w-28 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}

export default LoadingSkeleton;
