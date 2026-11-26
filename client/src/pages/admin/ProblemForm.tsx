import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  FlaskConical,
  Lightbulb,
  Loader2,
  Play,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LanguageCodeEditor,
  type AdminCodeLanguage,
} from '@/components/admin/LanguageCodeEditor';
import { DEFAULT_STARTER_TEMPLATES } from '@/components/admin/languageTemplates';
import MarkdownPreview from '@/components/admin/MarkdownPreview';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { adminApi, ApiClientError, curriculumApi } from '@/services/api';
import type {
  Difficulty,
  Problem,
  ProblemExample,
  ProblemValidationResult,
  TestCase,
  Topic,
} from '@/types';
import { cn, slugify } from '@/utils/helpers';

export interface ProblemFormProps {
  problem?: Problem | null;
  problemId?: string;
  onSuccess?: (savedProblem: Problem) => void;
  onCancel?: () => void;
}

const DIFFICULTIES: readonly Difficulty[] = ['Easy', 'Medium', 'Hard'];

const PRESET_TAGS: readonly string[] = [
  'Array',
  'String',
  'Hash Table',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Linked List',
  'Stack',
  'Queue',
  'Trees',
  'BST',
  'Heap',
  'Graph',
  'BFS',
  'DFS',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Trie',
  'Bit Manipulation',
  'Math',
  'Sorting',
  'Union Find',
];

interface FormErrors {
  title?: string;
  slug?: string;
  description?: string;
  examples?: string;
  timeLimit?: string;
  memoryLimit?: string;
  testCases?: string;
}

function normalizeConstraints(constraints: Problem['constraints']): string {
  if (!constraints) return '';
  if (Array.isArray(constraints)) return constraints.join('\n');
  return constraints;
}

function normalizeTopicIds(problem: Problem): string[] {
  const ids = new Set<string>();
  if (problem.topicId) ids.add(problem.topicId);
  if (problem.topic) {
    ids.add(typeof problem.topic === 'string' ? problem.topic : problem.topic._id);
  }
  if (Array.isArray(problem.topics)) {
    for (const item of problem.topics) {
      ids.add(typeof item === 'string' ? item : item._id);
    }
  }
  return Array.from(ids).filter(Boolean);
}

