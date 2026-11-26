import { isValidElement, type ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helpers';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  compact?: boolean;
  className?: string;
}

function renderEmptyIcon(icon: LucideIcon | ReactNode | undefined, compact: boolean): ReactNode {
  const sizeClass = compact ? 'h-6 w-6' : 'h-8 w-8';

  if (!icon) {
    return <Inbox className={cn(sizeClass, 'text-text-muted')} aria-hidden="true" />;
  }

  if (isValidElement(icon)) {
    return icon;
  }

  const IconComponent = icon as LucideIcon;
  return <IconComponent className={cn(sizeClass, 'text-text-muted')} aria-hidden="true" />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  compact = false,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center dark:border-slate-700/80 dark:bg-card/50',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-sidebar',
          compact ? 'mb-3 h-12 w-12' : 'mb-4 h-16 w-16'
        )}
      >
        {renderEmptyIcon(icon, compact)}
      </div>

      <h3
        className={cn(
          'font-semibold text-slate-900 dark:text-text-main',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'mt-1.5 max-w-md text-slate-600 dark:text-text-muted',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" aria-hidden="true" />}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-sidebar dark:text-text-main dark:hover:bg-slate-800"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default EmptyState;
