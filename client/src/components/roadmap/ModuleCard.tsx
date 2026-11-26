import { AnimatePresence, motion } from 'framer-motion';
import {
  Binary,
  BookOpen,
  Boxes,
  ChevronRight,
  Cpu,
  GitBranch,
  Layers,
  Network,
  Sparkles,
  Trees,
  type LucideIcon,
} from 'lucide-react';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { TopicRow } from '@/components/roadmap/TopicRow';
import { isTopicCompleted, isTopicVerified } from '@/components/roadmap/topicHelpers';
import { cn } from '@/utils/helpers';
import type { Module, Topic, UserProgress } from '@/types';

export interface ModuleProgressInfo {
  completedCount?: number;
  totalCount?: number;
  verifiedCount?: number;
  percentage?: number;
}

export interface ModuleCardProps {
  module: Module;
  isExpanded: boolean;
  onToggle: (moduleId: string) => void;
  userProgress?: UserProgress | ModuleProgressInfo | null;
  topics?: Topic[];
  pendingTopicIds?: Set<string>;
  togglingBookmarkIds?: Set<string>;
  addingRevisionIds?: Set<string>;
  onToggleComplete: (topic: Topic) => void;
  onToggleBookmark: (topic: Topic) => void;
  onAddToRevision: (topic: Topic) => void;
  onToggleExternal?: (topic: Topic, platform: 'codechef' | 'leetcode') => void;
  index?: number;
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  bookopen: BookOpen,
  layers: Layers,
  trees: Trees,
  tree: Trees,
  network: Network,
  gitbranch: GitBranch,
  cpu: Cpu,
  boxes: Boxes,
  binary: Binary,
  sparkles: Sparkles,
};

function getModuleIcon(iconName?: string): LucideIcon {
  if (!iconName) return BookOpen;
  const key = iconName.toLowerCase().replace(/[^a-z]/g, '');
  return MODULE_ICONS[key] ?? BookOpen;
}

function resolveModuleCounts(
  module: Module,
  topics: Topic[],
  userProgress?: UserProgress | ModuleProgressInfo | null
): { totalCount: number; completedCount: number; verifiedCount: number; percentage: number } {
  const allTopics = module.topics ?? topics;
  const derivedTotal = allTopics.length;
  const derivedCompleted = allTopics.filter((t) => isTopicCompleted(t)).length;
  const derivedVerified = allTopics.filter((t) => isTopicVerified(t)).length;

  let totalCount = module.totalConcepts ?? module.topicCount ?? derivedTotal;
  let completedCount =
    module.completedConcepts ??
    module.completedCount ??
    module.completedTopicCount ??
    derivedCompleted;
  let verifiedCount = derivedVerified;

  if (userProgress && 'moduleProgress' in userProgress && Array.isArray(userProgress.moduleProgress)) {
    const matched = userProgress.moduleProgress.find((item) => item.moduleId === module._id);
    if (matched) {
      totalCount = matched.totalTopics || totalCount;
      completedCount = matched.completedTopics ?? completedCount;
    }
  } else if (userProgress && 'completedCount' in userProgress) {
    if (typeof userProgress.totalCount === 'number') totalCount = userProgress.totalCount;
    if (typeof userProgress.completedCount === 'number') completedCount = userProgress.completedCount;
    if (typeof userProgress.verifiedCount === 'number') verifiedCount = userProgress.verifiedCount;
  }

  // If module.topics are loaded, trust live topic array counts when they exceed or reflect optimistic updates
  if (allTopics.length > 0) {
    totalCount = Math.max(totalCount, allTopics.length);
    completedCount = derivedCompleted;
  }

  const percentage =
    totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  return { totalCount, completedCount, verifiedCount, percentage };
}

