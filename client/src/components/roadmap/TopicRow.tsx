import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Code2,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { cn } from '@/utils/helpers';
import type { Topic, TopicResourceLink } from '@/types';
import {
  isTopicCompleted,
  isTopicSelfReportedExternal,
  isTopicVerified,
  resolveTopicProblemId,
  resolveTopicProblemSlug,
} from './topicHelpers';

export interface TopicRowProps {
  topic: Topic;
  variant?: 'table' | 'card';
  isTogglingComplete?: boolean;
  isTogglingBookmark?: boolean;
  isAddingRevision?: boolean;
  onToggleComplete: (topic: Topic) => void;
  onToggleBookmark: (topic: Topic) => void;
  onAddToRevision: (topic: Topic) => void;
  onToggleExternal?: (topic: Topic, platform: 'codechef' | 'leetcode') => void;
}

interface TooltipButtonWrapperProps {
  tooltip: string;
  children: ReactNode;
}

function TooltipWrapper({ tooltip, children }: TooltipButtonWrapperProps) {
  return (
    <div className="group/tip relative inline-flex items-center justify-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[11px] font-medium text-[#F0F6FC] opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {tooltip}
      </span>
    </div>
  );
}

function normalizeResourceLinks(
  primary?: TopicResourceLink,
  extras?: TopicResourceLink[]
): TopicResourceLink[] {
  const seen = new Set<string>();
  const out: TopicResourceLink[] = [];
  for (const item of [primary, ...(extras || [])]) {
    const url = item?.url?.trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push({ ...item, url });
    }
  }
  return out;
}

