export type UserRole = 'user' | 'student' | 'admin';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ConceptType = 'theory' | 'problem' | 'both';

export type ProgrammingLanguage =
  | 'c'
  | 'cpp'
  | 'java'
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'go';

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compilation Error'
  | 'Pending'
  | 'Running';

export interface UserStreak {
  current: number;
  longest: number;
  lastActiveDate?: string;
}

export interface UserSolvedStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface UserPreferences {
  theme?: 'dark' | 'light';
  editorFontSize?: number;
  editorTabSize?: number;
  emailNotifications?: boolean;
  dailyReminder?: boolean;
}

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  collegeName?: string;
  college?: string;
  avatar?: string;
  bio?: string;
  xp: number;
  level?: number;
  rank?: number;
  streak?: UserStreak;
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: string;
  solvedCount?: UserSolvedStats | number;
  problemsSolved?: number;
  preferredLanguage: ProgrammingLanguage;
  preferences?: UserPreferences;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  isActive?: boolean;
  isVerified?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  _id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  icon?: string;
  iconName?: string;
  color?: string;
  difficulty?: Difficulty;
  estimatedHours?: number;
  totalConcepts?: number;
  completedConcepts?: number;
  completedCount?: number;
  prerequisites?: Array<string | Module>;
  topics?: Topic[];
  topicCount?: number;
  completedTopicCount?: number;
  problemCount?: number;
  solvedProblemCount?: number;
  progress?: number;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TopicResourceLink {
  url: string;
  title?: string;
  channel?: string;
  language?: string;
  difficulty?: string;
  verified?: boolean;
}

export interface TopicResources {
  codechef?: TopicResourceLink;
  codechefLinks?: TopicResourceLink[];
  leetcode?: TopicResourceLink;
  leetcodeLinks?: TopicResourceLink[];
  youtube?: TopicResourceLink[] | TopicResourceLink;
}

export interface SelfReportedExternalProgress {
  codechef?: boolean;
  leetcode?: boolean;
}

