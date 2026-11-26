import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Circle,
  CircleDot,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { calculateAcceptanceRate, cn } from '@/utils/helpers';
import type { Problem, Topic } from '@/types';

export interface PracticeProblemItem extends Omit<Problem, 'constraints' | 'topic'> {
  constraints?: string | string[];
  topic?: Topic | string;
  topics?: Array<Topic | string>;
  solved?: boolean;
  bookmarked?: boolean;
  recommendationReason?: string;
}

export interface ProblemCardProps {
  problem: PracticeProblemItem;
  index?: number;
  variant?: 'card' | 'row';
  isBookmarking?: boolean;
  onToggleBookmark?: (problem: PracticeProblemItem) => void;
  onTagClick?: (tag: string) => void;
  recommendationReason?: string;
  className?: string;
}

function getTopicLabels(problem: PracticeProblemItem): string[] {
  const labels = new Set<string>();

  if (Array.isArray(problem.topics)) {
    for (const topic of problem.topics) {
      if (typeof topic === 'string' && topic.trim()) {
        labels.add(topic.trim());
      } else if (topic && typeof topic === 'object' && 'title' in topic && topic.title) {
        labels.add(topic.title);
      }
    }
  }

  if (problem.topic) {
    if (typeof problem.topic === 'string' && problem.topic.trim()) {
      labels.add(problem.topic.trim());
    } else if (typeof problem.topic === 'object' && problem.topic.title) {
      labels.add(problem.topic.title);
    }
  }

  if (Array.isArray(problem.tags)) {
    for (const tag of problem.tags) {
      if (tag && tag.trim()) {
        labels.add(tag.trim());
      }
    }
  }

  return Array.from(labels);
}

function getAcceptanceDisplay(problem: PracticeProblemItem): string {
  if (typeof problem.acceptanceRate === 'number' && !Number.isNaN(problem.acceptanceRate)) {
    return `${problem.acceptanceRate.toFixed(1)}%`;
  }
  if (
    typeof problem.totalSubmissions === 'number' &&
    problem.totalSubmissions > 0 &&
    typeof problem.acceptedSubmissions === 'number'
  ) {
    return `${calculateAcceptanceRate(problem.acceptedSubmissions, problem.totalSubmissions).toFixed(1)}%`;
  }
  return '—';
}

