import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  FlaskConical,
  Loader2,
  Terminal,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { cn, copyToClipboard } from '@/utils/helpers';

export type BottomPanelTab = 'testcases' | 'custom' | 'result';

export interface NormalizedTestCase {
  id: string;
  index: number;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isSample?: boolean;
}

export interface NormalizedCaseResult {
  testCaseIndex: number;
  passed: boolean;
  status: string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  stderr?: string;
  runtime?: number;
  memory?: number;
  isHidden?: boolean;
}

export interface ExecutionResult {
  verdict: string;
  passedTestCases: number;
  totalTestCases: number;
  runtime?: number;
  memory?: number;
  compilerOutput?: string;
  errorMessage?: string;
  results: NormalizedCaseResult[];
  isSubmit?: boolean;
  xpEarned?: number;
}

export interface ExecutionErrorInfo {
  message: string;
  isServiceUnavailable: boolean;
  statusCode?: number;
}

export interface TestCasePanelProps {
  activeTab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  testCases: NormalizedTestCase[];
  selectedIndices: number[];
  onToggleTestCase: (index: number) => void;
  onSelectAllTestCases: (selectAll: boolean) => void;
  customInput: string;
  onCustomInputChange: (value: string) => void;
  result: ExecutionResult | null;
  isRunning?: boolean;
  isSubmitting?: boolean;
  submitProgress?: number;
  executionError?: ExecutionErrorInfo | null;
  className?: string;
}

function getVerdictBannerStyles(verdict: string): {
  container: string;
  text: string;
  badge: string;
} {
  const normalized = verdict.toLowerCase();
  if (normalized === 'accepted') {
    return {
      container: 'border-[#22C55E]/35 bg-[#22C55E]/10',
      text: 'text-[#22C55E]',
      badge: 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]',
    };
  }
  if (
    normalized.includes('time limit') ||
    normalized.includes('memory limit') ||
    normalized === 'pending' ||
    normalized === 'running'
  ) {
    return {
      container: 'border-amber-500/35 bg-amber-500/10',
      text: 'text-amber-400',
      badge: 'border-amber-500/40 bg-amber-500/15 text-amber-400',
    };
  }
  return {
    container: 'border-red-500/35 bg-red-500/10',
    text: 'text-red-400',
    badge: 'border-red-500/40 bg-red-500/15 text-red-400',
  };
}

function formatMemoryValue(memoryKb?: number): string {
  if (memoryKb === undefined || memoryKb === null || Number.isNaN(memoryKb) || memoryKb <= 0) {
    return '—';
  }
  if (memoryKb >= 1024) {
    return `${(memoryKb / 1024).toFixed(2)} MB`;
  }
  return `${Math.round(memoryKb)} KB`;
}

function formatRuntimeValue(runtimeMs?: number): string {
  if (runtimeMs === undefined || runtimeMs === null || Number.isNaN(runtimeMs) || runtimeMs < 0) {
    return '—';
  }
  return `${Math.round(runtimeMs)} ms`;
}