export interface Topic {
  _id: string;
  moduleId?: string;
  module?: string | Module;
  title: string;
  slug: string;
  description: string;
  order: number;
  difficulty?: Difficulty;
  conceptType?: ConceptType;
  resources?: TopicResources;
  estimatedMinutes?: number;
  prerequisites?: Array<string | Topic>;
  tags?: string[];
  hasNotes?: boolean;
  problem?: Pick<Problem, '_id' | 'title' | 'slug' | 'difficulty'> | string;
  problemId?: string;
  problemSlug?: string;
  problemCount?: number;
  solvedProblemCount?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  isCompleted?: boolean;
  completedAt?: string | null;
  selfReportedExternal?: SelfReportedExternalProgress;
  isVerified?: boolean;
  codeclimbVerified?: boolean;
  verifiedOnCodeClimb?: boolean;
  isBookmarked?: boolean;
  inRevision?: boolean;
  isInRevision?: boolean;
  revisionId?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodeExample {
  language: ProgrammingLanguage | string;
  title?: string;
  code: string;
  explanation?: string;
}

export interface NoteImplementations {
  c?: string;
  cpp?: string;
  java?: string;
  python?: string;
  [key: string]: string | undefined;
}

export interface NoteTopicNavigation {
  _id?: string;
  title: string;
  slug: string;
}

export interface Note {
  _id: string;
  topicId?: string;
  topic?: string | Topic;
  topicSlug?: string;
  title: string;
  slug?: string;
  content?: string;
  definition?: string;
  explanation?: string;
  realWorldAnalogy?: string;
  algorithm?: string | string[];
  pseudocode?: string;
  dryRunExample?: string;
  summary?: string;
  keyPoints?: string[];
  commonMistakes?: string[];
  interviewTips?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  implementations?: NoteImplementations;
  relatedProblems?: Array<
    string | Problem | { _id: string; title: string; slug: string; difficulty?: Difficulty; tags?: string[]; isSolved?: boolean }
  >;
  codeExamples?: CodeExample[];
  readTimeMinutes?: number;
  order?: number;
  isRead?: boolean;
  isLearned?: boolean;
  isBookmarked?: boolean;
  prevTopic?: NoteTopicNavigation | null;
  nextTopic?: NoteTopicNavigation | null;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestCase {
  _id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
  isSample?: boolean;
  order?: number;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  difficulty: Difficulty;
  topicId?: string;
  topic?: Topic | string;
  topics?: Array<string | Topic>;
  moduleId?: string;
  tags: string[];
  companies?: string[];
  constraints?: string | string[];
  examples: ProblemExample[];
  testCases?: TestCase[];
  sampleTestCases?: TestCase[];
  starterCode: Partial<Record<ProgrammingLanguage | string, string>>;
  solutionCode?: Partial<Record<ProgrammingLanguage | string, string>>;
  editorial?: string;
  solutionExplanation?: string;
  hints?: string[];
  timeLimit?: number;
  timeLimitMs?: number;
  memoryLimit?: number;
  memoryLimitMb?: number;
  acceptanceRate?: number;
  totalSubmissions?: number;
  submissionCount?: number;
  acceptedSubmissions?: number;
  xpReward?: number;
  order?: number;
  isSolved?: boolean;
  isAttempted?: boolean;
  isBookmarked?: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseResult {
  testCaseIndex: number;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  stderr?: string;
  status: string;
  executionTimeMs?: number;
  memoryKb?: number;
  isHidden?: boolean;
}

export interface Submission {
  _id: string;
  userId?: string | User;
  user?: string | User;
  problemId?: string | Problem;
  problem?: string | Problem;
  language: ProgrammingLanguage | string;
  code: string;
  status?: SubmissionStatus;
  verdict?: SubmissionStatus;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs?: number;
  runtime?: number;
  memoryKb?: number;
  memory?: number;
  errorMessage?: string;
  compileOutput?: string;
  compilerOutput?: string;
  testCaseResults?: TestCaseResult[];
  xpEarned?: number;
  notes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SolvedProblemRecord {
  problemId: string;
  solvedAt: string;
  bestTimeMs?: number;
  language?: ProgrammingLanguage | string;
}

export interface CompletedTopicRecord {
  topicId: string;
  completedAt: string;
  notesRead?: boolean;
}

export interface ModuleProgressItem {
  moduleId: string;
  moduleTitle?: string;
  completedTopics: number;
  totalTopics: number;
  solvedProblems: number;
  totalProblems: number;
  percentage: number;
}

export interface ActivityHeatmapPoint {
  date: string;
  count: number;
  level?: 0 | 1 | 2 | 3 | 4;
}

export interface UserProgress {
  _id: string;
  userId: string;
  solvedProblems: SolvedProblemRecord[];
  completedTopics: CompletedTopicRecord[];
  moduleProgress?: ModuleProgressItem[];
  activityHeatmap?: ActivityHeatmapPoint[];
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpentMinutes?: number;
  lastActivityDate?: string;
  createdAt?: string;
  updatedAt: string;
}

export type BookmarkItemType = 'problem' | 'note' | 'topic';

export interface Bookmark {
  _id: string;
  userId: string;
  itemType: BookmarkItemType;
  problemId?: string | Problem;
  noteId?: string | Note;
  topicId?: string | Topic;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type RevisionRating = 'again' | 'hard' | 'good' | 'easy';
export type RevisionStatus = 'pending' | 'due' | 'completed';

export interface Revision {
  _id: string;
  userId?: string;
  user?: string;
  problemId?: string | Problem;
  problem?: Problem | { _id: string; title: string; slug: string; difficulty: Difficulty; tags?: string[]; isBookmarked?: boolean };
  incorrectAttempts?: number;
  lastAttemptDate?: string | null;
  revisionStatus?: RevisionStatus;
  nextRevisionDate?: string | null;
  isManual?: boolean;
  markedDifficult?: boolean;
  isBookmarked?: boolean;
  confidenceLevel?: 1 | 2 | 3 | 4 | 5;
  intervalDays?: number;
  easeFactor?: number;
  repetitions?: number;
  nextReviewDate?: string;
  lastReviewedAt?: string;
  notes?: string;
  isMastered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyChallengeAttemptSummary {
  _id?: string;
  isCompleted?: boolean;
  completedAt?: string | null;
  xpAwarded?: boolean;
}

export interface DailyChallenge {
  _id: string;
  date: string;
  difficulty?: Difficulty;
  problemId?: string | Problem;
  problem?: Problem;
  xpBonus?: number;
  xpEarned?: number;
  participantsCount?: number;
  solvedCount?: number;
  isCompleted?: boolean;
  isCompletedByUser?: boolean;
  status?: 'completed' | 'missed' | 'pending' | 'active';
  completedAt?: string | null;
  attempt?: DailyChallengeAttemptSummary | null;
  streak?: number;
  currentStreak?: number;
  longestStreak?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AchievementCategory =
  | 'streak'
  | 'solving'
  | 'roadmap'
  | 'speed'
  | 'revision'
  | 'special';

export interface Achievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  requirement?: {
    type: string;
    threshold: number;
  };
  unlocked?: boolean;
  unlockedAt?: string;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodeDraft {
  _id?: string;
  userId?: string;
  problemId: string;
  language: ProgrammingLanguage | string;
  code: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  errors?: ApiFieldError[];
}

/* Request & View DTOs */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  username?: string;
  email: string;
  password: string;
  college?: string;
  collegeName?: string;
  preferredLanguage?: ProgrammingLanguage | string;
}

export interface UpdateProfilePayload {
  name?: string;
  username?: string;
  college?: string;
  collegeName?: string;
  avatar?: string;
  bio?: string;
  preferredLanguage?: ProgrammingLanguage;
  preferences?: UserPreferences;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface ProblemFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: Difficulty | '';
  topic?: string;
  module?: string;
  tag?: string;
  status?: 'all' | 'solved' | 'attempted' | 'unsolved';
  sort?: 'order' | 'difficulty' | 'acceptance' | 'newest';
}

export interface CodeRunPayload {
  problemId: string;
  language: ProgrammingLanguage | string;
  code: string;
  customInput?: string;
}

export interface CodeRunResponse {
  status: SubmissionStatus;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs?: number;
  memoryKb?: number;
  compileOutput?: string;
  errorMessage?: string;
  results: TestCaseResult[];
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, '_id' | 'name' | 'username' | 'avatar' | 'xp' | 'level' | 'streak' | 'solvedCount'>;
  score: number;
}

export interface PerformanceStats {
  solvedByDifficulty: UserSolvedStats;
  totalProblemsByDifficulty: UserSolvedStats;
  topicMastery: Array<{
    topicId: string;
    topicTitle: string;
    topicSlug: string;
    solved: number;
    total: number;
    accuracy: number;
  }>;
  languageBreakdown: Array<{
    language: string;
    submissions: number;
    accepted: number;
  }>;
  submissionStats: {
    total: number;
    accepted: number;
    acceptanceRate: number;
    averageTimeMs: number;
  };
  weeklyActivity: Array<{
    day: string;
    date: string;
    submissions: number;
    solved: number;
  }>;
  activityHeatmap: ActivityHeatmapPoint[];
}

export interface AdminSubmissionTrendPoint {
  date: string;
  label?: string;
  total: number;
  accepted: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  totalProblems: number;
  totalModules: number;
  totalTopics: number;
  totalSubmissions: number;
  acceptanceRate: number;
  recentUsers: User[];
  recentSubmissions: Submission[];
  submissionTrends?: AdminSubmissionTrendPoint[];
}

export interface AdminTopicCompletionStat {
  topicId: string;
  topicTitle: string;
  topicSlug?: string;
  moduleTitle?: string;
  difficulty?: Difficulty;
  completedUsers: number;
  totalUsers: number;
  completionRate: number;
}

export interface AdminReportsData {
  submissionStats: {
    total: number;
    accepted: number;
    acceptanceRate: number;
    avgRuntimeMs?: number;
    byVerdict: Array<{ verdict: string; count: number }>;
    byLanguage: Array<{ language: string; submissions: number; accepted: number }>;
    dailyTrends: AdminSubmissionTrendPoint[];
  };
  topicCompletionRates: AdminTopicCompletionStat[];
  userActivityOverview: {
    totalUsers: number;
    activeToday: number;
    activeLast7Days: number;
    activeLast30Days: number;
    newUsersLast7Days: number;
    averageXp: number;
    dailyActiveTrend: Array<{
      date: string;
      activeUsers: number;
      submissions: number;
    }>;
  };
}

export interface AdminAuditLog {
  _id: string;
  admin:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role?: UserRole;
      };
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface ProblemValidationPayload {
  problemId?: string;
  language: string;
  code: string;
  testCases: TestCase[];
  timeLimit?: number;
  memoryLimit?: number;
}

export interface ProblemValidationResult {
  passed: boolean;
  passedCount: number;
  totalCount: number;
  executionTimeMs?: number;
  compileOutput?: string;
  errorMessage?: string;
  results: TestCaseResult[];
}
