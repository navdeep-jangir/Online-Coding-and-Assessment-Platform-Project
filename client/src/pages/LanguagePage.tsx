import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Play,
  Sparkles,
  Terminal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/services/api';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';

export const PREFERRED_LANGUAGE_STORAGE_KEY = 'codeclimb_preferred_language';
type SupportedLanguage = 'c' | 'cpp' | 'java' | 'python';

interface TopicExample {
  title: string;
  summary: string;
  code: string;
}

interface LanguageGuide {
  id: SupportedLanguage;
  name: string;
  tagline: string;
  intro: string;
  whyDsa: string;
  youtubeUrl: string;
  youtubeTitle: string;
  dsaLibraries: string[];
  topics: TopicExample[];
}

const LANGUAGE_GUIDES: Record<SupportedLanguage, LanguageGuide> = {
  c: {
    id: 'c',
    name: 'C',
    tagline: 'Low-level memory control, pointers, and foundational systems logic',
    intro:
      'C is a procedural, compiled systems language created by Dennis Ritchie. Learning DSA in C builds deep intuition for how arrays, structs, pointers, and dynamic memory allocation actually work under the hood.',
    whyDsa:
      'Understanding pointers, malloc/free, and manual linked-list/tree node management in C eliminates black-box thinking in technical interviews.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=c+programming+data+structures+tutorial',
    youtubeTitle: 'C Programming & Data Structures Tutorials (YouTube)',
    dsaLibraries: ['<stdio.h> (Fast I/O)', '<stdlib.h> (malloc, qsort)', '<string.h> (strlen, memset)', '<limits.h> (INT_MAX, INT_MIN)'],
    topics: [
      {
        title: '1. Variables, Data Types & I/O',
        summary: 'Declare int, long long, double, char and read/write with scanf and printf.',
        code: `#include <stdio.h>\n\nint main() {\n    int age = 20;\n    long long bigNum = 10000000000LL;\n    double gpa = 9.25;\n    printf("Age: %d, GPA: %.2f\\n", age, gpa);\n    return 0;\n}`,
      },
      {
        title: '2. Operators, Conditions & Loops',
        summary: 'Use arithmetic, relational, logical, bitwise operators, if-else, and for/while loops.',
        code: `int sumEven(int n) {\n    int sum = 0;\n    for (int i = 2; i <= n; i += 2) {\n        if (i % 2 == 0) sum += i;\n    }\n    return sum;\n}`,
      },
      {
        title: '3. Functions, Pointers & Arrays',
        summary: 'Pass arrays and pointers to functions to mutate values in O(1) extra space.',
        code: `void reverseArray(int arr[], int n) {\n    int l = 0, r = n - 1;\n    while (l < r) {\n        int tmp = arr[l];\n        arr[l++] = arr[r];\n        arr[r--] = tmp;\n    }\n}`,
      },
      {
        title: '4. Strings & Structs for DSA',
        summary: 'Manipulate null-terminated char arrays and define linked list or tree nodes with struct.',
        code: `struct Node {\n    int data;\n    struct Node* next;\n};`,
      },
    ],
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    tagline: 'Blazing-fast execution with the Standard Template Library (STL)',
    intro:
      'C++ combines zero-overhead performance with rich generic containers and algorithms via the Standard Template Library (STL), making it the most popular language for competitive programming and DSA interviews.',
    whyDsa:
      'STL containers like vector, unordered_map, set, stack, queue, and priority_queue plus sort/lower_bound let you write concise, O(n log n) solutions.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=c%2B%2B+stl+dsa+tutorial',
    youtubeTitle: 'C++ & STL for DSA Tutorials (YouTube)',
    dsaLibraries: ['<vector> & <string>', '<unordered_map> & <unordered_set>', '<stack>, <queue>, <deque>', '<algorithm> (sort, lower_bound)'],
    topics: [
      {
        title: '1. Fast I/O, Variables & Data Types',
        summary: 'Use ios::sync_with_stdio(false) and cin/cout for fast competitive programming I/O.',
        code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    long long a, b;\n    if (cin >> a >> b) cout << (a + b) << "\\n";\n    return 0;\n}`,
      },
      {
        title: '2. Operators, Conditions & Loops',
        summary: 'Range-based for loops, auto type deduction, and bitwise shortcuts.',
        code: `int countSetBits(int n) {\n    int count = 0;\n    while (n > 0) {\n        n &= (n - 1);\n        count++;\n    }\n    return count;\n}`,
      },
      {
        title: '3. Vectors, Strings & Functions',
        summary: 'Pass vectors by const reference (&) to avoid expensive copies.',
        code: `int maxElement(const vector<int>& nums) {\n    int best = nums[0];\n    for (int x : nums) best = max(best, x);\n    return best;\n}`,
      },
      {
        title: '4. STL Maps, Sets & Priority Queues',
        summary: 'O(1) average hashing with unordered_map and O(log n) heaps with priority_queue.',
        code: `unordered_map<int, int> freq;\nfor (int x : nums) freq[x]++;\npriority_queue<int, vector<int>, greater<int>> minHeap;`,
      },
    ],
  },
  java: {
    id: 'java',
    name: 'Java',
    tagline: 'Strongly-typed OOP with the Java Collections Framework',
    intro:
      'Java is a strongly typed, object-oriented language widely used in enterprise engineering and technical interviews. Its Collections Framework provides clean, reliable implementations of every standard data structure.',
    whyDsa:
      'On CodeClimb (and Judge0), Java submissions use `public class Main` with `public static void main(String[] args)`.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=java+dsa+collections+tutorial',
    youtubeTitle: 'Java & Collections Framework DSA Tutorials (YouTube)',
    dsaLibraries: ['java.util.Scanner / BufferedReader', 'ArrayList, LinkedList, ArrayDeque', 'HashMap, HashSet, TreeMap', 'PriorityQueue, Arrays.sort'],
    topics: [
      {
        title: '1. Main Class Convention & I/O',
        summary: 'Always wrap your solution inside `public class Main` when submitting on CodeClimb.',
        code: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(a + b);\n    }\n}`,
      },
      {
        title: '2. Operators, Conditions & Loops',
        summary: 'Standard control flow, enhanced for-each loops, and ternary expressions.',
        code: `public static boolean isPrime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; (long) i * i <= n; i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}`,
      },
      {
        title: '3. Arrays, Strings & StringBuilder',
        summary: 'Use StringBuilder instead of string concatenation inside loops for O(n) performance.',
        code: `StringBuilder sb = new StringBuilder();\nfor (int i = s.length() - 1; i >= 0; i--) {\n    sb.append(s.charAt(i));\n}\nString reversed = sb.toString();`,
      },
      {
        title: '4. Java Collections for DSA',
        summary: 'Use ArrayDeque for stacks/queues, HashMap for O(1) lookup, and PriorityQueue for heaps.',
        code: `Map<Integer, Integer> map = new HashMap<>();\nDeque<Integer> stack = new ArrayDeque<>();\nPriorityQueue<Integer> minHeap = new PriorityQueue<>();`,
      },
    ],
  },
  python: {
    id: 'python',
    name: 'Python',
    tagline: 'Expressive syntax, built-in arbitrary-precision ints, and rapid prototyping',
    intro:
      'Python offers clean, readable syntax that lets you focus directly on algorithmic logic. Built-in arbitrary-precision integers eliminate integer overflow, and standard modules cover heaps, deques, and hashing.',
    whyDsa:
      'Using `sys.stdin.read().split()`, `collections.deque`, `collections.Counter`, and `heapq` keeps Python solutions fast and clean.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=python+data+structures+algorithms+tutorial',
    youtubeTitle: 'Python Data Structures & Algorithms Tutorials (YouTube)',
    dsaLibraries: ['sys.stdin.read() (Fast Input)', 'collections.deque & Counter', 'heapq (Min-Heap)', 'bisect (Binary Search)'],
    topics: [
      {
        title: '1. Variables, Types & Fast I/O',
        summary: 'Read space-separated integers cleanly using map(int, sys.stdin.read().split()).',
        code: `import sys\n\ndata = sys.stdin.read().split()\nif data:\n    a, b = int(data[0]), int(data[1])\n    print(a + b)`,
      },
      {
        title: '2. Operators, Conditions & Loops',
        summary: 'Use // for integer division, enumerate() for index+value, and slicing.',
        code: `def is_palindrome(s: str) -> bool:\n    return s == s[::-1]`,
      },
      {
        title: '3. Lists, Strings & Comprehensions',
        summary: 'Python lists act as dynamic arrays with O(1) amortized append and pop.',
        code: `nums = [3, 1, 4, 1, 5]\nsquares = [x * x for x in nums if x > 1]`,
      },
      {
        title: '4. Dict, Set, Deque & Heapq',
        summary: 'Standard DSA toolkit in Python.',
        code: `from collections import deque, Counter\nimport heapq\n\nq = deque([0])\ncounts = Counter([1, 1, 2, 3])\nheap = []\nheapq.heappush(heap, 5)`,
      },
    ],
  },
};

