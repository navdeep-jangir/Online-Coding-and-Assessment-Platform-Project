import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  FileText,
  Flag,
  History,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trophy,
} from 'lucide-react';
import api, { ApiClientError, bookmarksApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import {
  CodeEditor,
} from '@/components/editor/CodeEditor';
import {
  DEFAULT_STARTER_CODE,
  EDITOR_LANGUAGES,
  EDITOR_THEMES,
  type EditorTheme,
  type SupportedEditorLanguage,
} from '@/components/editor/editorConstants';
import { ResizablePanel } from '@/components/editor/ResizablePanel';
import {
  TestCasePanel,
  type BottomPanelTab,
  type ExecutionErrorInfo,
  type ExecutionResult,
  type NormalizedCaseResult,
  type NormalizedTestCase,
} from '@/components/editor/TestCasePanel';
import {
  cn,
  copyToClipboard,
  formatDate,
  formatRelativeTime,
  getLanguageLabel,
  getStatusColorClass,
} from '@/utils/helpers';
import type { ProblemExample, Topic } from '@/types';

type LeftPanelTab = 'description' | 'submissions' | 'editorial';
type AutosaveState = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';

interface NormalizedProblem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: ProblemExample[];
  sampleTestCases: NormalizedTestCase[];
  difficulty: string;
  topics: string[];
  tags: string[];
  hints: string[];
  starterCode: Record<SupportedEditorLanguage, string>;
  editorial: string;
  optimalApproach: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  solutionCode?: Partial<Record<string, string>>;
  timeLimit?: number;
  memoryLimit?: number;
  isSolved: boolean;
  isBookmarked: boolean;
}

interface NormalizedSubmission {
  _id: string;
  verdict: string;
  language: string;
  code: string;
  runtime?: number;
  memory?: number;
  passedTestCases?: number;
  totalTestCases?: number;
  submittedAt: string;
  errorMessage?: string;
  compilerOutput?: string;
}

const AUTOSAVE_INTERVAL_MS = 30_000;
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  x: ((index * 37) % 100) - 50,
  delay: (index % 7) * 0.04,
  duration: 1.1 + (index % 5) * 0.18,
  rotate: ((index * 53) % 360) - 180,
  color: ['#22C55E', '#38BDF8', '#F59E0B', '#A855F7', '#F0F6FC'][index % 5],
}));

function unwrapData<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw && 'success' in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

function isSupportedLanguage(lang: unknown): lang is SupportedEditorLanguage {
  return lang === 'c' || lang === 'cpp' || lang === 'java' || lang === 'python';
}

function formatEditorLanguageLabel(lang: string): string {
  const normalized = lang.trim().toLowerCase();
  const labels: Record<string, string> = {
    c: 'C',
    cpp: 'C++',
    java: 'Java',
    python: 'Python',
  };
  return labels[normalized] ?? getLanguageLabel(lang);
}

function normalizeConstraints(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeSampleTestCases(
  problemObj: Record<string, unknown>,
  examples: ProblemExample[],
  extraCases?: unknown
): NormalizedTestCase[] {
  const candidates = Array.isArray(extraCases)
    ? extraCases
    : Array.isArray(problemObj.sampleTestCases)
      ? problemObj.sampleTestCases
      : Array.isArray(problemObj.testCases)
        ? (problemObj.testCases as Array<Record<string, unknown>>).filter(
            (tc) => tc.isSample === true || tc.isHidden !== true
          )
        : [];

  if (candidates.length > 0) {
    return candidates.map((tc, index) => {
      const item = tc as Record<string, unknown>;
      return {
        id: String(item._id ?? `sample-${index}`),
        index,
        input: String(item.input ?? ''),
        expectedOutput: String(item.expectedOutput ?? item.output ?? ''),
        explanation: typeof item.explanation === 'string' ? item.explanation : undefined,
        isSample: true,
      };
    });
  }

  return examples.map((ex, index) => ({
    id: `example-${index}`,
    index,
    input: ex.input ?? '',
    expectedOutput: ex.output ?? '',
    explanation: ex.explanation,
    isSample: true,
  }));
}

function normalizeProblemResponse(raw: unknown): NormalizedProblem {
  const payload = unwrapData<Record<string, unknown>>(raw);
  const problemObj =
    payload && typeof payload === 'object' && 'problem' in payload && payload.problem
      ? (payload.problem as Record<string, unknown>)
      : payload;

  const examplesRaw = Array.isArray(problemObj.examples) ? problemObj.examples : [];
  const examples: ProblemExample[] = examplesRaw.map((ex) => {
    const item = ex as Record<string, unknown>;
    return {
      input: String(item.input ?? ''),
      output: String(item.output ?? ''),
      explanation: typeof item.explanation === 'string' ? item.explanation : undefined,
    };
  });

  const sampleTestCases = normalizeSampleTestCases(
    problemObj,
    examples,
    payload?.sampleTestCases
  );

  const rawStarter = (problemObj.starterCode ?? {}) as Record<string, unknown>;
  const starterCode: Record<SupportedEditorLanguage, string> = {
    c: typeof rawStarter.c === 'string' && rawStarter.c.trim() ? rawStarter.c : DEFAULT_STARTER_CODE.c,
    cpp:
      typeof rawStarter.cpp === 'string' && rawStarter.cpp.trim()
        ? rawStarter.cpp
        : DEFAULT_STARTER_CODE.cpp,
    java:
      typeof rawStarter.java === 'string' && rawStarter.java.trim()
        ? rawStarter.java
        : DEFAULT_STARTER_CODE.java,
    python:
      typeof rawStarter.python === 'string' && rawStarter.python.trim()
        ? rawStarter.python
        : DEFAULT_STARTER_CODE.python,
  };

  const topicTitles: string[] = [];
  if (Array.isArray(problemObj.topics)) {
    for (const t of problemObj.topics) {
      if (typeof t === 'string') topicTitles.push(t);
      else if (t && typeof t === 'object' && 'title' in t) {
        topicTitles.push(String((t as Topic).title));
      }
    }
  } else if (problemObj.topic) {
    if (typeof problemObj.topic === 'string') topicTitles.push(problemObj.topic);
    else if (typeof problemObj.topic === 'object' && 'title' in problemObj.topic) {
      topicTitles.push(String((problemObj.topic as Topic).title));
    }
  }

  const tags = Array.isArray(problemObj.tags)
    ? problemObj.tags.map((tag) => String(tag)).filter(Boolean)
    : [];

  const hints = Array.isArray(problemObj.hints)
    ? problemObj.hints.map((h) => String(h)).filter(Boolean)
    : [];

  return {
    _id: String(problemObj._id ?? ''),
    title: String(problemObj.title ?? 'Untitled Problem'),
    slug: String(problemObj.slug ?? ''),
    description: String(problemObj.description ?? ''),
    inputFormat: String(problemObj.inputFormat ?? ''),
    outputFormat: String(problemObj.outputFormat ?? ''),
    constraints: normalizeConstraints(problemObj.constraints),
    examples,
    sampleTestCases,
    difficulty: String(problemObj.difficulty ?? 'Easy'),
    topics: topicTitles,
    tags,
    hints,
    starterCode,
    editorial: String(problemObj.editorial ?? problemObj.solutionExplanation ?? ''),
    optimalApproach: String(problemObj.optimalApproach ?? problemObj.approach ?? ''),
    timeComplexity:
      typeof problemObj.timeComplexity === 'string' ? problemObj.timeComplexity : undefined,
    spaceComplexity:
      typeof problemObj.spaceComplexity === 'string' ? problemObj.spaceComplexity : undefined,
    solutionCode:
      problemObj.solutionCode && typeof problemObj.solutionCode === 'object'
        ? (problemObj.solutionCode as Partial<Record<string, string>>)
        : undefined,
    timeLimit:
      typeof problemObj.timeLimit === 'number'
        ? problemObj.timeLimit
        : typeof problemObj.timeLimitMs === 'number'
          ? problemObj.timeLimitMs
          : undefined,
    memoryLimit:
      typeof problemObj.memoryLimit === 'number'
        ? problemObj.memoryLimit
        : typeof problemObj.memoryLimitMb === 'number'
          ? problemObj.memoryLimitMb * 1024
          : undefined,
    isSolved: Boolean(problemObj.isSolved ?? problemObj.solved ?? payload?.isSolved),
    isBookmarked: Boolean(
      problemObj.isBookmarked ?? problemObj.bookmarked ?? payload?.isBookmarked
    ),
  };
}

function extractDraftCodeForLanguage(
  raw: unknown,
  language: SupportedEditorLanguage
): string | null {
  const payload = unwrapData<unknown>(raw);
  if (!payload) return null;

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    const matched = payload.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        String((item as Record<string, unknown>).language ?? '').toLowerCase() === language
    ) as Record<string, unknown> | undefined;

    if (matched && typeof matched.code === 'string') {
      return matched.code;
    }
    return null;
  }

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj[language] === 'string') {
      return obj[language] as string;
    }
    if (Array.isArray(obj.drafts)) {
      return extractDraftCodeForLanguage(obj.drafts, language);
    }
    if (obj.draft && typeof obj.draft === 'object') {
      return extractDraftCodeForLanguage(obj.draft, language);
    }
    if (typeof obj.code === 'string') {
      const draftLang = typeof obj.language === 'string' ? obj.language.toLowerCase() : null;
      if (!draftLang || draftLang === language) {
        return obj.code;
      }
    }
  }

  return null;
}