export function ModuleCard({
  module,
  isExpanded,
  onToggle,
  userProgress,
  topics,
  pendingTopicIds,
  togglingBookmarkIds,
  addingRevisionIds,
  onToggleComplete,
  onToggleBookmark,
  onAddToRevision,
  onToggleExternal,
  index = 0,
}: ModuleCardProps) {
  const displayTopics = topics ?? module.topics ?? [];
  const { totalCount, completedCount, verifiedCount, percentage } = resolveModuleCounts(
    module,
    displayTopics,
    userProgress
  );
  const ModuleIcon = getModuleIcon(module.iconName ?? module.icon);
  const isModuleComplete = totalCount > 0 && completedCount >= totalCount;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.24) }}
      className={cn(
        'overflow-hidden rounded-2xl border bg-[#1C2128] transition-colors',
        isExpanded
          ? 'border-[#22C55E]/40 shadow-lg shadow-black/20'
          : 'border-[#30363D] hover:border-[#8B949E]/45'
      )}
    >
      {/* Expandable Header */}
      <button
        type="button"
        onClick={() => onToggle(module._id)}
        aria-expanded={isExpanded}
        aria-controls={`module-panel-${module._id}`}
        className="flex w-full flex-col gap-4 px-5 py-4 text-left transition-colors hover:bg-[#161B22]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
          <motion.span
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors sm:mt-0',
              isExpanded
                ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
                : 'border-[#30363D] bg-[#0D1117] text-[#8B949E]'
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </motion.span>

          <div
            className={cn(
              'hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:flex',
              isModuleComplete
                ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
                : 'border-[#30363D] bg-[#0D1117] text-[#38BDF8]'
            )}
          >
            <ModuleIcon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md border border-[#30363D] bg-[#0D1117] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#8B949E]">
                #{String(module.order > 0 ? module.order : index + 1).padStart(2, '0')}
              </span>
              <h2 className="truncate text-base font-bold text-[#F0F6FC] sm:text-lg">
                {module.title}
              </h2>
              {module.difficulty && <DifficultyBadge difficulty={module.difficulty} size="sm" />}
            </div>

            {module.description && (
              <p className="mt-1 line-clamp-2 text-xs text-[#8B949E] sm:text-sm">
                {module.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Counts & Progress Bar */}
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-56">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#8B949E]">
              <span className="font-semibold text-[#F0F6FC]">{completedCount}</span> / {totalCount}{' '}
              {totalCount === 1 ? 'concept' : 'concepts'}
            </span>
            <div className="flex items-center gap-2">
              {verifiedCount > 0 && (
                <span className="text-[11px] font-medium text-[#22C55E]">
                  {verifiedCount} verified
                </span>
              )}
              <span className="font-mono font-semibold text-[#22C55E]">{percentage}%</span>
            </div>
          </div>

          <div
            className="h-2 w-full overflow-hidden rounded-full bg-[#0D1117] ring-1 ring-inset ring-[#30363D]"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${module.title} completion progress`}
          >
            <motion.div
              initial={false}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full transition-colors',
                isModuleComplete
                  ? 'bg-[#22C55E]'
                  : 'bg-gradient-to-r from-[#22C55E] to-[#38BDF8]'
              )}
            />
          </div>
        </div>
      </button>

      {/* Expandable Topic Table / Mobile Cards */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`module-panel-${module._id}`}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-[#30363D]"
          >
            {displayTopics.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#8B949E]">
                No topics in this module match your active filters.
              </div>
            ) : (
              <>
                {/* Desktop / Tablet Horizontal-Scroll Table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#30363D] bg-[#161B22]/90 text-[11px] font-semibold uppercase tracking-wider text-[#8B949E]">
                        <th scope="col" className="w-12 px-3 py-2.5 text-center">
                          Done
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                          Topic / Problem
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-center">
                          Difficulty
                        </th>
                        <th scope="col" className="px-2.5 py-2.5 text-center">
                          CodeChef
                        </th>
                        <th scope="col" className="px-2.5 py-2.5 text-center">
                          LeetCode
                        </th>
                        <th scope="col" className="px-2.5 py-2.5 text-center">
                          Notes
                        </th>
                        <th scope="col" className="px-2.5 py-2.5 text-center">
                          Video
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-center">
                          Practice
                        </th>
                        <th scope="col" className="px-2.5 py-2.5 text-center">
                          Save
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-center">
                          Revise
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayTopics.map((topic) => (
                        <TopicRow
                          key={topic._id}
                          topic={topic}
                          variant="table"
                          isTogglingComplete={pendingTopicIds?.has(topic._id)}
                          isTogglingBookmark={togglingBookmarkIds?.has(topic._id)}
                          isAddingRevision={addingRevisionIds?.has(topic._id)}
                          onToggleComplete={onToggleComplete}
                          onToggleBookmark={onToggleBookmark}
                          onAddToRevision={onAddToRevision}
                          onToggleExternal={onToggleExternal}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="space-y-3 p-3.5 md:hidden">
                  {displayTopics.map((topic) => (
                    <TopicRow
                      key={topic._id}
                      topic={topic}
                      variant="card"
                      isTogglingComplete={pendingTopicIds?.has(topic._id)}
                      isTogglingBookmark={togglingBookmarkIds?.has(topic._id)}
                      isAddingRevision={addingRevisionIds?.has(topic._id)}
                      onToggleComplete={onToggleComplete}
                      onToggleBookmark={onToggleBookmark}
                      onAddToRevision={onAddToRevision}
                      onToggleExternal={onToggleExternal}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default ModuleCard;