export function ProblemCard({
  problem,
  index = 0,
  variant = 'card',
  isBookmarking = false,
  onToggleBookmark,
  onTagClick,
  recommendationReason,
  className,
}: ProblemCardProps) {
  const isSolved = Boolean(problem.isSolved ?? problem.solved);
  const isAttempted = Boolean(problem.isAttempted) && !isSolved;
  const isBookmarked = Boolean(problem.isBookmarked ?? problem.bookmarked);
  const topicLabels = getTopicLabels(problem);
  const visibleTags = topicLabels.slice(0, variant === 'row' ? 3 : 4);
  const remainingTagCount = Math.max(0, topicLabels.length - visibleTags.length);
  const acceptanceText = getAcceptanceDisplay(problem);
  const reason = recommendationReason ?? problem.recommendationReason;

  const handleBookmarkClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleBookmark?.(problem);
  };

  if (variant === 'row') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.2) }}
        className={cn(
          'group flex flex-col gap-3 rounded-xl border border-[#30363D] bg-[#1C2128] px-4 py-3.5 transition-all hover:border-[#22C55E]/45 hover:bg-[#1C2128]/90 sm:flex-row sm:items-center sm:justify-between',
          className
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="mt-0.5 shrink-0 sm:mt-0" title={isSolved ? 'Solved' : isAttempted ? 'Attempted' : 'Unsolved'}>
            {isSolved ? (
              <CheckCircle2 className="h-5 w-5 text-[#22C55E]" aria-label="Solved" />
            ) : isAttempted ? (
              <CircleDot className="h-5 w-5 text-amber-400" aria-label="Attempted" />
            ) : (
              <Circle className="h-5 w-5 text-[#8B949E]/45" aria-label="Unsolved" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/practice/${problem.slug}`}
                className="truncate text-sm font-semibold text-[#F0F6FC] transition-colors group-hover:text-[#22C55E]"
              >
                {problem.title}
              </Link>
              <DifficultyBadge difficulty={problem.difficulty} size="sm" />
            </div>

            {visibleTags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {visibleTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagClick?.(tag)}
                    className={cn(
                      'rounded-md border border-[#30363D] bg-[#0D1117] px-2 py-0.5 text-[11px] font-medium text-[#8B949E] transition',
                      onTagClick && 'hover:border-[#22C55E]/40 hover:text-[#F0F6FC]'
                    )}
                  >
                    {tag}
                  </button>
                ))}
                {remainingTagCount > 0 && (
                  <span className="text-[11px] text-[#8B949E]">+{remainingTagCount}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
            <TrendingUp className="h-3.5 w-3.5 text-[#8B949E]" aria-hidden="true" />
            <span>Acceptance:</span>
            <span className="font-mono font-semibold text-[#F0F6FC]">{acceptanceText}</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleBookmark && (
              <button
                type="button"
                onClick={handleBookmarkClick}
                disabled={isBookmarking}
                aria-label={isBookmarked ? `Remove bookmark for ${problem.title}` : `Bookmark ${problem.title}`}
                aria-pressed={isBookmarked}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50',
                  isBookmarked
                    ? 'border-amber-400/40 bg-amber-400/15 text-amber-400 hover:bg-amber-400/20'
                    : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-[#22C55E]/40 hover:text-[#F0F6FC]'
                )}
              >
                <Bookmark
                  className={cn('h-4 w-4', isBookmarked && 'fill-current')}
                  aria-hidden="true"
                />
              </button>
            )}

            <Link
              to={`/practice/${problem.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-semibold text-[#F0F6FC] transition hover:border-[#22C55E] hover:bg-[#22C55E]/15 hover:text-[#22C55E]"
            >
              <span>{isSolved ? 'Review' : 'Solve'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.25) }}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-[#30363D] bg-[#1C2128] p-4 transition-all hover:-translate-y-0.5 hover:border-[#22C55E]/50 hover:shadow-lg hover:shadow-[#22C55E]/5',
        className
      )}
    >
      <div>
        {reason && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#22C55E]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>{reason}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className="mt-0.5 shrink-0"
              title={isSolved ? 'Solved' : isAttempted ? 'Attempted' : 'Unsolved'}
            >
              {isSolved ? (
                <CheckCircle2 className="h-5 w-5 text-[#22C55E]" aria-label="Solved" />
              ) : isAttempted ? (
                <CircleDot className="h-5 w-5 text-amber-400" aria-label="Attempted" />
              ) : (
                <Circle className="h-5 w-5 text-[#8B949E]/45" aria-label="Unsolved" />
              )}
            </span>

            <Link
              to={`/practice/${problem.slug}`}
              className="line-clamp-2 text-base font-semibold leading-snug text-[#F0F6FC] transition-colors group-hover:text-[#22C55E]"
            >
              {problem.title}
            </Link>
          </div>

          {onToggleBookmark && (
            <button
              type="button"
              onClick={handleBookmarkClick}
              disabled={isBookmarking}
              aria-label={isBookmarked ? `Remove bookmark for ${problem.title}` : `Bookmark ${problem.title}`}
              aria-pressed={isBookmarked}
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-50',
                isBookmarked
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-400 hover:bg-amber-400/20'
                  : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-[#22C55E]/40 hover:text-[#F0F6FC]'
              )}
            >
              <Bookmark
                className={cn('h-4 w-4', isBookmarked && 'fill-current')}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} size="sm" />
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick?.(tag)}
              className={cn(
                'rounded-md border border-[#30363D] bg-[#0D1117] px-2 py-0.5 text-[11px] font-medium text-[#8B949E] transition',
                onTagClick && 'hover:border-[#22C55E]/40 hover:text-[#F0F6FC]'
              )}
            >
              {tag}
            </button>
          ))}
          {remainingTagCount > 0 && (
            <span className="text-[11px] text-[#8B949E]">+{remainingTagCount}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#30363D]/80 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Acceptance</span>
          <span className="font-mono font-semibold text-[#F0F6FC]">{acceptanceText}</span>
        </div>

        <Link
          to={`/practice/${problem.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22C55E] transition hover:text-[#22C55E]/80"
        >
          <span>{isSolved ? 'Solved' : 'Solve'}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  );
}

export default ProblemCard;