function normalizeSubmissionsResponse(raw: unknown): NormalizedSubmission[] {
  const payload = unwrapData<unknown>(raw);
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? Array.isArray((payload as Record<string, unknown>).submissions)
        ? ((payload as Record<string, unknown>).submissions as unknown[])
        : Array.isArray((payload as Record<string, unknown>).data)
          ? ((payload as Record<string, unknown>).data as unknown[])
          : []
      : [];

  return list
    .map((entry, idx): NormalizedSubmission | null => {
      if (!entry || typeof entry !== 'object') return null;
      const item = entry as Record<string, unknown>;
      return {
        _id: String(item._id ?? `sub-${idx}`),
        verdict: String(item.verdict ?? item.status ?? 'Pending'),
        language: String(item.language ?? 'cpp'),
        code: String(item.code ?? ''),
        runtime:
          typeof item.runtime === 'number'
            ? item.runtime
            : typeof item.executionTimeMs === 'number'
              ? item.executionTimeMs
              : undefined,
        memory:
          typeof item.memory === 'number'
            ? item.memory
            : typeof item.memoryKb === 'number'
              ? item.memoryKb
              : undefined,
        passedTestCases:
          typeof item.passedTestCases === 'number' ? item.passedTestCases : undefined,
        totalTestCases:
          typeof item.totalTestCases === 'number' ? item.totalTestCases : undefined,
        submittedAt: String(item.submittedAt ?? item.createdAt ?? ''),
        errorMessage: typeof item.errorMessage === 'string' ? item.errorMessage : undefined,
        compilerOutput:
          typeof item.compilerOutput === 'string'
            ? item.compilerOutput
            : typeof item.compileOutput === 'string'
              ? item.compileOutput
              : undefined,
      };
    })
    .filter((sub): sub is NormalizedSubmission => sub !== null);
}

