import type { Difficulty } from '@/types';
import { cn } from '@/utils/helpers';

export interface DifficultyBadgeProps {
  difficulty: Difficulty | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const difficultyConfig: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  easy: {
    label: 'Easy',
    badgeClass: 'border-easy/30 bg-easy/10 text-easy',
    dotClass: 'bg-easy',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'border-medium/30 bg-medium/10 text-medium',
    dotClass: 'bg-medium',
  },
  hard: {
    label: 'Hard',
    badgeClass: 'border-hard/30 bg-hard/10 text-hard',
    dotClass: 'bg-hard',
  },
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function DifficultyBadge({
  difficulty,
  size = 'md',
  showDot = true,
  className,
}: DifficultyBadgeProps) {
  const key = difficulty.toLowerCase();
  const config = difficultyConfig[key] ?? {
    label: difficulty,
    badgeClass: 'border-slate-500/30 bg-slate-500/10 text-text-muted',
    dotClass: 'bg-text-muted',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none tracking-tight',
        config.badgeClass,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}

export default DifficultyBadge;
