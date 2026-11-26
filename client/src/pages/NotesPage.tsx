import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  Lightbulb,
  Play,
  Printer,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { bookmarksApi } from '@/services/api';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import type { Note, Problem, Topic } from '@/types';

type LangTab = 'c' | 'cpp' | 'java' | 'python';

const LANG_TABS: { key: LangTab; label: string }[] = [
  { key: 'c', label: 'C' },
  { key: 'cpp', label: 'C++' },
  { key: 'java', label: 'Java' },
  { key: 'python', label: 'Python' },
];

interface TopicDetailResponse extends Topic {
  note?: (Note & { diagramHtml?: string }) | null;
  prevTopic?: { slug: string; title: string } | null;
  nextTopic?: { slug: string; title: string } | null;
  progress?: {
    isCompleted?: boolean;
    completedAt?: string | null;
  } | null;
}

export default function NotesPage() {
  const { topicSlug } = useParams<{ topicSlug: string }>();

  const [topic, setTopic] = useState<TopicDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLang, setActiveLang] = useState<LangTab>('cpp');
  const [copied, setCopied] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [togglingLearn, setTogglingLearn] = useState(false);
  const [togglingBookmark, setTogglingBookmark] = useState(false);

  useEffect(() => {
    if (!topicSlug) return;
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get(`/topics/${encodeURIComponent(topicSlug)}`)
      .then(async (res) => {
        if (!active) return;
        const data = res.data?.data as TopicDetailResponse | undefined;
        if (!data) {
          setError('Topic not found.');
          return;
        }
        setTopic(data);
        setIsCompleted(Boolean(data.progress?.isCompleted));

        if (data.note?._id) {
          try {
            const bmRes = await api.get('/bookmarks/check', {
              params: { targetType: 'note', targetId: data.note._id },
            });
            if (active) {
              setIsBookmarked(Boolean(bmRes.data?.data?.bookmarked ?? bmRes.data?.data?.isBookmarked));
            }
          } catch {
            // Non-blocking
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Unable to load learning notes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [topicSlug]);

  const handleToggleLearned = async () => {
    if (!topic?._id || togglingLearn) return;
    setTogglingLearn(true);
    try {
      const next = !isCompleted;
      await api.put(`/topics/${topic._id}/progress`, { completed: next });
      setIsCompleted(next);
      toast.success(next ? 'Marked as learned!' : 'Marked as pending', { id: 'note-learn' });
    } catch {
      toast.error('Failed to update learning status', { id: 'note-learn' });
    } finally {
      setTogglingLearn(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!topic?.note?._id || togglingBookmark) return;
    setTogglingBookmark(true);
    try {
      await bookmarksApi.toggleBookmark({
        itemType: 'note',
        itemId: topic.note._id,
        targetType: 'note',
        targetId: topic.note._id,
      });
      setIsBookmarked((prev) => !prev);
      toast.success(isBookmarked ? 'Removed note bookmark' : 'Note bookmarked!', {
        id: 'note-bookmark',
      });
    } catch {
      toast.error('Failed to update bookmark', { id: 'note-bookmark' });
    } finally {
      setTogglingBookmark(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied!', { id: 'note-copy' });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Unable to copy code', { id: 'note-copy' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-[#1C2128] p-8 text-center">
        <p className="text-sm text-red-400">{error || 'Note not found.'}</p>
        <Link
          to="/roadmap"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to DSA Roadmap
        </Link>
      </div>
    );
  }

  const note = topic.note;
  const moduleObj = typeof topic.module === 'object' && topic.module ? topic.module : null;
  const implementations = note?.implementations || {};
  const activeCode = implementations[activeLang] || '';
  const hasAnyCode = Boolean(
    implementations.c?.trim() ||
      implementations.cpp?.trim() ||
      implementations.java?.trim() ||
      implementations.python?.trim()
  );
  const relatedProblems: Problem[] = Array.isArray(note?.relatedProblems)
    ? (note!.relatedProblems.filter((p) => p && typeof p === 'object') as Problem[])
    : [];
  const youtubeLink = Array.isArray(topic.resources?.youtube) ? topic.resources?.youtube[0] : null;
  const isYtSearch = youtubeLink?.url?.includes('results?search_query=');

  return (
    <div className="space-y-6 pb-12 print:bg-white print:text-black">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-[#8B949E]">
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-1.5 font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            DSA Roadmap
          </Link>
          {moduleObj?.title && (
            <>
              <span>/</span>
              <span className="font-medium text-[#38BDF8]">{moduleObj.title}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={togglingLearn}
            onClick={handleToggleLearned}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
              isCompleted
                ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
                : 'border-[#30363D] bg-[#1C2128] text-[#F0F6FC] hover:border-[#22C55E]/50'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? 'Learned ✓' : 'Mark as Learned'}
          </button>

          {note?._id && (
            <button
              type="button"
              disabled={togglingBookmark}
              onClick={handleToggleBookmark}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                isBookmarked
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                  : 'border-[#30363D] bg-[#1C2128] text-[#F0F6FC] hover:border-amber-400/50'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isBookmarked ? 'Bookmarked' : 'Bookmark Notes'}
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#1C2128] px-3.5 py-2 text-xs font-semibold text-[#F0F6FC] transition hover:border-[#38BDF8]/50"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <DifficultyBadge difficulty={topic.difficulty ?? 'Easy'} />
          <span className="rounded-full border border-[#30363D] bg-[#0D1117] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
            {topic.conceptType === 'theory' ? 'Theory Concept' : 'Concept + Practice'}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#F0F6FC] sm:text-3xl">
          {note?.title || topic.title}
        </h1>
        {note?.definition && (
          <MarkdownRenderer
            content={note.definition}
            className="mt-3 text-base text-[#F0F6FC]/90"
          />
        )}

        {/* Quick Resource Links */}
        <div className="mt-5 flex flex-wrap gap-2.5 print:hidden">
          {topic.resources?.leetcode?.url && (
            <a
              href={topic.resources.leetcode.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LeetCode: {topic.resources.leetcode.title || 'Practice'}
            </a>
          )}
          {topic.resources?.codechef?.url && (
            <a
              href={topic.resources.codechef.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              CodeChef: {topic.resources.codechef.title || 'Practice'}
            </a>
          )}
          {youtubeLink?.url && (
            <a
              href={youtubeLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              <Play className="h-3.5 w-3.5" />
              {isYtSearch ? 'YouTube Search: ' : ''}
              {youtubeLink.title || 'Tutorial'}
            </a>
          )}
        </div>
      </div>

      {/* Explanation & Real-World Analogy */}
      <div className="grid gap-6 lg:grid-cols-2">
        {note?.explanation && (
          <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#22C55E]">
              <BookOpen className="h-4 w-4" />
              Beginner-Friendly Explanation
            </h2>
            <MarkdownRenderer
              content={note.explanation}
              className="mt-3 text-sm text-[#F0F6FC]/90"
            />
          </section>
        )}

        {note?.realWorldAnalogy && (
          <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#38BDF8]">
              <Sparkles className="h-4 w-4" />
              Real-World Analogy
            </h2>
            <MarkdownRenderer
              content={note.realWorldAnalogy}
              className="mt-3 text-sm text-[#F0F6FC]/90"
            />
          </section>
        )}
      </div>

      {/* Algorithm Steps, Pseudocode, Dry Run */}
      {(note?.algorithm || note?.pseudocode || note?.dryRunExample) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {note.algorithm && (
            <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-6">
              <h2 className="text-base font-bold text-[#F0F6FC]">Algorithm / Key Steps</h2>
              <MarkdownRenderer
                content={note.algorithm}
                className="mt-3 text-sm text-[#8B949E]"
              />
            </section>
          )}

          {note.dryRunExample && (
            <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-6">
              <h2 className="text-base font-bold text-[#F0F6FC]">Dry Run & Example</h2>
              <div className="mt-3 rounded-xl border border-[#30363D] bg-[#0D1117] p-4 text-xs text-[#F0F6FC]/90">
                <MarkdownRenderer content={note.dryRunExample} />
              </div>
            </section>
          )}

          {note.pseudocode && (
            <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-6 lg:col-span-2">
              <h2 className="text-base font-bold text-[#F0F6FC]">Pseudocode</h2>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-4 font-mono text-xs leading-relaxed text-[#38BDF8]">
                {note.pseudocode}
              </pre>
            </section>
          )}
        </div>
      )}

      {/* Time & Space Complexity (shown when applicable) */}
      {(note?.timeComplexity || note?.spaceComplexity) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {note.timeComplexity && (
            <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22C55E]">
                <Clock className="h-4 w-4" />
                Time Complexity
              </div>
              <MarkdownRenderer content={note.timeComplexity} className="mt-2 text-sm text-[#F0F6FC]" />
            </div>
          )}
          {note.spaceComplexity && (
            <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
                <Cpu className="h-4 w-4" />
                Space Complexity
              </div>
              <MarkdownRenderer content={note.spaceComplexity} className="mt-2 text-sm text-[#F0F6FC]" />
            </div>
          )}
        </div>
      )}

      {/* 4-Language Implementations */}
      {hasAnyCode && (
        <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#F0F6FC]">
              <Code2 className="h-5 w-5 text-[#22C55E]" />
              Implementations (C, C++, Java, Python)
            </h2>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {LANG_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveLang(tab.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    activeLang === tab.key
                      ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                      : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                type="button"
                disabled={!activeCode}
                onClick={() => handleCopyCode(activeCode)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#1C2128] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="mt-4 overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-4 font-mono text-xs leading-relaxed text-[#F0F6FC]">
            <code>{activeCode || `// ${activeLang.toUpperCase()} implementation not applicable for this concept.`}</code>
          </pre>
        </section>
      )}

      {/* Common Mistakes & Interview Tips */}
      <div className="grid gap-6 lg:grid-cols-2">
        {note?.commonMistakes && note.commonMistakes.length > 0 && (
          <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Common Mistakes
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#8B949E]">
              {note.commonMistakes.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <MarkdownRenderer content={m} className="min-w-0 flex-1" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {note?.interviewTips && note.interviewTips.length > 0 && (
          <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#38BDF8]">
              <Lightbulb className="h-4 w-4" />
              Important Observations & Interview Tips
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#8B949E]">
              {note.interviewTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" />
                  <MarkdownRenderer content={tip} className="min-w-0 flex-1" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Related Practice Problems */}
      {relatedProblems.length > 0 && (
        <section className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6 print:hidden">
          <h2 className="text-base font-bold text-[#F0F6FC]">Related CodeClimb Practice Problems</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {relatedProblems.map((prob) => (
              <Link
                key={prob._id}
                to={`/practice/${encodeURIComponent(prob.slug)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-2 text-xs font-semibold text-[#22C55E] transition hover:bg-[#22C55E]/20"
              >
                <Code2 className="h-3.5 w-3.5" />
                {prob.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Previous / Next Topic Navigation */}
      {(topic.prevTopic || topic.nextTopic) && (
        <nav
          aria-label="Topic navigation"
          className="flex flex-col justify-between gap-3 border-t border-[#30363D] pt-6 sm:flex-row sm:items-center print:hidden"
        >
          {topic.prevTopic ? (
            <Link
              to={`/notes/${encodeURIComponent(topic.prevTopic.slug)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-xs font-semibold text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-[#8B949E]">Previous Topic</div>
                <div className="line-clamp-1">{topic.prevTopic.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {topic.nextTopic && (
            <Link
              to={`/notes/${encodeURIComponent(topic.nextTopic.slug)}`}
              className="inline-flex items-center justify-end gap-2 rounded-xl border border-[#30363D] bg-[#161B22] px-4 py-3 text-xs font-semibold text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E]"
            >
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-[#8B949E]">Next Topic</div>
                <div className="line-clamp-1">{topic.nextTopic.title}</div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