const LANGUAGE_TABS: SupportedLanguage[] = ['c', 'cpp', 'java', 'python'];

interface SampleProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags?: string[];
}

export default function LanguagePage() {
  const { lang } = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const activeLang: SupportedLanguage = LANGUAGE_TABS.includes(lang as SupportedLanguage)
    ? (lang as SupportedLanguage)
    : 'cpp';

  const guide = LANGUAGE_GUIDES[activeLang];

  const [problems, setProblems] = useState<SampleProblem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savingPref, setSavingPref] = useState(false);

  // Persist selected language locally (and to MongoDB for logged-in students)
  useEffect(() => {
    try {
      localStorage.setItem(PREFERRED_LANGUAGE_STORAGE_KEY, activeLang);
    } catch {
      // Ignore storage errors
    }
  }, [activeLang]);

  useEffect(() => {
    let active = true;
    setLoadingProblems(true);
    api
      .get('/problems', { params: { limit: 6, page: 1 } })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setProblems(list);
      })
      .catch(() => {
        if (active) setProblems([]);
      })
      .finally(() => {
        if (active) setLoadingProblems(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectLanguage = async (nextLang: SupportedLanguage) => {
    try {
      localStorage.setItem(PREFERRED_LANGUAGE_STORAGE_KEY, nextLang);
    } catch {
      // Ignore storage errors
    }
    navigate(`/languages/${nextLang}`);

    if (isAuthenticated) {
      setSavingPref(true);
      try {
        await updateProfile({ preferredLanguage: nextLang });
        toast.success(`Preferred language set to ${LANGUAGE_GUIDES[nextLang].name}`, {
          id: 'lang-pref',
        });
      } catch {
        // Non-blocking
      } finally {
        setSavingPref(false);
      }
    }
  };

  const handleCopyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIdx(idx);
      toast.success('Code copied!', { id: 'copy-code' });
      setTimeout(() => setCopiedIdx(null), 1600);
    } catch {
      toast.error('Unable to copy code', { id: 'copy-code' });
    }
  };

  const firstProblemSlug = problems[0]?.slug || 'sum-of-two-numbers';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-[#F0F6FC]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#30363D] dark:bg-[#0D1117]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#22C55E]/50 hover:text-[#22C55E] dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#F0F6FC]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <span className="text-sm font-bold tracking-tight">
              Code<span className="text-[#22C55E]">Climb</span> · Languages
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#8B949E]"
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <Link
              to={`/practice/${firstProblemSlug}?lang=${activeLang}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117] transition hover:bg-[#16A34A]"
            >
              <Play className="h-3.5 w-3.5" />
              Start Coding in {guide.name}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Language Switcher Tabs */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select programming language">
            {LANGUAGE_TABS.map((tab) => {
              const item = LANGUAGE_GUIDES[tab];
              const isSelected = tab === activeLang;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  disabled={savingPref}
                  onClick={() => handleSelectLanguage(tab)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-[#38BDF8]/50 dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#8B949E] dark:hover:text-[#F0F6FC]'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 dark:text-[#8B949E]">
            {isAuthenticated
              ? 'Selecting a language saves it to your profile & editor.'
              : 'Selected language will auto-load in the Practice Editor.'}
          </span>
        </div>

        {/* Language Hero Card */}
        <motion.section
          key={activeLang}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#161B22] sm:p-8"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1 text-xs font-semibold text-[#22C55E]">
                <Terminal className="h-3.5 w-3.5" />
                Language Track · {guide.name}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                DSA with <span className="text-[#22C55E]">{guide.name}</span>
              </h1>
              <p className="mt-2 text-base font-medium text-[#38BDF8]">{guide.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-[#8B949E]">
                {guide.intro}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#8B949E]">
                <strong className="text-slate-900 dark:text-[#F0F6FC]">Why for DSA:</strong>{' '}
                {guide.whyDsa}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to={`/practice/${firstProblemSlug}?lang=${activeLang}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-[#0D1117] transition hover:bg-[#16A34A]"
              >
                <Code2 className="h-4 w-4" />
                Start Coding
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={guide.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#38BDF8] hover:text-[#38BDF8] dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#F0F6FC]"
              >
                <ExternalLink className="h-4 w-4 text-red-400" />
                YouTube Tutorials
              </a>
            </div>
          </div>

          {/* Standard Libraries */}
          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-[#30363D]">
            <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8B949E]">
              Key {guide.name} Libraries for DSA
            </div>
            <div className="flex flex-wrap gap-2">
              {guide.dsaLibraries.map((lib) => (
                <span
                  key={lib}
                  className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-xs text-slate-700 dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#38BDF8]"
                >
                  {lib}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Beginner to Advanced Syntax & Examples */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {guide.name} Fundamentals & DSA Building Blocks
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#8B949E]">
                Variables, I/O, operators, loops, functions, arrays, strings, and core data structures.
              </p>
            </div>
            <Link
              to="/roadmap?stage=beginner"
              className="hidden items-center gap-1.5 text-sm font-semibold text-[#22C55E] hover:underline sm:inline-flex"
            >
              <BookOpen className="h-4 w-4" />
              Open Full Roadmap Notes
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {guide.topics.map((topic, idx) => (
              <div
                key={topic.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#30363D] dark:bg-[#1C2128]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold">{topic.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-[#8B949E]">
                      {topic.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(topic.code, idx)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#22C55E]/50 hover:text-[#22C55E] dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#8B949E]"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <pre className="mt-4 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 dark:border-[#30363D] dark:bg-[#0D1117]">
                  <code>{topic.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* Database-Driven Relevant Coding Problems */}
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                <Sparkles className="h-5 w-5 text-[#22C55E]" />
                Practice Problems in {guide.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#8B949E]">
                Opening any problem automatically loads {guide.name} in the Monaco Editor.
              </p>
            </div>
            <Link
              to={`/practice?lang=${activeLang}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold transition hover:border-[#22C55E] hover:text-[#22C55E] dark:border-[#30363D]"
            >
              Browse All 150 Problems
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingProblems ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-[#30363D] dark:bg-[#1C2128]"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {problems.map((prob) => (
                <Link
                  key={prob._id}
                  to={`/practice/${prob.slug}?lang=${activeLang}`}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#22C55E]/60 dark:border-[#30363D] dark:bg-[#1C2128] dark:hover:border-[#22C55E]/60"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <DifficultyBadge difficulty={prob.difficulty} />
                      <span className="font-mono text-[11px] text-[#38BDF8]">{guide.name}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold group-hover:text-[#22C55E]">
                      {prob.title}
                    </h3>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
                    Solve in {guide.name}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