function normalizeExecutionResult(raw: unknown, isSubmit: boolean): ExecutionResult {
  const payload = unwrapData<Record<string, unknown>>(raw);
  const root =
    payload && typeof payload === 'object' && payload.submission && typeof payload.submission === 'object'
      ? { ...payload, ...(payload.submission as Record<string, unknown>) }
      : payload;

  const rawResults = Array.isArray(root?.results)
    ? root.results
    : Array.isArray(root?.testCaseResults)
      ? root.testCaseResults
      : [];

  const parsedResults: NormalizedCaseResult[] = rawResults.map((entry, index) => {
    const item = (entry ?? {}) as Record<string, unknown>;
    const status = String(item.status ?? item.verdict ?? (item.passed ? 'Accepted' : 'Wrong Answer'));
    const passed =
      typeof item.passed === 'boolean' ? item.passed : status.toLowerCase() === 'accepted';
    return {
      testCaseIndex: typeof item.testCaseIndex === 'number' ? item.testCaseIndex : index,
      passed,
      status,
      input: item.input !== undefined ? String(item.input) : undefined,
      expectedOutput:
        item.expectedOutput !== undefined ? String(item.expectedOutput) : undefined,
      actualOutput: item.actualOutput !== undefined ? String(item.actualOutput) : undefined,
      stderr: typeof item.stderr === 'string' && item.stderr ? item.stderr : undefined,
      runtime:
        typeof item.runtime === 'number'
          ? item.runtime
          : typeof item.runtimeMs === 'number'
            ? item.runtimeMs
            : typeof item.executionTimeMs === 'number'
              ? item.executionTimeMs
              : undefined,
      memory:
        typeof item.memory === 'number'
          ? item.memory
          : typeof item.memoryKb === 'number'
            ? item.memoryKb
            : undefined,
      isHidden: Boolean(item.isHidden),
    };
  });

  const hasCustomRunOutput =
    parsedResults.length === 0 &&
    !isSubmit &&
    (root?.stdout !== undefined ||
      root?.stderr !== undefined ||
      root?.compileOutput !== undefined ||
      root?.verdict !== undefined);

  const customRuntime =
    typeof root?.runtime === 'number'
      ? root.runtime
      : typeof root?.runtimeMs === 'number'
        ? root.runtimeMs
        : typeof root?.executionTimeMs === 'number'
          ? root.executionTimeMs
          : undefined;
  const customMemory =
    typeof root?.memory === 'number'
      ? root.memory
      : typeof root?.memoryKb === 'number'
        ? root.memoryKb
        : undefined;

  const results: NormalizedCaseResult[] = hasCustomRunOutput
    ? [
        {
          testCaseIndex: 0,
          passed: String(root?.verdict ?? root?.status ?? 'Accepted').toLowerCase() === 'accepted',
          status: String(root?.verdict ?? root?.status ?? 'Accepted'),
          actualOutput: root?.stdout !== undefined ? String(root.stdout) : undefined,
          stderr: typeof root?.stderr === 'string' && root.stderr ? root.stderr : undefined,
          runtime: customRuntime,
          memory: customMemory,
          isHidden: false,
        },
      ]
    : parsedResults;

  const derivedVerdict =
    results.length > 0
      ? results.every((r) => r.passed)
        ? 'Accepted'
        : results.find((r) => !r.passed)?.status ?? 'Wrong Answer'
      : 'Pending';

  const verdict = String(root?.verdict ?? root?.status ?? derivedVerdict);
  const passedTestCases =
    typeof root?.passedTestCases === 'number'
      ? root.passedTestCases
      : typeof root?.passed === 'number'
        ? root.passed
        : results.filter((r) => r.passed).length;
  const totalTestCases =
    typeof root?.totalTestCases === 'number'
      ? root.totalTestCases
      : typeof root?.total === 'number'
        ? root.total
        : results.length;

  const aggregatedRuntime = results.some((r) => typeof r.runtime === 'number')
    ? results.reduce((sum, r) => sum + (r.runtime ?? 0), 0)
    : undefined;
  const aggregatedMemory = results.some((r) => typeof r.memory === 'number')
    ? Math.max(...results.map((r) => r.memory ?? 0))
    : undefined;

  return {
    verdict,
    passedTestCases,
    totalTestCases,
    runtime: customRuntime ?? aggregatedRuntime,
    memory: customMemory ?? aggregatedMemory,
    compilerOutput:
      typeof root?.compilerOutput === 'string'
        ? root.compilerOutput
        : typeof root?.compileOutput === 'string'
          ? root.compileOutput
          : undefined,
    errorMessage: typeof root?.errorMessage === 'string' ? root.errorMessage : undefined,
    results,
    isSubmit,
    xpEarned:
      typeof root?.xpEarned === 'number'
        ? root.xpEarned
        : typeof root?.xpAwarded === 'number'
          ? root.xpAwarded
          : undefined,
  };
}

function buildExecutionErrorInfo(err: unknown): ExecutionErrorInfo {
  if (err instanceof ApiClientError) {
    const lower = err.message.toLowerCase();
    const isUnavailable =
      err.isNetworkError ||
      err.statusCode === 502 ||
      err.statusCode === 503 ||
      err.statusCode === 504 ||
      lower.includes('unavailable') ||
      lower.includes('judge0') ||
      lower.includes('econnrefused') ||
      lower.includes('timed out');
    return {
      message: err.message,
      isServiceUnavailable: isUnavailable,
      statusCode: err.statusCode,
    };
  }
  return {
    message: err instanceof Error ? err.message : 'An unexpected execution error occurred.',
    isServiceUnavailable: false,
  };
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="rounded border border-[#30363D] bg-[#0D1117] px-1.5 py-0.5 font-mono text-[12px] text-[#38BDF8]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-[#F0F6FC]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="italic text-[#F0F6FC]/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function MarkdownContent({ content }: { content: string }) {
  if (!content.trim()) return null;

  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-[#F0F6FC]/90">
      {blocks.map((block, blockIdx) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).split(/\r?\n/);
          const firstLine = lines[0]?.trim() ?? '';
          const hasLangTag = /^[a-zA-Z0-9+#_-]+$/.test(firstLine);
          const codeBody = (hasLangTag ? lines.slice(1) : lines).join('\n').trim();
          return (
            <pre
              key={blockIdx}
              className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-3.5 font-mono text-xs text-[#F0F6FC]"
            >
              <code>{codeBody}</code>
            </pre>
          );
        }

        const paragraphs = block
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);

        return paragraphs.map((para, paraIdx) => {
          const lines = para.split(/\r?\n/);

          if (lines.length === 1 && lines[0].startsWith('### ')) {
            return (
              <h4 key={`${blockIdx}-${paraIdx}`} className="pt-2 text-sm font-semibold text-[#F0F6FC]">
                {renderInlineMarkdown(lines[0].slice(4))}
              </h4>
            );
          }
          if (lines.length === 1 && lines[0].startsWith('## ')) {
            return (
              <h3 key={`${blockIdx}-${paraIdx}`} className="pt-2 text-base font-bold text-[#F0F6FC]">
                {renderInlineMarkdown(lines[0].slice(3))}
              </h3>
            );
          }
          if (lines.length === 1 && lines[0].startsWith('# ')) {
            return (
              <h2 key={`${blockIdx}-${paraIdx}`} className="pt-2 text-lg font-bold text-[#F0F6FC]">
                {renderInlineMarkdown(lines[0].slice(2))}
              </h2>
            );
          }

          if (lines.every((l) => /^[-*•]\s+/.test(l.trim()))) {
            return (
              <ul
                key={`${blockIdx}-${paraIdx}`}
                className="list-disc space-y-1.5 pl-5 text-sm text-[#F0F6FC]/90"
              >
                {lines.map((line, lIdx) => (
                  <li key={lIdx}>{renderInlineMarkdown(line.trim().replace(/^[-*•]\s+/, ''))}</li>
                ))}
              </ul>
            );
          }

          if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
            return (
              <ol
                key={`${blockIdx}-${paraIdx}`}
                className="list-decimal space-y-1.5 pl-5 text-sm text-[#F0F6FC]/90"
              >
                {lines.map((line, lIdx) => (
                  <li key={lIdx}>{renderInlineMarkdown(line.trim().replace(/^\d+\.\s+/, ''))}</li>
                ))}
              </ol>
            );
          }

          if (lines.every((l) => l.trim().startsWith('>'))) {
            return (
              <blockquote
                key={`${blockIdx}-${paraIdx}`}
                className="border-l-2 border-[#22C55E] bg-[#0D1117]/60 px-3.5 py-2 text-sm italic text-[#8B949E]"
              >
                {lines.map((l) => l.trim().replace(/^>\s?/, '')).join(' ')}
              </blockquote>
            );
          }

          return (
            <p key={`${blockIdx}-${paraIdx}`} className="whitespace-pre-line">
              {renderInlineMarkdown(para)}
            </p>
          );
        });
      })}
    </div>
  );
}