export function TestCasePanel({
  activeTab,
  onTabChange,
  testCases,
  selectedIndices,
  onToggleTestCase,
  onSelectAllTestCases,
  customInput,
  onCustomInputChange,
  result,
  isRunning = false,
  isSubmitting = false,
  submitProgress = 0,
  executionError = null,
  className,
}: TestCasePanelProps) {
  const [activeResultCaseIdx, setActiveResultCaseIdx] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (result?.results && result.results.length > 0) {
      const firstFailed = result.results.findIndex((r) => !r.passed);
      setActiveResultCaseIdx(firstFailed >= 0 ? firstFailed : 0);
    } else {
      setActiveResultCaseIdx(0);
    }
  }, [result]);

  const allSelected = useMemo(
    () => testCases.length > 0 && selectedIndices.length === testCases.length,
    [selectedIndices.length, testCases.length]
  );

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1500);
    }
  };

  const activeCaseResult = result?.results?.[activeResultCaseIdx] ?? null;
  const isBusy = isRunning || isSubmitting;

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col bg-[#161B22] text-[#F0F6FC]',
        className
      )}
    >
      {/* Tabs Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#30363D] bg-[#161B22] px-3">
        <div className="flex items-center gap-1" role="tablist" aria-label="Execution panel tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'testcases'}
            onClick={() => onTabChange('testcases')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'testcases'
                ? 'text-[#F0F6FC]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <FlaskConical className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
            <span>Test Cases</span>
            {testCases.length > 0 && (
              <span className="rounded-full bg-[#1C2128] px-1.5 py-0.5 text-[10px] font-semibold text-[#8B949E] border border-[#30363D]">
                {selectedIndices.length}/{testCases.length}
              </span>
            )}
            {activeTab === 'testcases' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#22C55E]" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'custom'}
            onClick={() => onTabChange('custom')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'custom'
                ? 'text-[#F0F6FC]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            <Terminal className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>Custom Input</span>
            {customInput.trim().length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
            )}
            {activeTab === 'custom' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#22C55E]" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'result'}
            onClick={() => onTabChange('result')}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'result'
                ? 'text-[#F0F6FC]'
                : 'text-[#8B949E] hover:text-[#F0F6FC]'
            )}
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#22C55E]" aria-hidden="true" />
            ) : result ? (
              result.verdict.toLowerCase() === 'accepted' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
              )
            ) : executionError ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            ) : null}
            <span>Result</span>
            {result && !isBusy && (
              <span
                className={cn(
                  'rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
                  getVerdictBannerStyles(result.verdict).badge
                )}
              >
                {result.verdict}
              </span>
            )}
            {activeTab === 'result' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#22C55E]" />
            )}
          </button>
        </div>

        {activeTab === 'testcases' && testCases.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectAllTestCases(!allSelected)}
            className="text-xs font-medium text-[#22C55E] transition hover:text-[#22C55E]/80"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
        {/* TEST CASES TAB */}
        {activeTab === 'testcases' && (
          <div className="space-y-3">
            {testCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#30363D] bg-[#1C2128]/50 px-4 py-8 text-center">
                <FlaskConical className="mb-2 h-6 w-6 text-[#8B949E]" aria-hidden="true" />
                <p className="text-sm font-medium text-[#F0F6FC]">No sample test cases provided</p>
                <p className="mt-1 text-xs text-[#8B949E]">
                  Use the Custom Input tab to test your code with your own stdin.
                </p>
              </div>
            ) : (
              testCases.map((tc, idx) => {
                const isSelected = selectedIndices.includes(tc.index);
                return (
                  <div
                    key={tc.id}
                    className={cn(
                      'rounded-xl border p-3 transition-colors',
                      isSelected
                        ? 'border-[#22C55E]/40 bg-[#1C2128]'
                        : 'border-[#30363D] bg-[#1C2128]/60 opacity-80'
                    )}
                  >
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#F0F6FC]">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleTestCase(tc.index)}
                          className="h-3.5 w-3.5 rounded border-[#30363D] bg-[#0D1117] text-[#22C55E] focus:ring-[#22C55E]/40 accent-[#22C55E]"
                        />
                        <span>Sample Case {idx + 1}</span>
                        {isSelected && (
                          <span className="rounded bg-[#22C55E]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#22C55E]">
                            Selected
                          </span>
                        )}
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          onCustomInputChange(tc.input);
                          onTabChange('custom');
                        }}
                        className="rounded-md border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[11px] font-medium text-[#8B949E] transition hover:border-[#22C55E]/40 hover:text-[#F0F6FC]"
                      >
                        Copy to Custom Input
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                            Input
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopy(`tc-in-${tc.id}`, tc.input)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#F0F6FC]"
                            aria-label={`Copy input for case ${idx + 1}`}
                          >
                            {copiedKey === `tc-in-${tc.id}` ? (
                              <Check className="h-3 w-3 text-[#22C55E]" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <pre className="max-h-28 overflow-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 font-mono text-xs text-[#F0F6FC] whitespace-pre-wrap break-words">
                          {tc.input || '(empty)'}
                        </pre>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                            Expected Output
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopy(`tc-out-${tc.id}`, tc.expectedOutput)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#F0F6FC]"
                            aria-label={`Copy expected output for case ${idx + 1}`}
                          >
                            {copiedKey === `tc-out-${tc.id}` ? (
                              <Check className="h-3 w-3 text-[#22C55E]" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <pre className="max-h-28 overflow-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 font-mono text-xs text-[#F0F6FC] whitespace-pre-wrap break-words">
                          {tc.expectedOutput || '(empty)'}
                        </pre>
                      </div>
                    </div>

                    {tc.explanation && (
                      <p className="mt-2 text-xs leading-relaxed text-[#8B949E]">
                        <span className="font-medium text-[#F0F6FC]">Explanation: </span>
                        {tc.explanation}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CUSTOM INPUT TAB */}
        {activeTab === 'custom' && (
          <div className="flex h-full flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#F0F6FC]">Custom Standard Input (stdin)</span>
                <span className="text-[11px] text-[#8B949E]">
                  Used when clicking &ldquo;Run Code&rdquo; from this tab
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {testCases.slice(0, 3).map((tc, idx) => (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => onCustomInputChange(tc.input)}
                    className="rounded-md border border-[#30363D] bg-[#1C2128] px-2 py-1 text-[11px] font-medium text-[#8B949E] transition hover:border-[#22C55E]/40 hover:text-[#F0F6FC]"
                  >
                    Load Case {idx + 1}
                  </button>
                ))}
                {customInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onCustomInputChange('')}
                    className="rounded-md border border-[#30363D] bg-[#1C2128] px-2 py-1 text-[11px] font-medium text-red-400 transition hover:border-red-500/40"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={customInput}
              onChange={(e) => onCustomInputChange(e.target.value)}
              placeholder="Enter custom stdin input here..."
              aria-label="Custom stdin input"
              spellCheck={false}
              className="min-h-[120px] w-full flex-1 resize-none rounded-xl border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-[#F0F6FC] placeholder:text-[#8B949E]/60 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]/40"
            />
          </div>
        )}

        {/* RESULT TAB */}
        {activeTab === 'result' && (
          <div className="space-y-3">
            {isBusy && (
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#22C55E]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#F0F6FC]">
                      {isSubmitting ? 'Judging your submission...' : 'Running your code...'}
                    </p>
                    <p className="text-xs text-[#8B949E]">
                      {isSubmitting
                        ? 'Compiling and executing against all sample and hidden test cases.'
                        : 'Compiling and running against selected test cases.'}
                    </p>
                  </div>
                </div>

                {isSubmitting && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[11px] text-[#8B949E]">
                      <span>Progress</span>
                      <span>{Math.min(100, Math.max(10, Math.round(submitProgress)))}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#0D1117]">
                      <div
                        className="h-full rounded-full bg-[#22C55E] transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(10, submitProgress))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isBusy && executionError && (
              <div
                role="alert"
                className={cn(
                  'rounded-xl border p-4',
                  executionError.isServiceUnavailable
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-red-500/40 bg-red-500/10'
                )}
              >
                <div className="flex items-start gap-3">
                  {executionError.isServiceUnavailable ? (
                    <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={cn(
                        'text-sm font-semibold',
                        executionError.isServiceUnavailable ? 'text-amber-300' : 'text-red-300'
                      )}
                    >
                      {executionError.isServiceUnavailable
                        ? 'Code Execution Service Unavailable'
                        : 'Execution Failed'}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-[#F0F6FC]/90">
                      {executionError.message}
                    </p>
                    {executionError.isServiceUnavailable && (
                      <p className="mt-2 text-[11px] text-[#8B949E]">
                        The judging sandbox could not be reached right now. Your code draft is safe; please retry in a moment.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isBusy && !executionError && !result && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#30363D] bg-[#1C2128]/50 px-4 py-10 text-center">
                <Terminal className="mb-2 h-6 w-6 text-[#8B949E]" aria-hidden="true" />
                <p className="text-sm font-medium text-[#F0F6FC]">No execution results yet</p>
                <p className="mt-1 text-xs text-[#8B949E]">
                  Click <span className="font-semibold text-[#F0F6FC]">Run Code</span> to test or{' '}
                  <span className="font-semibold text-[#22C55E]">Submit</span> to evaluate your solution.
                </p>
              </div>
            )}

            {!isBusy && result && (
              <div className="space-y-3">
                {/* Summary Banner */}
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5',
                    getVerdictBannerStyles(result.verdict).container
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {result.verdict.toLowerCase() === 'accepted' ? (
                      <CheckCircle2 className="h-5 w-5 text-[#22C55E]" aria-hidden="true" />
                    ) : (
                      <XCircle
                        className={cn('h-5 w-5', getVerdictBannerStyles(result.verdict).text)}
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-base font-bold',
                            getVerdictBannerStyles(result.verdict).text
                          )}
                        >
                          {result.verdict}
                        </span>
                        {result.xpEarned !== undefined && result.xpEarned > 0 && (
                          <span className="rounded-full bg-[#22C55E] px-2 py-0.5 text-[11px] font-bold text-slate-950">
                            +{result.xpEarned} XP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B949E]">
                        Passed{' '}
                        <span className="font-semibold text-[#F0F6FC]">
                          {result.passedTestCases}/{result.totalTestCases}
                        </span>{' '}
                        test cases
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#8B949E]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                      <span>Runtime:</span>
                      <span className="font-mono font-semibold text-[#F0F6FC]">
                        {formatRuntimeValue(result.runtime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
                      <span>Memory:</span>
                      <span className="font-mono font-semibold text-[#F0F6FC]">
                        {formatMemoryValue(result.memory)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compiler / Runtime Error Output */}
                {(result.compilerOutput || result.errorMessage) && (
                  <div className="rounded-xl border border-red-500/30 bg-[#0D1117] p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-400">
                        {result.compilerOutput ? 'Compiler Output' : 'Error Details'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(
                            'compiler-err',
                            result.compilerOutput || result.errorMessage || ''
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#F0F6FC]"
                      >
                        {copiedKey === 'compiler-err' ? (
                          <Check className="h-3 w-3 text-[#22C55E]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-red-300">
                      {[result.compilerOutput, result.errorMessage].filter(Boolean).join('\n\n')}
                    </pre>
                  </div>
                )}

                {/* Per-test-case Results */}
                {result.results && result.results.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {result.results.map((tcRes, idx) => {
                        const isActive = idx === activeResultCaseIdx;
                        return (
                          <button
                            key={`${tcRes.testCaseIndex}-${idx}`}
                            type="button"
                            onClick={() => setActiveResultCaseIdx(idx)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                              isActive
                                ? 'border-[#22C55E] bg-[#1C2128] text-[#F0F6FC]'
                                : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
                            )}
                          >
                            {tcRes.passed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                            )}
                            <span>Case {idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    {activeCaseResult && (
                      <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                              getVerdictBannerStyles(activeCaseResult.status).badge
                            )}
                          >
                            {activeCaseResult.status}
                          </span>
                          <div className="flex items-center gap-3 text-[11px] text-[#8B949E]">
                            {activeCaseResult.runtime !== undefined && (
                              <span>Runtime: {formatRuntimeValue(activeCaseResult.runtime)}</span>
                            )}
                            {activeCaseResult.memory !== undefined && (
                              <span>Memory: {formatMemoryValue(activeCaseResult.memory)}</span>
                            )}
                          </div>
                        </div>

                        {activeCaseResult.isHidden ? (
                          <p className="text-xs italic text-[#8B949E]">
                            This is a hidden test case. Input and expected output are concealed.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {activeCaseResult.input !== undefined && (
                              <div>
                                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                                  Input
                                </div>
                                <pre className="max-h-24 overflow-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-2 font-mono text-xs text-[#F0F6FC] whitespace-pre-wrap break-words">
                                  {activeCaseResult.input || '(empty)'}
                                </pre>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {activeCaseResult.expectedOutput !== undefined && (
                                <div>
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                                    Expected Output
                                  </div>
                                  <pre className="max-h-28 overflow-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-2 font-mono text-xs text-[#F0F6FC] whitespace-pre-wrap break-words">
                                    {activeCaseResult.expectedOutput || '(empty)'}
                                  </pre>
                                </div>
                              )}

                              {activeCaseResult.actualOutput !== undefined && (
                                <div>
                                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#8B949E]">
                                    Your Output
                                  </div>
                                  <pre
                                    className={cn(
                                      'max-h-28 overflow-auto rounded-lg border bg-[#0D1117] p-2 font-mono text-xs whitespace-pre-wrap break-words',
                                      activeCaseResult.passed
                                        ? 'border-[#22C55E]/30 text-[#22C55E]'
                                        : 'border-red-500/30 text-red-300'
                                    )}
                                  >
                                    {activeCaseResult.actualOutput || '(empty)'}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {activeCaseResult.stderr && (
                              <div>
                                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-red-400">
                                  Standard Error (stderr)
                                </div>
                                <pre className="max-h-24 overflow-auto rounded-lg border border-red-500/30 bg-[#0D1117] p-2 font-mono text-xs text-red-300 whitespace-pre-wrap break-words">
                                  {activeCaseResult.stderr}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TestCasePanel;