function ResourcePopover({
  links,
  label,
  accentClass,
}: {
  links: TopicResourceLink[];
  label: string;
  accentClass: string;
}) {
  const [open, setOpen] = useState(false);
  if (links.length <= 1) return null;
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={`Show all ${links.length} ${label} resources`}
        aria-expanded={open}
        className="inline-flex h-5 items-center gap-0.5 rounded border border-[#30363D] bg-[#0D1117] px-1 text-[9px] font-semibold text-[#8B949E] transition hover:border-[#38BDF8]/50 hover:text-[#F0F6FC]"
      >
        <span>+{links.length - 1}</span>
        <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute left-0 top-7 z-40 w-64 rounded-xl border border-[#30363D] bg-[#161B22] p-2 shadow-xl"
        >
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#8B949E]">
            {label} ({links.length})
          </div>
          <div className="space-y-1">
            {links.map((lk, idx) => (
              <a
                key={`${lk.url}-${idx}`}
                href={lk.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-[#F0F6FC] transition hover:bg-[#1C2128]"
              >
                <span className="truncate">{lk.title || `${label} #${idx + 1}`}</span>
                <span className={cn('shrink-0 text-[10px] font-semibold', accentClass)}>
                  {lk.difficulty || lk.language || 'Open'}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function resolveYoutubeLinks(youtube?: TopicResourceLink[] | TopicResourceLink): TopicResourceLink[] {
  if (!youtube) return [];
  if (Array.isArray(youtube)) {
    return youtube.filter((entry) => entry && typeof entry.url === 'string' && entry.url.trim());
  }
  if (typeof youtube.url === 'string' && youtube.url.trim()) {
    return [youtube];
  }
  return [];
}

export function TopicRow({
  topic,
  variant = 'table',
  isTogglingComplete = false,
  isTogglingBookmark = false,
  isAddingRevision = false,
  onToggleComplete,
  onToggleBookmark,
  onAddToRevision,
  onToggleExternal,
}: TopicRowProps) {
  const verified = isTopicVerified(topic);
  const completed = isTopicCompleted(topic);
  const selfReportedExternal = isTopicSelfReportedExternal(topic);
  const isSelfReportedOnly = !verified && (completed || selfReportedExternal);

  const codechefLinks = normalizeResourceLinks(topic.resources?.codechef, topic.resources?.codechefLinks);
  const leetcodeLinks = normalizeResourceLinks(topic.resources?.leetcode, topic.resources?.leetcodeLinks);
  const youtubeLinks = resolveYoutubeLinks(topic.resources?.youtube);
  const codechefUrl = codechefLinks[0]?.url || '';
  const leetcodeUrl = leetcodeLinks[0]?.url || '';
  const youtubeLink = youtubeLinks[0] || null;
  const youtubeUrl = youtubeLink?.url?.trim() || '';
  const problemSlug = resolveTopicProblemSlug(topic);
  const problemId = resolveTopicProblemId(topic);
  const hasNotes = topic.hasNotes !== false;
  const isBookmarked = Boolean(topic.isBookmarked);
  const inRevision = Boolean(topic.inRevision || topic.isInRevision);
  const canAddToRevision = Boolean(problemId || problemSlug);

  const externalPlatforms: string[] = [];
  if (topic.selfReportedExternal?.codechef) externalPlatforms.push('CodeChef');
  if (topic.selfReportedExternal?.leetcode) externalPlatforms.push('LeetCode');

  const renderCompletionBadge = () => {
    if (verified) {
      return (
        <span
          title="Verified via accepted submission on CodeClimb"
          className="inline-flex items-center gap-1 rounded-full border border-[#22C55E]/35 bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E]"
        >
          <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>CodeClimb Verified</span>
        </span>
      );
    }

    if (isSelfReportedOnly) {
      const label =
        externalPlatforms.length > 0
          ? `Self-Reported (${externalPlatforms.join(', ')})`
          : 'Self-Reported';
      return (
        <span
          title="Marked complete manually or via external platform (not verified by CodeClimb judge)"
          className="inline-flex items-center gap-1 rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/10 px-2 py-0.5 text-[10px] font-medium text-[#38BDF8]"
        >
          <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );
    }

    return null;
  };

  const renderCheckbox = () => (
    <TooltipWrapper
      tooltip={
        verified
          ? 'Verified on CodeClimb (click to toggle status)'
          : completed
            ? 'Mark as incomplete'
            : 'Mark topic as completed'
      }
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-label={`Mark "${topic.title}" as ${completed ? 'incomplete' : 'completed'}`}
        disabled={isTogglingComplete}
        onClick={() => onToggleComplete(topic)}
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-md border transition focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 disabled:cursor-wait disabled:opacity-60',
          verified
            ? 'border-[#22C55E] bg-[#22C55E] text-[#0D1117] shadow-sm shadow-[#22C55E]/25'
            : completed
              ? 'border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8]'
              : 'border-[#30363D] bg-[#0D1117] text-transparent hover:border-[#22C55E]/60'
        )}
      >
        {isTogglingComplete ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#22C55E]" aria-hidden="true" />
        ) : (
          <Check className={cn('h-3.5 w-3.5 stroke-[2.75]', !completed && 'opacity-0')} aria-hidden="true" />
        )}
      </button>
    </TooltipWrapper>
  );

  const renderCodeChefAction = () => {
    const isCheckedExternal = Boolean(topic.selfReportedExternal?.codechef);
    if (!codechefUrl) {
      return (
        <TooltipWrapper tooltip="CodeChef: Not Available">
          <button
            type="button"
            disabled
            aria-label="CodeChef: Not Available"
            className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#30363D]/60 bg-[#0D1117]/60 text-[#8B949E]/35"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipWrapper>
      );
    }

    return (
      <div className="inline-flex items-center gap-1">
        <TooltipWrapper
          tooltip={topic.resources?.codechef?.title || 'Practice on CodeChef (opens new tab)'}
        >
          <a
            href={codechefUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${topic.title} on CodeChef`}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
              isCheckedExternal
                ? 'border-amber-400/45 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
                : 'border-[#30363D] bg-[#0D1117] text-amber-400/85 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300'
            )}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </TooltipWrapper>
        <ResourcePopover links={codechefLinks} label="CodeChef" accentClass="text-amber-300" />
        {onToggleExternal && (
          <TooltipWrapper
            tooltip={isCheckedExternal ? 'Unmark CodeChef self-reported' : 'Mark solved on CodeChef'}
          >
            <button
              type="button"
              onClick={() => onToggleExternal(topic, 'codechef')}
              aria-label={`Toggle CodeChef self-reported completion for ${topic.title}`}
              aria-pressed={isCheckedExternal}
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded border text-[9px] font-bold transition',
                isCheckedExternal
                  ? 'border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8]'
                  : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-[#38BDF8]/50 hover:text-[#F0F6FC]'
              )}
            >
              CC
            </button>
          </TooltipWrapper>
        )}
      </div>
    );
  };

  const renderLeetCodeAction = () => {
    const isCheckedExternal = Boolean(topic.selfReportedExternal?.leetcode);
    if (!leetcodeUrl) {
      return (
        <TooltipWrapper tooltip="LeetCode: Not Available">
          <button
            type="button"
            disabled
            aria-label="LeetCode: Not Available"
            className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#30363D]/60 bg-[#0D1117]/60 text-[#8B949E]/35"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipWrapper>
      );
    }

    return (
      <div className="inline-flex items-center gap-1">
        <TooltipWrapper
          tooltip={topic.resources?.leetcode?.title || 'Practice on LeetCode (opens new tab)'}
        >
          <a
            href={leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${topic.title} on LeetCode`}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
              isCheckedExternal
                ? 'border-[#38BDF8]/45 bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8]/25'
                : 'border-[#30363D] bg-[#0D1117] text-orange-400/85 hover:border-orange-400/50 hover:bg-orange-400/10 hover:text-orange-300'
            )}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </TooltipWrapper>
        <ResourcePopover links={leetcodeLinks} label="LeetCode" accentClass="text-orange-300" />
        {onToggleExternal && (
          <TooltipWrapper
            tooltip={isCheckedExternal ? 'Unmark LeetCode self-reported' : 'Mark solved on LeetCode'}
          >
            <button
              type="button"
              onClick={() => onToggleExternal(topic, 'leetcode')}
              aria-label={`Toggle LeetCode self-reported completion for ${topic.title}`}
              aria-pressed={isCheckedExternal}
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded border text-[9px] font-bold transition',
                isCheckedExternal
                  ? 'border-[#38BDF8] bg-[#38BDF8]/20 text-[#38BDF8]'
                  : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-[#38BDF8]/50 hover:text-[#F0F6FC]'
              )}
            >
              LC
            </button>
          </TooltipWrapper>
        )}
      </div>
    );
  };

  const renderNotesAction = () => {
    if (!hasNotes || !topic.slug) {
      return (
        <TooltipWrapper tooltip="Notes coming soon">
          <button
            type="button"
            disabled
            aria-label="Notes unavailable"
            className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#30363D]/60 bg-[#0D1117]/60 text-[#8B949E]/35"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipWrapper>
      );
    }

    return (
      <TooltipWrapper tooltip="Read study notes">
        <Link
          to={`/notes/${encodeURIComponent(topic.slug)}`}
          aria-label={`Read notes for ${topic.title}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#30363D] bg-[#0D1117] text-[#38BDF8] transition hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/15"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
        </Link>
      </TooltipWrapper>
    );
  };

  const renderYoutubeAction = () => {
    if (!youtubeUrl) {
      return (
        <TooltipWrapper tooltip="YouTube: Not Available">
          <button
            type="button"
            disabled
            aria-label="YouTube: Not Available"
            className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#30363D]/60 bg-[#0D1117]/60 text-[#8B949E]/35"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipWrapper>
      );
    }

    const isSearchFallback = youtubeUrl.includes('results?search_query=');
    const tipText = isSearchFallback
      ? `YouTube Search: ${youtubeLink?.title || topic.title}`
      : `Direct Video: ${youtubeLink?.title || 'Watch YouTube tutorial'}`;

    return (
      <div className="inline-flex items-center gap-1">
        <TooltipWrapper tooltip={tipText}>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${isSearchFallback ? 'YouTube Search' : 'Direct YouTube Video'} for ${topic.title}`}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
              isSearchFallback
                ? 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-300'
                : 'border-red-500/35 bg-red-500/10 text-red-400 hover:border-red-500/60 hover:bg-red-500/20 hover:text-red-300'
            )}
          >
            {isSearchFallback ? (
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            )}
          </a>
        </TooltipWrapper>
        <ResourcePopover links={youtubeLinks} label="YouTube" accentClass="text-red-300" />
      </div>
    );
  };

  const renderPracticeAction = () => {
    if (!problemSlug) {
      return (
        <TooltipWrapper tooltip="No CodeClimb practice problem linked">
          <button
            type="button"
            disabled
            aria-label="Practice problem unavailable"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-[#30363D]/60 bg-[#0D1117]/60 px-2.5 py-1.5 text-xs font-medium text-[#8B949E]/40"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Practice</span>
          </button>
        </TooltipWrapper>
      );
    }

    return (
      <TooltipWrapper tooltip="Solve on CodeClimb Judge">
        <Link
          to={`/practice/${encodeURIComponent(problemSlug)}`}
          aria-label={`Practice ${topic.title} on CodeClimb`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
            verified
              ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E]/25'
              : 'border-[#22C55E]/40 bg-[#22C55E] text-[#0D1117] hover:bg-[#22C55E]/90'
          )}
        >
          <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{verified ? 'Solved' : 'Practice'}</span>
        </Link>
      </TooltipWrapper>
    );
  };

  const renderBookmarkAction = () => (
    <TooltipWrapper tooltip={isBookmarked ? 'Remove bookmark' : 'Bookmark topic'}>
      <button
        type="button"
        onClick={() => onToggleBookmark(topic)}
        disabled={isTogglingBookmark}
        aria-label={isBookmarked ? `Remove bookmark for ${topic.title}` : `Bookmark ${topic.title}`}
        aria-pressed={isBookmarked}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50',
          isBookmarked
            ? 'border-amber-400/45 bg-amber-400/15 text-amber-400 hover:bg-amber-400/25'
            : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-amber-400/45 hover:text-amber-300'
        )}
      >
        {isTogglingBookmark ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : isBookmarked ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </TooltipWrapper>
  );

  const renderRevisionAction = () => {
    if (!canAddToRevision) {
      return (
        <TooltipWrapper tooltip="Revision requires a linked practice problem">
          <button
            type="button"
            disabled
            aria-label="Revision unavailable for theory-only topic"
            className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#30363D]/60 bg-[#0D1117]/60 text-[#8B949E]/35"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipWrapper>
      );
    }

    return (
      <TooltipWrapper tooltip={inRevision ? 'In revision queue' : 'Add to spaced repetition'}>
        <button
          type="button"
          onClick={() => onAddToRevision(topic)}
          disabled={isAddingRevision}
          aria-label={inRevision ? `${topic.title} is in revision queue` : `Add ${topic.title} to revision`}
          aria-pressed={inRevision}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-50',
            inRevision
              ? 'border-[#22C55E]/45 bg-[#22C55E]/15 text-[#22C55E] hover:bg-[#22C55E]/25'
              : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/10 hover:text-[#38BDF8]'
          )}
        >
          {isAddingRevision ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </TooltipWrapper>
    );
  };

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl border p-3.5 transition-colors',
          completed
            ? 'border-[#22C55E]/25 bg-[#0D1117]/80'
            : 'border-[#30363D] bg-[#0D1117]'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{renderCheckbox()}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {hasNotes && topic.slug ? (
                  <Link
                    to={`/notes/${encodeURIComponent(topic.slug)}`}
                    className={cn(
                      'text-sm font-semibold transition-colors hover:text-[#22C55E]',
                      completed ? 'text-[#F0F6FC]' : 'text-[#F0F6FC]'
                    )}
                  >
                    {topic.title}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-[#F0F6FC]">{topic.title}</span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <DifficultyBadge difficulty={topic.difficulty ?? 'Easy'} size="sm" />
                {topic.conceptType && (
                  <span className="rounded border border-[#30363D] bg-[#161B22] px-1.5 py-0.5 text-[10px] font-medium capitalize text-[#8B949E]">
                    {topic.conceptType}
                  </span>
                )}
                {renderCompletionBadge()}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {renderBookmarkAction()}
            {renderRevisionAction()}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#30363D]/70 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {renderCodeChefAction()}
            {renderLeetCodeAction()}
            {renderNotesAction()}
            {renderYoutubeAction()}
          </div>
          {renderPracticeAction()}
        </div>
      </div>
    );
  }

  return (
    <tr
      className={cn(
        'group border-b border-[#30363D]/70 transition-colors last:border-b-0',
        completed ? 'bg-[#22C55E]/[0.03] hover:bg-[#22C55E]/[0.06]' : 'hover:bg-[#161B22]/70'
      )}
    >
      {/* 1. Completion Checkbox */}
      <td className="w-12 px-3 py-3 text-center align-middle">{renderCheckbox()}</td>

      {/* 2. Topic / Problem Name + Verification Distinction */}
      <td className="min-w-[230px] px-3 py-3 align-middle">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {hasNotes && topic.slug ? (
              <Link
                to={`/notes/${encodeURIComponent(topic.slug)}`}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[#22C55E]',
                  completed ? 'text-[#F0F6FC]' : 'text-[#F0F6FC]'
                )}
              >
                {topic.title}
              </Link>
            ) : (
              <span className="text-sm font-medium text-[#F0F6FC]">{topic.title}</span>
            )}
            {renderCompletionBadge()}
          </div>
          {(topic.description || topic.conceptType) && (
            <div className="flex items-center gap-2 text-xs text-[#8B949E]">
              {topic.conceptType && (
                <span className="rounded border border-[#30363D] bg-[#0D1117] px-1.5 py-0.2 text-[10px] font-medium capitalize text-[#8B949E]">
                  {topic.conceptType}
                </span>
              )}
              {topic.description && (
                <span className="line-clamp-1">{topic.description}</span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* 3. Difficulty Badge */}
      <td className="whitespace-nowrap px-3 py-3 text-center align-middle">
        <DifficultyBadge difficulty={topic.difficulty ?? 'Easy'} size="sm" />
      </td>

      {/* 4. CodeChef Link */}
      <td className="whitespace-nowrap px-2.5 py-3 text-center align-middle">
        {renderCodeChefAction()}
      </td>

      {/* 5. LeetCode Link */}
      <td className="whitespace-nowrap px-2.5 py-3 text-center align-middle">
        {renderLeetCodeAction()}
      </td>

      {/* 6. Notes Link */}
      <td className="whitespace-nowrap px-2.5 py-3 text-center align-middle">
        {renderNotesAction()}
      </td>

      {/* 7. YouTube Link */}
      <td className="whitespace-nowrap px-2.5 py-3 text-center align-middle">
        {renderYoutubeAction()}
      </td>

      {/* 8. Practice Button */}
      <td className="whitespace-nowrap px-3 py-3 text-center align-middle">
        {renderPracticeAction()}
      </td>

      {/* 9. Bookmark Icon */}
      <td className="whitespace-nowrap px-2.5 py-3 text-center align-middle">
        {renderBookmarkAction()}
      </td>

      {/* 10. Revision Button */}
      <td className="whitespace-nowrap px-3 py-3 text-center align-middle">
        {renderRevisionAction()}
      </td>
    </tr>
  );
}

export default TopicRow;