export function ProblemSolvePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [problem, setProblem] = useState<NormalizedProblem | null>(null);
  const [isProblemLoading, setIsProblemLoading] = useState<boolean>(true);
  const [problemError, setProblemError] = useState<string | null>(null);

  const [leftTab, setLeftTab] = useState<LeftPanelTab>('description');
  const [bottomTab, setBottomTab] = useState<BottomPanelTab>('testcases');

  const [searchParams] = useSearchParams();
  const queryLang = searchParams.get('lang');
  const storedLang = (() => {
    try {
      return localStorage.getItem('codeclimb_preferred_language');
    } catch {
      return null;
    }
  })();
  const resolvedPreferredLang: SupportedEditorLanguage = isSupportedLanguage(queryLang)
    ? queryLang
    : isSupportedLanguage(storedLang)
      ? storedLang
      : isSupportedLanguage(user?.preferredLanguage)
        ? user.preferredLanguage
        : 'cpp';

  const [language, setLanguage] = useState<SupportedEditorLanguage>(resolvedPreferredLang);
  const [theme, setTheme] = useState<EditorTheme>('vs-dark');
  const [fontSize, setFontSize] = useState<number>(() => user?.preferences?.editorFontSize ?? 14);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [codeByLanguage, setCodeByLanguage] = useState<Record<SupportedEditorLanguage, string>>({
    ...DEFAULT_STARTER_CODE,
  });
  const loadedDraftLanguagesRef = useRef<Set<SupportedEditorLanguage>>(new Set());
  const lastSavedCodeRef = useRef<Partial<Record<SupportedEditorLanguage, string>>>({});

  const [autosaveState, setAutosaveState] = useState<AutosaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBookmarking, setIsBookmarking] = useState<boolean>(false);
  const [isMarkingRevision, setIsMarkingRevision] = useState<boolean>(false);
  const [revisionMarked, setRevisionMarked] = useState<boolean>(false);

  const [submissions, setSubmissions] = useState<NormalizedSubmission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState<boolean>(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  const [selectedTestCaseIndices, setSelectedTestCaseIndices] = useState<number[]>([]);
  const [customInput, setCustomInput] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<ExecutionErrorInfo | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitProgress, setSubmitProgress] = useState<number>(0);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showGreenFlash, setShowGreenFlash] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const currentCode = codeByLanguage[language] ?? '';

  // Keep refs updated for stable autosave interval
  const problemIdRef = useRef<string>('');
  const languageRef = useRef<SupportedEditorLanguage>(language);
  const currentCodeRef = useRef<string>(currentCode);

  useEffect(() => {
    problemIdRef.current = problem?._id ?? '';
  }, [problem?._id]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    currentCodeRef.current = currentCode;
  }, [currentCode]);

  const fetchProblemAndDraft = useCallback(async () => {
    if (!slug) {
      setProblemError('No problem slug specified.');
      setIsProblemLoading(false);
      return;
    }

    setIsProblemLoading(true);
    setProblemError(null);
    setLeftTab('description');
    setBottomTab('testcases');
    setSubmissions([]);
    setSubmissionsError(null);
    setExecutionResult(null);
    setExecutionError(null);
    setCustomInput('');
    setSelectedEditorialLang('');
    setAutosaveState('idle');
    setLastSavedAt(null);
    setStatusBanner(null);
    setOpenHints({});
    loadedDraftLanguagesRef.current = new Set();
    lastSavedCodeRef.current = {};

    try {
      const response = await api.get(`/problems/${encodeURIComponent(slug)}`);
      const normalized = normalizeProblemResponse(response.data);
      setProblem(normalized);

      const initialIndices = normalized.sampleTestCases.map((tc) => tc.index);
      setSelectedTestCaseIndices(initialIndices);
      if (normalized.sampleTestCases[0]) {
        setCustomInput(normalized.sampleTestCases[0].input);
      }

      const initialLang: SupportedEditorLanguage = resolvedPreferredLang;
      setLanguage(initialLang);

      const initialMap: Record<SupportedEditorLanguage, string> = { ...normalized.starterCode };

      if (normalized._id) {
        try {
          const draftRes = await api.get(
            `/code-drafts/${encodeURIComponent(normalized._id)}`,
            { params: { language: initialLang } }
          );
          const draftCode = extractDraftCodeForLanguage(draftRes.data, initialLang);
          if (draftCode !== null) {
            initialMap[initialLang] = draftCode;
            lastSavedCodeRef.current[initialLang] = draftCode;
            setAutosaveState('saved');
          } else {
            lastSavedCodeRef.current[initialLang] = initialMap[initialLang];
          }
          loadedDraftLanguagesRef.current.add(initialLang);
        } catch {
          // Draft may not exist yet (404) or user may be guest
          lastSavedCodeRef.current[initialLang] = initialMap[initialLang];
        }
      }

      setCodeByLanguage(initialMap);
    } catch (err) {
      setProblemError(
        err instanceof ApiClientError ? err.message : 'Failed to load problem details.'
      );
      setProblem(null);
    } finally {
      setIsProblemLoading(false);
    }
  }, [slug, resolvedPreferredLang]);

  useEffect(() => {
    void fetchProblemAndDraft();
  }, [fetchProblemAndDraft]);

  // Lazy-fetch draft when switching to another language for the first time
  useEffect(() => {
    if (!problem?._id) return;
    if (loadedDraftLanguagesRef.current.has(language)) return;

    let isCancelled = false;

    const loadLanguageDraft = async () => {
      try {
        const draftRes = await api.get(
          `/code-drafts/${encodeURIComponent(problem._id)}`,
          { params: { language } }
        );
        if (isCancelled) return;
        loadedDraftLanguagesRef.current.add(language);
        const draftCode = extractDraftCodeForLanguage(draftRes.data, language);
        if (draftCode !== null) {
          setCodeByLanguage((prev) => ({ ...prev, [language]: draftCode }));
          lastSavedCodeRef.current[language] = draftCode;
          setAutosaveState('saved');
        } else {
          lastSavedCodeRef.current[language] = problem.starterCode[language];
        }
      } catch {
        if (!isCancelled) {
          loadedDraftLanguagesRef.current.add(language);
          lastSavedCodeRef.current[language] = problem.starterCode[language];
        }
      }
    };

    void loadLanguageDraft();

    return () => {
      isCancelled = true;
    };
  }, [language, problem?._id, problem?.starterCode]);

  const saveDraftNow = useCallback(
    async (force = false) => {
      const targetProblemId = problemIdRef.current;
      const targetLang = languageRef.current;
      const targetCode = currentCodeRef.current;

      if (!targetProblemId) return;
      if (!force && lastSavedCodeRef.current[targetLang] === targetCode) {
        return;
      }

      setAutosaveState('saving');
      try {
        await api.post('/code-drafts', {
          problemId: targetProblemId,
          language: targetLang,
          code: targetCode,
        });
        lastSavedCodeRef.current[targetLang] = targetCode;
        setAutosaveState('saved');
        setLastSavedAt(new Date());
      } catch {
        setAutosaveState('error');
      }
    },
    []
  );

  // Autosave drafts every 30 seconds
  useEffect(() => {
    if (!problem?._id) return;

    const intervalId = window.setInterval(() => {
      void saveDraftNow(false);
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [problem?._id, saveDraftNow]);

  // Escape exits fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Auto-dismiss transient status banner
  useEffect(() => {
    if (!statusBanner) return;
    const timer = window.setTimeout(() => {
      setStatusBanner(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [statusBanner]);

  const fetchSubmissions = useCallback(async (problemId: string) => {
    setIsSubmissionsLoading(true);
    setSubmissionsError(null);
    try {
      const response = await api.get(`/submissions/problem/${encodeURIComponent(problemId)}`);
      setSubmissions(normalizeSubmissionsResponse(response.data));
    } catch (err) {
      setSubmissionsError(
        err instanceof ApiClientError ? err.message : 'Unable to fetch past submissions.'
      );
    } finally {
      setIsSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (leftTab === 'submissions' && problem?._id) {
      void fetchSubmissions(problem._id);
    }
  }, [fetchSubmissions, leftTab, problem?._id]);

  const handleCodeChange = (nextCode: string) => {
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: nextCode,
    }));
    if (lastSavedCodeRef.current[language] !== nextCode) {
      setAutosaveState('unsaved');
    } else {
      setAutosaveState('saved');
    }
  };

  const handleResetCode = () => {
    if (!problem) return;
    const starter = problem.starterCode[language] ?? DEFAULT_STARTER_CODE[language];
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: starter,
    }));
    setAutosaveState('unsaved');
    setIsResetDialogOpen(false);
    setStatusBanner(`Reset ${formatEditorLanguageLabel(language)} editor to starter code.`);
  };

  const handleToggleBookmark = async () => {
    if (!problem?._id || isBookmarking) return;

    const previous = problem.isBookmarked;
    setProblem((prev) => (prev ? { ...prev, isBookmarked: !previous } : prev));
    setIsBookmarking(true);

    try {
      const res = await bookmarksApi.toggleBookmark({
        itemType: 'problem',
        itemId: problem._id,
      });
      const confirmed = res.data?.bookmarked ?? !previous;
      setProblem((prev) => (prev ? { ...prev, isBookmarked: confirmed } : prev));
    } catch (err) {
      setProblem((prev) => (prev ? { ...prev, isBookmarked: previous } : prev));
      setStatusBanner(
        err instanceof ApiClientError ? err.message : 'Failed to update bookmark.'
      );
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleToggleTestCase = (index: number) => {
    setSelectedTestCaseIndices((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index].sort((a, b) => a - b)
    );
  };

  const handleSelectAllTestCases = (selectAll: boolean) => {
    if (!problem) return;
    setSelectedTestCaseIndices(selectAll ? problem.sampleTestCases.map((tc) => tc.index) : []);
  };

  const handleRunCode = useCallback(async () => {
    if (!problem?._id || isRunning || isSubmitting) return;

    setIsRunning(true);
    setExecutionError(null);
    setBottomTab('result');

    const useCustom = bottomTab === 'custom';
    const selectedCases = problem.sampleTestCases.filter((tc) =>
      selectedTestCaseIndices.includes(tc.index)
    );
    const casesToSend =
      selectedCases.length > 0 ? selectedCases : problem.sampleTestCases;

    const payload: Record<string, unknown> = {
      problemId: problem._id,
      language,
      code: currentCode,
    };

    if (useCustom) {
      payload.customInput = customInput;
    } else {
      payload.testCases = casesToSend.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }));
      payload.testCaseIndices = casesToSend.map((tc) => tc.index);
    }

    try {
      const response = await api.post('/submissions/run', payload);
      const normalized = normalizeExecutionResult(response.data, false);
      setExecutionResult(normalized);
    } catch (err) {
      setExecutionResult(null);
      setExecutionError(buildExecutionErrorInfo(err));
    } finally {
      setIsRunning(false);
    }
  }, [
    bottomTab,
    currentCode,
    customInput,
    isRunning,
    isSubmitting,
    language,
    problem,
    selectedTestCaseIndices,
  ]);

  const handleSubmitCode = useCallback(async () => {
    if (!problem?._id || isRunning || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitProgress(18);
    setExecutionError(null);
    setBottomTab('result');

    const progressTimer = window.setInterval(() => {
      setSubmitProgress((prev) => (prev < 88 ? prev + Math.max(3, (90 - prev) * 0.22) : prev));
    }, 350);

    try {
      const response = await api.post('/submissions/submit', {
        problemId: problem._id,
        language,
        code: currentCode,
      });

      window.clearInterval(progressTimer);
      setSubmitProgress(100);

      const normalized = normalizeExecutionResult(response.data, true);
      setExecutionResult(normalized);

      if (normalized.verdict.toLowerCase() === 'accepted') {
        setProblem((prev) => (prev ? { ...prev, isSolved: true } : prev));
        setShowGreenFlash(true);
        setShowCelebration(true);
        window.setTimeout(() => setShowGreenFlash(false), 950);
        window.setTimeout(() => setShowCelebration(false), 2600);
        const submitPayload = (response.data as { data?: Record<string, unknown> })?.data ?? response.data;
        if (submitPayload && (submitPayload as Record<string, unknown>).dailyChallengeCompleted) {
          const bonus = Number((submitPayload as Record<string, unknown>).dailyChallengeXpAwarded || 20);
          setStatusBanner(
            bonus > 0
              ? `Daily Challenge completed! Earned +${bonus} bonus XP.`
              : 'Daily Challenge already completed today.'
          );
        }
      }

      // Refresh past submissions in background
      void fetchSubmissions(problem._id);
    } catch (err) {
      window.clearInterval(progressTimer);
      setExecutionResult(null);
      setExecutionError(buildExecutionErrorInfo(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [currentCode, fetchSubmissions, isRunning, isSubmitting, language, problem?._id]);

  const handleLoadSubmissionCode = (submission: NormalizedSubmission) => {
    const targetLang: SupportedEditorLanguage = isSupportedLanguage(submission.language)
      ? submission.language
      : language;
    setLanguage(targetLang);
    setCodeByLanguage((prev) => ({
      ...prev,
      [targetLang]: submission.code,
    }));
    setAutosaveState('unsaved');
    setStatusBanner(
      `Loaded ${formatEditorLanguageLabel(submission.language)} code from submission (${submission.verdict}).`
    );
  };

  const handleCopyText = async (id: string, value: string) => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1500);
    }
  };

  const editorialSolutionEntries = useMemo(() => {
    if (!problem?.solutionCode) return [];
    return Object.entries(problem.solutionCode).filter(
      ([, code]) => typeof code === 'string' && code.trim().length > 0
    );
  }, [problem?.solutionCode]);

  const [selectedEditorialLang, setSelectedEditorialLang] = useState<string>('');
  useEffect(() => {
    if (editorialSolutionEntries.length > 0 && !selectedEditorialLang) {
      setSelectedEditorialLang(editorialSolutionEntries[0][0]);
    }
  }, [editorialSolutionEntries, selectedEditorialLang]);

  if (isProblemLoading) {
    return (
      <div className="dark min-h-screen bg-[#0D1117] p-6 text-[#F0F6FC]">
        <div className="mx-auto max-w-7xl space-y-4">
          <LoadingSkeleton variant="title" width="280px" />
          <div className="grid h-[calc(100vh-140px)] grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
              <LoadingSkeleton variant="text" count={8} />
            </div>
            <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
              <LoadingSkeleton variant="code" className="h-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (problemError || !problem) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#0D1117] p-6 text-[#F0F6FC]">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={AlertCircle}
            title="Could not load problem"
            description={problemError ?? 'The requested problem could not be found.'}
            action={{
              label: 'Retry',
              onClick: () => void fetchProblemAndDraft(),
              icon: RefreshCw,
            }}
            secondaryAction={{
              label: 'Back to Practice Arena',
              onClick: () => navigate('/practice'),
            }}
          />
        </div>
      </div>
    );
  }

  const leftPanelContent = (
    <div className="flex h-full flex-col bg-[#161B22] border-r border-[#30363D]">
      {/* Left Panel Tabs */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#30363D] px-3">
        <div className="flex items-center gap-1" role="tablist" aria-label="Problem sections">
          <button
            type="button"
            role="tab"
            aria-selected={leftTab === 'description'}
            onClick={() => setLeftTab('description')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition',
              leftTab === 'description'
                ? 'text-[#F0F6FC]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <FileText className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
            <span>Description</span>
            {leftTab === 'description' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#22C55E]" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={leftTab === 'submissions'}
            onClick={() => setLeftTab('submissions')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition',
              leftTab === 'submissions'
                ? 'text-[#F0F6FC]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <History className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>Submissions</span>
            {leftTab === 'submissions' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#22C55E]" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={leftTab === 'editorial'}
            onClick={() => setLeftTab('editorial')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition',
              leftTab === 'editorial'
                ? 'text-[#F0F6FC]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>Editorial</span>
            {leftTab === 'editorial' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#22C55E]" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={async () => {
              if (!problem?._id || isMarkingRevision) return;
              setIsMarkingRevision(true);
              try {
                await api.post('/revisions', {
                  problemId: problem._id,
                  reason: 'difficult',
                });
                setRevisionMarked(true);
                setStatusBanner('Marked as difficult and added to Revision Mode.');
              } catch (err) {
                setStatusBanner(
                  err instanceof ApiClientError ? err.message : 'Failed to add to Revision Mode.'
                );
              } finally {
                setIsMarkingRevision(false);
              }
            }}
            disabled={isMarkingRevision}
            title="Mark as difficult and add to Revision Mode"
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
              revisionMarked
                ? 'border-rose-400/40 bg-rose-400/15 text-rose-300'
                : 'border-[#30363D] bg-[#1C2128] text-[#8B949E] hover:border-rose-400/40 hover:text-rose-300'
            )}
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{revisionMarked ? 'In Revision' : 'Difficult'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleToggleBookmark()}
            disabled={isBookmarking}
            aria-label={problem.isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
            aria-pressed={problem.isBookmarked}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
              problem.isBookmarked
                ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                : 'border-[#30363D] bg-[#1C2128] text-[#8B949E] hover:border-[#22C55E]/40 hover:text-[#F0F6FC]'
            )}
          >
            <Bookmark
              className={cn('h-3.5 w-3.5', problem.isBookmarked && 'fill-current')}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{problem.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>

      {/* Left Panel Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {leftTab === 'description' && (
          <div className="space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#F0F6FC]">{problem.title}</h1>
                <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                {problem.isSolved && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/15 px-2.5 py-0.5 text-xs font-semibold text-[#22C55E]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Solved
                  </span>
                )}
              </div>

              {(problem.topics.length > 0 || problem.tags.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...new Set([...problem.topics, ...problem.tags])].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-[#30363D] bg-[#1C2128] px-2 py-0.5 text-[11px] font-medium text-[#8B949E]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {(problem.timeLimit || problem.memoryLimit) && (
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#8B949E]">
                  {problem.timeLimit && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                      Time Limit: <strong className="text-[#F0F6FC]">{problem.timeLimit} ms</strong>
                    </span>
                  )}
                  {problem.memoryLimit && (
                    <span className="inline-flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
                      Memory Limit:{' '}
                      <strong className="text-[#F0F6FC]">
                        {Math.round(problem.memoryLimit / 1024)} MB
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Problem Statement */}
            <MarkdownContent content={problem.description} />

            {/* Input / Output Formats */}
            {problem.inputFormat && (
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#22C55E]">
                  Input Format
                </h3>
                <MarkdownContent content={problem.inputFormat} />
              </div>
            )}

            {problem.outputFormat && (
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#22C55E]">
                  Output Format
                </h3>
                <MarkdownContent content={problem.outputFormat} />
              </div>
            )}

            {/* Examples */}
            {problem.examples.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#F0F6FC]">Examples</h3>
                {problem.examples.map((example, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F0F6FC]">
                        Example {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyText(`ex-in-${idx}`, example.input)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#F0F6FC]"
                      >
                        {copiedId === `ex-in-${idx}` ? (
                          <Check className="h-3 w-3 text-[#22C55E]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>Copy Input</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                          Input
                        </span>
                        <pre className="overflow-x-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 font-mono text-xs text-[#F0F6FC] whitespace-pre-wrap break-words">
                          {example.input || '(empty)'}
                        </pre>
                      </div>
                      <div>
                        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                          Output
                        </span>
                        <pre className="overflow-x-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 font-mono text-xs text-[#F0F6FC] whitespace-pre-wrap break-words">
                          {example.output || '(empty)'}
                        </pre>
                      </div>
                    </div>

                    {example.explanation && (
                      <div className="rounded-lg bg-[#0D1117]/60 p-2.5 text-xs leading-relaxed text-[#8B949E]">
                        <span className="font-semibold text-[#F0F6FC]">Explanation: </span>
                        {example.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {problem.constraints.length > 0 && (
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                  Constraints
                </h3>
                <ul className="list-disc space-y-1.5 pl-5 font-mono text-xs text-[#F0F6FC]/90">
                  {problem.constraints.map((constraint, idx) => (
                    <li key={idx}>{renderInlineMarkdown(constraint)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Collapsible Hints (initially hidden) */}
            {problem.hints.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#F0F6FC]">
                  <Lightbulb className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <span>Hints ({problem.hints.length})</span>
                </h3>
                {problem.hints.map((hint, idx) => {
                  const isOpen = Boolean(openHints[idx]);
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-xl border border-[#30363D] bg-[#1C2128]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenHints((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-[#F0F6FC] transition hover:bg-[#0D1117]/40"
                      >
                        <span>Hint {idx + 1}</span>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-[#8B949E]" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#8B949E]" aria-hidden="true" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#30363D] bg-[#0D1117]/50 px-4 py-3 text-xs leading-relaxed text-[#F0F6FC]/90">
                          <MarkdownContent content={hint} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Submissions Tab */}
        {leftTab === 'submissions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F0F6FC]">Your Past Submissions</h2>
              <button
                type="button"
                onClick={() => void fetchSubmissions(problem._id)}
                disabled={isSubmissionsLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#1C2128] px-2.5 py-1 text-xs font-medium text-[#8B949E] transition hover:border-[#22C55E]/40 hover:text-[#F0F6FC] disabled:opacity-50"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', isSubmissionsLoading && 'animate-spin')}
                  aria-hidden="true"
                />
                <span>Refresh</span>
              </button>
            </div>

            {isSubmissionsLoading ? (
              <LoadingSkeleton variant="table-row" count={5} />
            ) : submissionsError ? (
              <EmptyState
                compact
                icon={AlertCircle}
                title="Unable to load submissions"
                description={submissionsError}
                action={{
                  label: 'Retry',
                  onClick: () => void fetchSubmissions(problem._id),
                  icon: RefreshCw,
                }}
              />
            ) : submissions.length === 0 ? (
              <EmptyState
                compact
                icon={History}
                title="No submissions yet"
                description="Submit your solution to see your submission history and load past attempts into the editor."
              />
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => handleLoadSubmissionCode(sub)}
                    className="w-full rounded-xl border border-[#30363D] bg-[#1C2128] p-3.5 text-left transition hover:border-[#22C55E]/50 hover:bg-[#1C2128]/80"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                          getStatusColorClass(sub.verdict)
                        )}
                      >
                        {sub.verdict}
                      </span>
                      <span className="text-[11px] text-[#8B949E]" title={formatDate(sub.submittedAt, 'PPpp')}>
                        {formatRelativeTime(sub.submittedAt)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-[#8B949E]">
                      <span className="rounded border border-[#30363D] bg-[#0D1117] px-2 py-0.5 font-mono text-[11px] text-[#F0F6FC]">
                        {formatEditorLanguageLabel(sub.language)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-sky-400" aria-hidden="true" />
                        {sub.runtime !== undefined ? `${Math.round(sub.runtime)} ms` : '—'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-purple-400" aria-hidden="true" />
                        {sub.memory !== undefined
                          ? sub.memory >= 1024
                            ? `${(sub.memory / 1024).toFixed(2)} MB`
                            : `${Math.round(sub.memory)} KB`
                          : '—'}
                      </span>
                      {sub.totalTestCases !== undefined && sub.totalTestCases > 0 && (
                        <span>
                          {sub.passedTestCases ?? 0}/{sub.totalTestCases} passed
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-[#22C55E]">
                      Click to load code into editor
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Editorial Tab */}
        {leftTab === 'editorial' && (
          <div className="space-y-5">
            {!problem.editorial &&
            !problem.optimalApproach &&
            editorialSolutionEntries.length === 0 ? (
              <EmptyState
                compact
                icon={BookOpen}
                title="Editorial coming soon"
                description="An official solution walkthrough is not available for this problem yet."
              />
            ) : (
              <>
                {(problem.timeComplexity || problem.spaceComplexity) && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {problem.timeComplexity && (
                      <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-3">
                        <span className="text-[11px] uppercase tracking-wider text-[#8B949E]">
                          Time Complexity
                        </span>
                        <p className="mt-1 font-mono text-sm font-semibold text-[#22C55E]">
                          {problem.timeComplexity}
                        </p>
                      </div>
                    )}
                    {problem.spaceComplexity && (
                      <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-3">
                        <span className="text-[11px] uppercase tracking-wider text-[#8B949E]">
                          Space Complexity
                        </span>
                        <p className="mt-1 font-mono text-sm font-semibold text-sky-400">
                          {problem.spaceComplexity}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {problem.optimalApproach && (
                  <div className="rounded-xl border border-[#22C55E]/30 bg-[#1C2128] p-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#22C55E]">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>Optimal Approach</span>
                    </h3>
                    <MarkdownContent content={problem.optimalApproach} />
                  </div>
                )}

                {problem.editorial && (
                  <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                    <h3 className="mb-3 text-sm font-semibold text-[#F0F6FC]">
                      Solution Explanation
                    </h3>
                    <MarkdownContent content={problem.editorial} />
                  </div>
                )}

                {editorialSolutionEntries.length > 0 && (
                  <div className="rounded-xl border border-[#30363D] bg-[#1C2128] overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363D] bg-[#161B22] px-3 py-2">
                      <div className="flex items-center gap-1">
                        {editorialSolutionEntries.map(([lang]) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setSelectedEditorialLang(lang)}
                            className={cn(
                              'rounded-md px-2.5 py-1 text-xs font-medium transition',
                              selectedEditorialLang === lang
                                ? 'bg-[#22C55E]/15 text-[#22C55E]'
                                : 'text-[#8B949E] hover:text-[#F0F6FC]'
                            )}
                          >
                            {getLanguageLabel(lang)}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            'editorial-code',
                            problem.solutionCode?.[selectedEditorialLang] ?? ''
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs text-[#8B949E] hover:text-[#F0F6FC]"
                      >
                        {copiedId === 'editorial-code' ? (
                          <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>

                    <div className="h-72">
                      <CodeEditor
                        language={selectedEditorialLang}
                        value={problem.solutionCode?.[selectedEditorialLang] ?? ''}
                        theme={theme}
                        fontSize={fontSize}
                        readOnly
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const editorPanelContent = (
    <div className="flex h-full flex-col bg-[#0D1117]">
      {/* Editor Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#30363D] bg-[#161B22] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => {
              const nextLang = e.target.value;
              if (isSupportedLanguage(nextLang)) {
                setLanguage(nextLang);
              }
            }}
            aria-label="Select programming language"
            className="h-8 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 text-xs font-semibold text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
          >
            {EDITOR_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
            aria-label="Select editor theme"
            className="h-8 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
          >
            {EDITOR_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Font Size Control */}
          <div className="inline-flex h-8 items-center rounded-lg border border-[#30363D] bg-[#0D1117] px-1">
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.max(11, prev - 1))}
              disabled={fontSize <= 11}
              aria-label="Decrease font size"
              className="rounded p-1 text-[#8B949E] transition hover:text-[#F0F6FC] disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-[38px] text-center font-mono text-xs text-[#F0F6FC]">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize((prev) => Math.min(24, prev + 1))}
              disabled={fontSize >= 24}
              aria-label="Increase font size"
              className="rounded p-1 text-[#8B949E] transition hover:text-[#F0F6FC] disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Autosave status */}
          <button
            type="button"
            onClick={() => void saveDraftNow(true)}
            title="Save draft now (Ctrl+S)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-[11px] font-medium text-[#8B949E] transition hover:border-[#22C55E]/40 hover:text-[#F0F6FC]"
          >
            {autosaveState === 'saving' ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-[#22C55E]" aria-hidden="true" />
                <span>Saving...</span>
              </>
            ) : autosaveState === 'saved' ? (
              <>
                <Save className="h-3 w-3 text-[#22C55E]" aria-hidden="true" />
                <span>
                  {lastSavedAt
                    ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Draft saved'}
                </span>
              </>
            ) : autosaveState === 'unsaved' ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                <span>Unsaved</span>
              </>
            ) : autosaveState === 'error' ? (
              <>
                <AlertCircle className="h-3 w-3 text-amber-400" aria-hidden="true" />
                <span>Save retry</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3" aria-hidden="true" />
                <span>Autosave</span>
              </>
            )}
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={() => void handleCopyText('editor-code', currentCode)}
            title="Copy code to clipboard"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 text-xs font-medium text-[#8B949E] transition hover:border-[#22C55E]/40 hover:text-[#F0F6FC]"
          >
            {copiedId === 'editor-code' ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
                <span className="hidden sm:inline text-[#22C55E]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Reset Code */}
          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            title="Reset code to starter template"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 text-xs font-medium text-[#8B949E] transition hover:border-amber-500/40 hover:text-amber-300"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen editor'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#30363D] bg-[#0D1117] text-[#8B949E] transition hover:border-[#22C55E]/40 hover:text-[#F0F6FC]"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={language}
          value={currentCode}
          onChange={handleCodeChange}
          theme={theme}
          fontSize={fontSize}
          onRunShortcut={() => void handleRunCode()}
          onSubmitShortcut={() => void handleSubmitCode()}
          onSaveShortcut={() => void saveDraftNow(true)}
        />
      </div>
    </div>
  );

  const rightPanelContent = (
    <ResizablePanel
      direction="vertical"
      initialSize={62}
      minSize={25}
      maxSize={82}
      stackOnMobile={false}
      storageKey="codeclimb_editor_vertical_split"
      firstPanel={editorPanelContent}
      secondPanel={
        <TestCasePanel
          activeTab={bottomTab}
          onTabChange={setBottomTab}
          testCases={problem.sampleTestCases}
          selectedIndices={selectedTestCaseIndices}
          onToggleTestCase={handleToggleTestCase}
          onSelectAllTestCases={handleSelectAllTestCases}
          customInput={customInput}
          onCustomInputChange={setCustomInput}
          result={executionResult}
          isRunning={isRunning}
          isSubmitting={isSubmitting}
          submitProgress={submitProgress}
          executionError={executionError}
        />
      }
    />
  );

  return (
    <div
      className={cn(
        'dark relative flex flex-col bg-[#0D1117] text-[#F0F6FC]',
        isFullscreen ? 'fixed inset-0 z-40 h-screen' : 'h-screen overflow-hidden'
      )}
    >
      {/* Green Flash Overlay on Accepted */}
      <AnimatePresence>
        {showGreenFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-0 z-50 bg-[#22C55E]"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Confetti Celebration Burst on Accepted */}
      <AnimatePresence>
        {showCelebration && (
          <div
            className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-hidden"
            aria-hidden="true"
          >
            {CONFETTI_PIECES.map((piece) => (
              <motion.span
                key={piece.id}
                initial={{
                  y: -20,
                  x: `${piece.x}vw`,
                  opacity: 1,
                  rotate: 0,
                  scale: 1,
                }}
                animate={{
                  y: '95vh',
                  x: `${piece.x + (piece.id % 2 === 0 ? 10 : -10)}vw`,
                  opacity: [1, 1, 0],
                  rotate: piece.rotate,
                  scale: [1, 1.15, 0.85],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: 'easeOut',
                }}
                style={{ backgroundColor: piece.color }}
                className="absolute top-0 h-3 w-2 rounded-sm shadow-sm"
              />
            ))}

            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 20, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              className="mt-12 flex items-center gap-2.5 rounded-full border border-[#22C55E]/50 bg-[#1C2128]/95 px-5 py-2.5 shadow-xl shadow-[#22C55E]/20"
            >
              <Trophy className="h-5 w-5 text-[#22C55E]" />
              <span className="text-sm font-bold text-[#F0F6FC]">
                Accepted! Great job solving {problem.title}!
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Workspace Header Bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#30363D] bg-[#161B22] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/practice"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#1C2128] px-2.5 py-1.5 text-xs font-medium text-[#8B949E] transition hover:border-[#22C55E]/40 hover:text-[#F0F6FC]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Problems</span>
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <Code2 className="hidden h-4 w-4 shrink-0 text-[#22C55E] sm:block" aria-hidden="true" />
            <span className="truncate text-sm font-semibold text-[#F0F6FC]">{problem.title}</span>
            <DifficultyBadge difficulty={problem.difficulty} size="sm" className="hidden sm:inline-flex" />
            {problem.isSolved && (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-[#22C55E]"
                aria-label="Solved"
              />
            )}
          </div>
        </div>

        {/* Action Buttons: Run Code & Submit */}
        <div className="flex items-center gap-2.5">
          {statusBanner && (
            <span className="hidden rounded-md border border-[#30363D] bg-[#1C2128] px-2.5 py-1 text-xs text-[#8B949E] xl:inline-block">
              {statusBanner}
            </span>
          )}

          <button
            type="button"
            onClick={() => void handleRunCode()}
            disabled={isRunning || isSubmitting}
            title="Run selected test cases (Ctrl+Enter)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#1C2128] px-3.5 py-1.5 text-xs font-semibold text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:bg-[#1C2128]/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#22C55E]" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSubmitCode()}
            disabled={isRunning || isSubmitting}
            title="Submit solution (Ctrl+Shift+Enter)"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-4 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-[#22C55E]/90 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {isSubmitting
                ? `Judging ${Math.round(submitProgress)}%`
                : 'Submit'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
        {isFullscreen ? (
          <div className="h-full w-full">{rightPanelContent}</div>
        ) : (
          <ResizablePanel
            direction="horizontal"
            initialSize={44}
            minSize={26}
            maxSize={68}
            storageKey="codeclimb_editor_horizontal_split"
            firstPanel={leftPanelContent}
            secondPanel={rightPanelContent}
          />
        )}
      </main>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetCode}
        title="Reset code to starter template?"
        description={`This will discard your current ${formatEditorLanguageLabel(language)} edits in the editor and restore the starter code.`}
        confirmText="Reset Code"
        cancelText="Keep Coding"
        variant="warning"
      />
    </div>
  );
}

export default ProblemSolvePage;