export default function ProblemForm({
  problem: initialProblem,
  problemId: propProblemId,
  onSuccess,
  onCancel,
}: ProblemFormProps) {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const resolvedProblemId = propProblemId ?? initialProblem?._id ?? params.id;
  const isEditing = Boolean(resolvedProblemId);

  const [isInitializing, setIsInitializing] = useState(
    Boolean(resolvedProblemId && !initialProblem)
  );
  const [topics, setTopics] = useState<Topic[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionPreview, setDescriptionPreview] = useState(false);
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [examples, setExamples] = useState<ProblemExample[]>([
    { input: '', output: '', explanation: '' },
  ]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [starterCode, setStarterCode] = useState<Record<AdminCodeLanguage, string>>({
    ...DEFAULT_STARTER_TEMPLATES,
  });
  const [solutionCode, setSolutionCode] = useState<Record<AdminCodeLanguage, string>>({
    c: '',
    cpp: '',
    java: '',
    python: '',
  });
  const [validationLanguage, setValidationLanguage] = useState<AdminCodeLanguage>('cpp');
  const [editorial, setEditorial] = useState('');
  const [editorialPreview, setEditorialPreview] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(2000);
  const [memoryLimit, setMemoryLimit] = useState<number>(262144);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '', isSample: true, explanation: '' },
  ]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ProblemValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const populateForm = useCallback((prob: Problem) => {
    setTitle(prob.title || '');
    setSlug(prob.slug || '');
    setSlugManuallyEdited(Boolean(prob.slug));
    setDescription(prob.description || '');
    setInputFormat(prob.inputFormat || '');
    setOutputFormat(prob.outputFormat || '');
    setConstraints(normalizeConstraints(prob.constraints));
    setExamples(
      prob.examples && prob.examples.length > 0
        ? prob.examples.map((ex) => ({
            input: ex.input ?? '',
            output: ex.output ?? '',
            explanation: ex.explanation ?? '',
          }))
        : [{ input: '', output: '', explanation: '' }]
    );
    setDifficulty(prob.difficulty || 'Easy');
    setSelectedTopicIds(normalizeTopicIds(prob));
    setSelectedTags(prob.tags || []);
    setHints(prob.hints || []);
    setStarterCode({
      c: prob.starterCode?.c ?? DEFAULT_STARTER_TEMPLATES.c,
      cpp: prob.starterCode?.cpp ?? DEFAULT_STARTER_TEMPLATES.cpp,
      java: prob.starterCode?.java ?? DEFAULT_STARTER_TEMPLATES.java,
      python: prob.starterCode?.python ?? DEFAULT_STARTER_TEMPLATES.python,
    });
    setSolutionCode({
      c: prob.solutionCode?.c ?? '',
      cpp: prob.solutionCode?.cpp ?? '',
      java: prob.solutionCode?.java ?? '',
      python: prob.solutionCode?.python ?? '',
    });
    setEditorial(prob.editorial ?? prob.solutionExplanation ?? '');
    setTimeLimit(prob.timeLimit ?? prob.timeLimitMs ?? 2000);
    setMemoryLimit(
      prob.memoryLimit ?? (prob.memoryLimitMb ? prob.memoryLimitMb * 1024 : 262144)
    );
    setIsPublished(prob.isPublished ?? true);

    const existingCases =
      prob.testCases && prob.testCases.length > 0
        ? prob.testCases
        : prob.sampleTestCases && prob.sampleTestCases.length > 0
          ? prob.sampleTestCases
          : [];
    setTestCases(
      existingCases.length > 0
        ? existingCases.map((tc) => ({
            _id: tc._id,
            input: tc.input ?? '',
            expectedOutput: tc.expectedOutput ?? '',
            isSample: tc.isSample ?? !tc.isHidden,
            explanation: tc.explanation ?? '',
          }))
        : [{ input: '', expectedOutput: '', isSample: true, explanation: '' }]
    );
  }, []);

  useEffect(() => {
    let active = true;
    const loadTopics = async () => {
      try {
        const res = await curriculumApi.getTopics();
        if (active) {
          setTopics(res.data || []);
        }
      } catch {
        // Non-blocking: admin can still manage tags even if topics fail to load
      }
    };
    void loadTopics();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (initialProblem) {
      populateForm(initialProblem);
      setIsInitializing(false);
      return;
    }

    if (!resolvedProblemId) {
      setIsInitializing(false);
      return;
    }

    let active = true;
    const loadProblem = async () => {
      setIsInitializing(true);
      try {
        const res = await adminApi.getProblemById(resolvedProblemId);
        if (active && res.data) {
          populateForm(res.data);
        }
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : 'Failed to load problem details.';
        toast.error(message);
      } finally {
        if (active) setIsInitializing(false);
      }
    };
    void loadProblem();
    return () => {
      active = false;
    };
  }, [initialProblem, resolvedProblemId, populateForm]);

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!slugManuallyEdited) {
      setSlug(slugify(nextTitle));
    }
    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
  };

  const handleSlugChange = (nextSlug: string) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(nextSlug));
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
  };

  const toggleTopicId = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!selectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setCustomTagInput('');
  };

  const addExample = () => {
    setExamples((prev) => [...prev, { input: '', output: '', explanation: '' }]);
  };

  const updateExample = (
    index: number,
    field: keyof ProblemExample,
    value: string
  ) => {
    setExamples((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
    if (errors.examples) setErrors((prev) => ({ ...prev, examples: undefined }));
  };

  const removeExample = (index: number) => {
    setExamples((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
  };

  const addHint = () => {
    setHints((prev) => [...prev, '']);
  };

  const updateHint = (index: number, value: string) => {
    setHints((prev) => prev.map((h, idx) => (idx === index ? value : h)));
  };

  const removeHint = (index: number) => {
    setHints((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isSample: false, explanation: '' },
    ]);
  };

  const updateTestCase = <K extends keyof TestCase>(
    index: number,
    field: K,
    value: TestCase[K]
  ) => {
    setTestCases((prev) =>
      prev.map((tc, idx) => (idx === index ? { ...tc, [field]: value } : tc))
    );
    if (errors.testCases) setErrors((prev) => ({ ...prev, testCases: undefined }));
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, idx) => idx !== index));
  };

  const allTagsPool = useMemo(() => {
    const set = new Set([...PRESET_TAGS, ...selectedTags]);
    return Array.from(set);
  }, [selectedTags]);

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!title.trim() || title.trim().length < 3) {
      nextErrors.title = 'Problem title must be at least 3 characters.';
    }
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug.trim())) {
      nextErrors.slug = 'Slug must contain lowercase letters, numbers, and hyphens only.';
    }
    if (!description.trim()) {
      nextErrors.description = 'Problem description is required.';
    }
    if (examples.length === 0 || examples.some((ex) => !ex.output.trim())) {
      nextErrors.examples = 'Provide at least one example with a non-empty output.';
    }
    if (!Number.isFinite(timeLimit) || timeLimit < 100 || timeLimit > 30000) {
      nextErrors.timeLimit = 'Time limit must be between 100 ms and 30,000 ms.';
    }
    if (!Number.isFinite(memoryLimit) || memoryLimit < 16384) {
      nextErrors.memoryLimit = 'Memory limit must be at least 16,384 KB.';
    }
    if (testCases.some((tc) => tc.expectedOutput === undefined || tc.expectedOutput === '')) {
      nextErrors.testCases = 'Every test case must specify an expected output.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleValidateTestCases = async () => {
    const code = solutionCode[validationLanguage]?.trim() ?? '';
    if (!code) {
      setValidationError(
        `Enter a ${validationLanguage.toUpperCase()} reference solution before running validation.`
      );
      toast.error('Reference solution code is empty.');
      return;
    }

    if (testCases.length === 0) {
      setValidationError('Add at least one test case to validate.');
      toast.error('Please add at least one test case.');
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      const response = await adminApi.validateProblem({
        problemId: resolvedProblemId,
        language: validationLanguage,
        code,
        testCases: testCases.map((tc, index) => ({
          ...tc,
          order: index + 1,
          isHidden: !tc.isSample,
        })),
        timeLimit,
        memoryLimit,
      });

      setValidationResult(response.data);
      if (response.data.passed) {
        toast.success(
          `Validation passed (${response.data.passedCount}/${response.data.totalCount} test cases)`
        );
      } else {
        toast.error(
          `Validation failed (${response.data.passedCount}/${response.data.totalCount} passed)`
        );
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to validate reference solution against test cases.';
      setValidationError(message);
      toast.error(message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/admin/problems');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted validation errors.');
      return;
    }

    setIsSaving(true);
    const cleanedHints = hints.map((h) => h.trim()).filter(Boolean);
    const cleanedTestCases = testCases.map((tc, idx) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isSample: Boolean(tc.isSample),
      isHidden: !tc.isSample,
      explanation: tc.explanation?.trim() || '',
      order: idx + 1,
    }));

    const payload: Partial<Problem> = {
      title: title.trim(),
      slug: slug.trim(),
      description,
      inputFormat,
      outputFormat,
      constraints,
      examples: examples.map((ex) => ({
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation?.trim() || '',
      })),
      difficulty,
      topics: selectedTopicIds,
      topicId: selectedTopicIds[0],
      tags: selectedTags,
      hints: cleanedHints,
      starterCode,
      solutionCode,
      editorial,
      solutionExplanation: editorial,
      timeLimit,
      timeLimitMs: timeLimit,
      memoryLimit,
      isPublished,
      testCases: cleanedTestCases,
    };

    try {
      const response = isEditing && resolvedProblemId
        ? await adminApi.updateProblem(resolvedProblemId, payload)
        : await adminApi.createProblem(payload);

      toast.success(isEditing ? 'Problem updated successfully' : 'Problem created successfully');
      if (onSuccess) {
        onSuccess(response.data);
      } else {
        navigate('/admin/problems');
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to save problem.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6" noValidate>
      {/* Top Action Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#30363D] bg-[#0D1117] text-[#8B949E] transition hover:text-[#F0F6FC]"
            aria-label="Back to problems"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-[#F0F6FC]">
              {isEditing ? 'Edit Problem' : 'Create New Problem'}
            </h2>
            <p className="text-xs text-[#8B949E]">
              Configure metadata, starter templates, editorial, and validated test cases.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Published Toggle */}
          <div className="flex items-center gap-2.5 rounded-xl border border-[#30363D] bg-[#0D1117] px-3 py-1.5">
            <span className="text-xs font-medium text-[#C9D1D9]">
              {isPublished ? 'Published' : 'Draft'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              aria-label="Toggle published status"
              onClick={() => setIsPublished((prev) => !prev)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                isPublished ? 'bg-[#22C55E]' : 'bg-[#30363D]'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                  isPublished ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="rounded-xl border border-[#30363D] bg-[#0D1117] px-4 py-2 text-sm font-medium text-[#C9D1D9] transition hover:bg-[#161B22] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-5 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {isEditing ? 'Update Problem' : 'Save Problem'}
          </button>
        </div>
      </div>

      {/* Section 1: Core Info */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="problem-title" className="block text-xs font-medium text-[#C9D1D9]">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="problem-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Two Sum"
              className={cn(
                'mt-1.5 h-10 w-full rounded-xl border bg-[#0D1117] px-3.5 text-sm text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:outline-none',
                errors.title
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#30363D] focus:border-[#22C55E]'
              )}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-400">{errors.title}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="problem-slug" className="block text-xs font-medium text-[#C9D1D9]">
                Slug <span className="text-red-400">*</span>
              </label>
              {slugManuallyEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugManuallyEdited(false);
                    setSlug(slugify(title));
                  }}
                  className="text-[11px] text-[#22C55E] hover:underline"
                >
                  Auto-generate from title
                </button>
              )}
            </div>
            <input
              id="problem-slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="two-sum"
              className={cn(
                'mt-1.5 h-10 w-full rounded-xl border bg-[#0D1117] px-3.5 font-mono text-sm text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:outline-none',
                errors.slug
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#30363D] focus:border-[#22C55E]'
              )}
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-400">{errors.slug}</p>
            )}
          </div>
        </div>

        {/* Difficulty, Time Limit, Memory Limit */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <span className="block text-xs font-medium text-[#C9D1D9]">
              Difficulty <span className="text-red-400">*</span>
            </span>
            <div className="mt-1.5 grid grid-cols-3 gap-2 rounded-xl border border-[#30363D] bg-[#0D1117] p-1">
              {DIFFICULTIES.map((level) => {
                const selected = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      'rounded-lg py-1.5 text-xs font-semibold transition',
                      selected && level === 'Easy' && 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40',
                      selected && level === 'Medium' && 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40',
                      selected && level === 'Hard' && 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40',
                      !selected && 'text-[#8B949E] hover:text-[#F0F6FC]'
                    )}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="time-limit" className="block text-xs font-medium text-[#C9D1D9]">
              Time Limit (ms)
            </label>
            <input
              id="time-limit"
              type="number"
              min={100}
              max={30000}
              step={100}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className={cn(
                'mt-1.5 h-10 w-full rounded-xl border bg-[#0D1117] px-3.5 text-sm text-[#F0F6FC] focus:outline-none',
                errors.timeLimit ? 'border-red-500' : 'border-[#30363D] focus:border-[#22C55E]'
              )}
            />
            {errors.timeLimit && (
              <p className="mt-1 text-xs text-red-400">{errors.timeLimit}</p>
            )}
          </div>

          <div>
            <label htmlFor="memory-limit" className="block text-xs font-medium text-[#C9D1D9]">
              Memory Limit (KB)
            </label>
            <input
              id="memory-limit"
              type="number"
              min={16384}
              step={1024}
              value={memoryLimit}
              onChange={(e) => setMemoryLimit(Number(e.target.value))}
              className={cn(
                'mt-1.5 h-10 w-full rounded-xl border bg-[#0D1117] px-3.5 text-sm text-[#F0F6FC] focus:outline-none',
                errors.memoryLimit ? 'border-red-500' : 'border-[#30363D] focus:border-[#22C55E]'
              )}
            />
            {errors.memoryLimit && (
              <p className="mt-1 text-xs text-red-400">{errors.memoryLimit}</p>
            )}
          </div>
        </div>

        {/* Description (Markdown + Preview) */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="problem-description"
              className="block text-xs font-medium text-[#C9D1D9]"
            >
              Description (Markdown supported) <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center rounded-lg border border-[#30363D] bg-[#0D1117] p-0.5">
              <button
                type="button"
                onClick={() => setDescriptionPreview(false)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition',
                  !descriptionPreview
                    ? 'bg-[#1C2128] text-[#F0F6FC]'
                    : 'text-[#8B949E] hover:text-[#F0F6FC]'
                )}
              >
                <FileText className="h-3 w-3" aria-hidden="true" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setDescriptionPreview(true)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition',
                  descriptionPreview
                    ? 'bg-[#1C2128] text-[#22C55E]'
                    : 'text-[#8B949E] hover:text-[#F0F6FC]'
                )}
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
                Preview
              </button>
            </div>
          </div>

          {descriptionPreview ? (
            <div className="mt-1.5 min-h-[160px] rounded-xl border border-[#30363D] bg-[#0D1117] p-4">
              <MarkdownPreview content={description} />
            </div>
          ) : (
            <textarea
              id="problem-description"
              rows={7}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Write the complete problem statement using markdown..."
              className={cn(
                'mt-1.5 w-full rounded-xl border bg-[#0D1117] p-3.5 text-sm text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:outline-none',
                errors.description
                  ? 'border-red-500'
                  : 'border-[#30363D] focus:border-[#22C55E]'
              )}
            />
          )}
          {errors.description && (
            <p className="mt-1 text-xs text-red-400">{errors.description}</p>
          )}
        </div>

        {/* Input Format, Output Format, Constraints */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label htmlFor="input-format" className="block text-xs font-medium text-[#C9D1D9]">
              Input Format
            </label>
            <textarea
              id="input-format"
              rows={4}
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
              placeholder="First line contains integer N..."
              className="mt-1.5 w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 text-sm text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:border-[#22C55E] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="output-format" className="block text-xs font-medium text-[#C9D1D9]">
              Output Format
            </label>
            <textarea
              id="output-format"
              rows={4}
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              placeholder="Print the indices separated by space..."
              className="mt-1.5 w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 text-sm text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:border-[#22C55E] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="constraints" className="block text-xs font-medium text-[#C9D1D9]">
              Constraints
            </label>
            <textarea
              id="constraints"
              rows={4}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder={'1 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9'}
              className="mt-1.5 w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:border-[#22C55E] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Topics & Tags Multi-Select */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
            Topics & Tags
          </h3>
        </div>

        {/* Curriculum Topics Multi-select */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#C9D1D9]">
              Curriculum Topics ({selectedTopicIds.length} selected)
            </span>
          </div>
          {topics.length > 0 ? (
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-3">
              {topics.map((topic) => {
                const isSelected = selectedTopicIds.includes(topic._id);
                return (
                  <button
                    key={topic._id}
                    type="button"
                    onClick={() => toggleTopicId(topic._id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                      isSelected
                        ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
                        : 'border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC]'
                    )}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                    {topic.title}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-xs text-[#8B949E]">
              No curriculum topics loaded. You can still assign topic tags below.
            </p>
          )}
        </div>

        {/* Topic Tags Multi-select */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-[#C9D1D9]">
              Topic Tags ({selectedTags.length} selected)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Add custom tag..."
                className="h-8 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 text-xs text-[#F0F6FC] placeholder:text-[#8B949E] focus:border-[#22C55E] focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#30363D] bg-[#161B22] px-2.5 text-xs font-medium text-[#F0F6FC] hover:border-[#22C55E]/50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#30363D] bg-[#0D1117] p-3">
            {allTagsPool.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition',
                    active
                      ? 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E] font-medium'
                      : 'border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-[#F0F6FC]'
                  )}
                >
                  {tag}
                  {active && <X className="h-3 w-3" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Examples */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
              Examples
            </h3>
            {errors.examples && (
              <p className="mt-1 text-xs text-red-400">{errors.examples}</p>
            )}
          </div>
          <button
            type="button"
            onClick={addExample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#22C55E] transition hover:border-[#22C55E]/50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add Example
          </button>
        </div>

        <div className="space-y-4">
          {examples.map((example, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F0F6FC]">
                  Example {idx + 1}
                </span>
                {examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExample(idx)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#8B949E] transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#8B949E]">
                    Input
                  </label>
                  <textarea
                    rows={3}
                    value={example.input}
                    onChange={(e) => updateExample(idx, 'input', e.target.value)}
                    placeholder="nums = [2,7,11,15], target = 9"
                    className="mt-1 w-full rounded-lg border border-[#30363D] bg-[#161B22] p-2.5 font-mono text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#8B949E]">
                    Output <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={example.output}
                    onChange={(e) => updateExample(idx, 'output', e.target.value)}
                    placeholder="[0,1]"
                    className="mt-1 w-full rounded-lg border border-[#30363D] bg-[#161B22] p-2.5 font-mono text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#8B949E]">
                  Explanation (Optional)
                </label>
                <input
                  type="text"
                  value={example.explanation ?? ''}
                  onChange={(e) => updateExample(idx, 'explanation', e.target.value)}
                  placeholder="Because nums[0] + nums[1] == 9, we return [0, 1]."
                  className="mt-1 h-9 w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Hints */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
              Hints ({hints.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={addHint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#22C55E] transition hover:border-[#22C55E]/50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add Hint
          </button>
        </div>

        {hints.length === 0 ? (
          <p className="text-xs text-[#8B949E]">
            No hints added yet. Click &ldquo;Add Hint&rdquo; to provide progressive hints for learners.
          </p>
        ) : (
          <div className="space-y-2.5">
            {hints.map((hint, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="mt-2.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0D1117] text-[11px] font-semibold text-[#8B949E]">
                  {idx + 1}
                </span>
                <textarea
                  rows={2}
                  value={hint}
                  onChange={(e) => updateHint(idx, e.target.value)}
                  placeholder={`Hint ${idx + 1}...`}
                  className="flex-1 rounded-xl border border-[#30363D] bg-[#0D1117] p-2.5 text-sm text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeHint(idx)}
                  aria-label={`Remove hint ${idx + 1}`}
                  className="mt-1.5 rounded-lg p-1.5 text-[#8B949E] transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 5: Starter Code (Monaco Editors for C, C++, Java, Python) */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
            Starter Code Templates
          </h3>
          <p className="mt-0.5 text-xs text-[#8B949E]">
            Provide initial boilerplate code for C, C++, Java, and Python.
          </p>
        </div>

        <LanguageCodeEditor
          label="Starter Code"
          value={starterCode}
          onChange={(lang, code) =>
            setStarterCode((prev) => ({ ...prev, [lang]: code }))
          }
          defaultTemplates={DEFAULT_STARTER_TEMPLATES}
          height={280}
        />
      </section>

      {/* Section 6: Editorial / Solution Explanation */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
              Editorial & Solution Explanation
            </h3>
          </div>
          <div className="flex items-center rounded-lg border border-[#30363D] bg-[#0D1117] p-0.5">
            <button
              type="button"
              onClick={() => setEditorialPreview(false)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition',
                !editorialPreview ? 'bg-[#1C2128] text-[#F0F6FC]' : 'text-[#8B949E]'
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setEditorialPreview(true)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition',
                editorialPreview ? 'bg-[#1C2128] text-[#22C55E]' : 'text-[#8B949E]'
              )}
            >
              Preview
            </button>
          </div>
        </div>

        {editorialPreview ? (
          <div className="min-h-[140px] rounded-xl border border-[#30363D] bg-[#0D1117] p-4">
            <MarkdownPreview content={editorial} emptyText="No editorial written yet." />
          </div>
        ) : (
          <textarea
            rows={6}
            value={editorial}
            onChange={(e) => setEditorial(e.target.value)}
            placeholder="Explain intuition, optimal approach, and time/space complexity..."
            className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3.5 text-sm text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:border-[#22C55E] focus:outline-none"
          />
        )}
      </section>

      {/* Section 7: Test Cases & Reference Solution Validation */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
                Test Cases & Reference Validation
              </h3>
              <p className="text-xs text-[#8B949E]">
                Add sample and hidden test cases, then validate against a reference solution.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addTestCase}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#484F58]"
            >
              <Plus className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
              Add Test Case
            </button>

            <button
              type="button"
              onClick={() => void handleValidateTestCases()}
              disabled={isValidating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-3.5 py-1.5 text-xs font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90 disabled:opacity-60"
            >
              {isValidating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Validate
            </button>
          </div>
        </div>

        {errors.testCases && (
          <p className="text-xs text-red-400">{errors.testCases}</p>
        )}

        {/* Test Cases List */}
        {testCases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#30363D] bg-[#0D1117] p-6 text-center text-xs text-[#8B949E]">
            No test cases added yet. Add at least one test case.
          </div>
        ) : (
          <div className="space-y-3">
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-[#F0F6FC]">
                      Test Case #{idx + 1}
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#30363D] bg-[#161B22] px-2.5 py-1 text-xs text-[#C9D1D9]">
                      <input
                        type="checkbox"
                        checked={Boolean(tc.isSample)}
                        onChange={(e) =>
                          updateTestCase(idx, 'isSample', e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-[#30363D] accent-[#22C55E]"
                      />
                      <span>Sample test case (visible to users)</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeTestCase(idx)}
                    aria-label={`Remove test case ${idx + 1}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#8B949E] transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8B949E]">
                      Stdin Input
                    </label>
                    <textarea
                      rows={3}
                      value={tc.input}
                      onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                      placeholder={'4\n2 7 11 15\n9'}
                      className="mt-1 w-full rounded-lg border border-[#30363D] bg-[#161B22] p-2.5 font-mono text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#8B949E]">
                      Expected Output <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={tc.expectedOutput}
                      onChange={(e) =>
                        updateTestCase(idx, 'expectedOutput', e.target.value)
                      }
                      placeholder="0 1"
                      className="mt-1 w-full rounded-lg border border-[#30363D] bg-[#161B22] p-2.5 font-mono text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reference Solution for Validation */}
        <div className="space-y-2.5 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-semibold text-[#F0F6FC]">
                Reference Solution (used by &ldquo;Validate&rdquo;)
              </h4>
              <p className="text-[11px] text-[#8B949E]">
                Select a language tab, paste your working reference solution, and click Validate.
              </p>
            </div>
          </div>

          <LanguageCodeEditor
            label="Reference Solution"
            value={solutionCode}
            activeLanguage={validationLanguage}
            onLanguageChange={setValidationLanguage}
            onChange={(lang, code) =>
              setSolutionCode((prev) => ({ ...prev, [lang]: code }))
            }
            height={240}
          />
        </div>

        {/* Validation Result Panel */}
        {validationError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
            <div>
              <p className="font-semibold">Validation Error</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        {validationResult && (
          <div
            className={cn(
              'rounded-xl border p-4 space-y-3',
              validationResult.passed
                ? 'border-[#22C55E]/40 bg-[#22C55E]/10'
                : 'border-red-500/40 bg-red-500/10'
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {validationResult.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-[#22C55E]" aria-hidden="true" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                )}
                <span className="text-sm font-semibold text-[#F0F6FC]">
                  {validationResult.passed
                    ? 'All Test Cases Passed'
                    : 'Some Test Cases Failed'}
                </span>
              </div>
              <span className="text-xs font-medium text-[#C9D1D9]">
                {validationResult.passedCount} / {validationResult.totalCount} passed
                {validationResult.executionTimeMs !== undefined &&
                  ` · ${validationResult.executionTimeMs} ms`}
              </span>
            </div>

            {(validationResult.compileOutput || validationResult.errorMessage) && (
              <pre className="overflow-x-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-red-300">
                {validationResult.compileOutput || validationResult.errorMessage}
              </pre>
            )}

            {validationResult.results?.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {validationResult.results.map((res) => (
                  <div
                    key={res.testCaseIndex}
                    className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F0F6FC]">
                        Case #{res.testCaseIndex + 1}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-medium',
                          res.passed
                            ? 'bg-[#22C55E]/15 text-[#22C55E]'
                            : 'bg-red-500/15 text-red-400'
                        )}
                      >
                        {res.status}
                      </span>
                    </div>
                    {!res.passed && (
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="text-[#8B949E]">
                          Expected: <span className="text-[#22C55E]">{res.expectedOutput}</span>
                        </div>
                        <div className="text-[#8B949E]">
                          Actual:{' '}
                          <span className="text-red-400">
                            {res.actualOutput || res.stderr || '(empty)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </form>
  );
}
