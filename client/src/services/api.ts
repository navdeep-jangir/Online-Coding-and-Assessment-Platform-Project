import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type {
  Achievement,
  AdminAuditLog,
  AdminDashboardStats,
  AdminReportsData,
  ApiFieldError,
  ApiResponse,
  AuthResponse,
  Bookmark,
  BookmarkItemType,
  ChangePasswordPayload,
  CodeDraft,
  CodeRunPayload,
  CodeRunResponse,
  DailyChallenge,
  LeaderboardEntry,
  LoginCredentials,
  Module,
  Note,
  PaginatedResponse,
  PerformanceStats,
  Problem,
  ProblemFilterParams,
  ProblemValidationPayload,
  ProblemValidationResult,
  ProgrammingLanguage,
  RegisterPayload,
  Revision,
  RevisionRating,
  Submission,
  Topic,
  UpdateProfilePayload,
  User,
  UserProgress,
  UserRole,
} from '@/types';

const TOKEN_STORAGE_KEY = 'codeclimb_token';
export const AUTH_UNAUTHORIZED_EVENT = 'codeclimb:unauthorized';

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errors?: ApiFieldError[];
  public readonly isNetworkError: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errors?: ApiFieldError[],
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '') || '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: ApiFieldError[] }>) => {
    const statusCode = error.response?.status ?? 0;
    const isNetworkError = !error.response;
    const responseData = error.response?.data;
    const hasJsonMessage =
      responseData && typeof responseData === 'object' && typeof responseData.message === 'string';
    const message = hasJsonMessage
      ? responseData.message!
      : isNetworkError || statusCode === 502 || statusCode === 503 || statusCode === 504 || (statusCode === 500 && !hasJsonMessage)
        ? 'Server unavailable. Please ensure the backend server and database are running.'
        : error.message || 'An unexpected error occurred.';

    const requestUrl = error.config?.url ?? '';
    const isAuthProbe =
      requestUrl.includes('/auth/me') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    if (statusCode === 401 && !isAuthProbe) {
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    return Promise.reject(
      new ApiClientError(message, statusCode, responseData?.errors, isNetworkError)
    );
  }
);

/* -------------------- Auth API -------------------- */

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (data.data?.token) setAuthToken(data.data.token);
    return data;
  },

  async register(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    if (data.data?.token) setAuthToken(data.data.token);
    return data;
  },

  async logout(): Promise<ApiResponse<null>> {
    try {
      const { data } = await api.post<ApiResponse<null>>('/auth/logout');
      return data;
    } finally {
      setAuthToken(null);
    }
  },

  async getMe(): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User | { user: User }>>('/auth/me');
    const resolvedUser =
      data.data && typeof data.data === 'object' && 'user' in data.data
        ? data.data.user
        : (data.data as User);
    return { ...data, data: resolvedUser };
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<User>> {
    const { data } = await api.put<ApiResponse<User | { user: User }>>('/auth/update-profile', payload);
    const resolvedUser =
      data.data && typeof data.data === 'object' && 'user' in data.data
        ? data.data.user
        : (data.data as User);
    return { ...data, data: resolvedUser };
  },

  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<null>> {
    const { data } = await api.put<ApiResponse<null>>('/auth/change-password', payload);
    return data;
  },
};

/* -------------------- Curriculum & Notes API -------------------- */

export const curriculumApi = {
  async getModules(): Promise<ApiResponse<Module[]>> {
    const { data } = await api.get<ApiResponse<Module[]>>('/modules');
    return data;
  },

  async getModuleBySlug(slug: string): Promise<ApiResponse<Module>> {
    const { data } = await api.get<ApiResponse<Module>>(`/modules/${encodeURIComponent(slug)}`);
    return data;
  },

  async getTopics(moduleSlug?: string): Promise<ApiResponse<Topic[]>> {
    const { data } = await api.get<ApiResponse<Topic[]>>('/topics', {
      params: moduleSlug ? { module: moduleSlug } : undefined,
    });
    return data;
  },

  async getTopicBySlug(slug: string): Promise<ApiResponse<Topic>> {
    const { data } = await api.get<ApiResponse<Topic>>(`/topics/${encodeURIComponent(slug)}`);
    return data;
  },

  async completeTopic(topicId: string): Promise<ApiResponse<UserProgress>> {
    const { data } = await api.post<ApiResponse<UserProgress>>(
      `/topics/${encodeURIComponent(topicId)}/complete`
    );
    return data;
  },

  async updateTopicProgress(
    topicId: string,
    payload: {
      isCompleted?: boolean;
      selfReportedExternal?: { codechef?: boolean; leetcode?: boolean };
    }
  ): Promise<ApiResponse<{ progress?: UserProgress; topic?: Topic; isCompleted?: boolean; selfReportedExternal?: { codechef?: boolean; leetcode?: boolean } }>> {
    const { data } = await api.put(
      `/topics/${encodeURIComponent(topicId)}/progress`,
      payload
    );
    return data;
  },

  async getNotesByTopicId(topicId: string): Promise<ApiResponse<Note>> {
    const { data } = await api.get<ApiResponse<Note>>(
      `/notes/topic/${encodeURIComponent(topicId)}`
    );
    return data;
  },

  async getNotesByTopicSlug(topicSlug: string): Promise<ApiResponse<Note>> {
    const { data } = await api.get<ApiResponse<Note>>(
      `/notes/${encodeURIComponent(topicSlug)}`
    );
    return data;
  },

  async markNoteRead(noteId: string): Promise<ApiResponse<UserProgress>> {
    const { data } = await api.post<ApiResponse<UserProgress>>(
      `/notes/${encodeURIComponent(noteId)}/read`
    );
    return data;
  },
};

/* -------------------- Problems, Execution & Submissions API -------------------- */

export const problemsApi = {
  async getProblems(
    params?: ProblemFilterParams
  ): Promise<ApiResponse<PaginatedResponse<Problem>>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Problem>>>('/problems', {
      params,
    });
    return data;
  },

  async getProblemBySlug(slug: string): Promise<ApiResponse<Problem>> {
    const { data } = await api.get<ApiResponse<Problem>>(`/problems/${encodeURIComponent(slug)}`);
    return data;
  },

  async getTags(): Promise<ApiResponse<string[]>> {
    const { data } = await api.get<ApiResponse<string[]>>('/problems/tags');
    return data;
  },

  async runCode(payload: CodeRunPayload): Promise<ApiResponse<CodeRunResponse>> {
    const { data } = await api.post<ApiResponse<CodeRunResponse>>('/submissions/run', payload);
    return data;
  },

  async submitCode(payload: {
    problemId: string;
    language: ProgrammingLanguage | string;
    code: string;
  }): Promise<ApiResponse<Submission>> {
    const { data } = await api.post<ApiResponse<Submission>>('/submissions', payload);
    return data;
  },

  async getSubmissions(params?: {
    problemId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Submission>>>('/submissions', {
      params,
    });
    return data;
  },

  async getSubmissionById(id: string): Promise<ApiResponse<Submission>> {
    const { data } = await api.get<ApiResponse<Submission>>(
      `/submissions/${encodeURIComponent(id)}`
    );
    return data;
  },

  async getDraft(
    problemId: string,
    language: ProgrammingLanguage | string
  ): Promise<ApiResponse<CodeDraft | null>> {
    const { data } = await api.get<ApiResponse<CodeDraft | null>>(
      `/drafts/${encodeURIComponent(problemId)}`,
      { params: { language } }
    );
    return data;
  },

  async saveDraft(payload: {
    problemId: string;
    language: ProgrammingLanguage | string;
    code: string;
  }): Promise<ApiResponse<CodeDraft>> {
    const { data } = await api.put<ApiResponse<CodeDraft>>(
      `/drafts/${encodeURIComponent(payload.problemId)}`,
      { language: payload.language, code: payload.code }
    );
    return data;
  },
};

/* -------------------- Daily Challenge API -------------------- */

export const dailyChallengeApi = {
  async getTodayChallenge(): Promise<ApiResponse<DailyChallenge & { challenge?: DailyChallenge; streak?: number; currentStreak?: number; longestStreak?: number }>> {
    const { data } = await api.get<ApiResponse<DailyChallenge & { challenge?: DailyChallenge; streak?: number; currentStreak?: number; longestStreak?: number }>>(
      '/daily-challenges/today'
    );
    return data;
  },

  async getChallengeHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<DailyChallenge> | DailyChallenge[]>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<DailyChallenge> | DailyChallenge[]>>(
      '/daily-challenges/history',
      { params }
    );
    return data;
  },
};

/* -------------------- Revision (Spaced Repetition) API -------------------- */

export const revisionApi = {
  async getRevisions(params?: {
    dueOnly?: boolean;
    filter?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Revision> | Revision[]>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Revision> | Revision[]>>(
      '/revisions',
      {
        params,
      }
    );
    return data;
  },

  async getDueRevisions(): Promise<ApiResponse<Revision[]>> {
    const { data } = await api.get<ApiResponse<Revision[]>>('/revisions/due');
    return data;
  },

  async addToRevision(payload: {
    problemId?: string;
    problem?: string;
    topicId?: string;
    isManual?: boolean;
    markedDifficult?: boolean;
    notes?: string;
  }): Promise<ApiResponse<Revision>> {
    const { data } = await api.post<ApiResponse<Revision>>('/revisions', payload);
    return data;
  },

  async reviewRevision(
    revisionId: string,
    payload: { rating: RevisionRating; notes?: string }
  ): Promise<ApiResponse<Revision>> {
    const { data } = await api.post<ApiResponse<Revision>>(
      `/revisions/${encodeURIComponent(revisionId)}/review`,
      payload
    );
    return data;
  },

  async completeRevision(revisionId: string): Promise<ApiResponse<Revision>> {
    const encoded = encodeURIComponent(revisionId);
    try {
      const { data } = await api.put<ApiResponse<Revision>>(`/revisions/${encoded}/complete`);
      return data;
    } catch (err) {
      if (err instanceof ApiClientError && (err.statusCode === 404 || err.statusCode === 501)) {
        try {
          const { data } = await api.patch<ApiResponse<Revision>>(`/revisions/${encoded}`, {
            revisionStatus: 'completed',
          });
          return data;
        } catch (patchErr) {
          if (
            patchErr instanceof ApiClientError &&
            (patchErr.statusCode === 404 || patchErr.statusCode === 501)
          ) {
            const { data } = await api.post<ApiResponse<Revision>>(
              `/revisions/${encoded}/review`,
              { rating: 'good' }
            );
            return data;
          }
          throw patchErr;
        }
      }
      throw err;
    }
  },

  async rescheduleRevision(
    revisionId: string,
    payload: { days?: number; nextRevisionDate?: string }
  ): Promise<ApiResponse<Revision>> {
    const encoded = encodeURIComponent(revisionId);
    try {
      const { data } = await api.put<ApiResponse<Revision>>(
        `/revisions/${encoded}/reschedule`,
        payload
      );
      return data;
    } catch (err) {
      if (err instanceof ApiClientError && (err.statusCode === 404 || err.statusCode === 501)) {
        try {
          const { data } = await api.patch<ApiResponse<Revision>>(`/revisions/${encoded}`, {
            nextRevisionDate: payload.nextRevisionDate,
            days: payload.days,
            revisionStatus: 'pending',
          });
          return data;
        } catch (patchErr) {
          if (
            patchErr instanceof ApiClientError &&
            (patchErr.statusCode === 404 || patchErr.statusCode === 501)
          ) {
            const rating: RevisionRating =
              payload.days !== undefined && payload.days <= 1
                ? 'again'
                : payload.days !== undefined && payload.days <= 3
                  ? 'hard'
                  : payload.days !== undefined && payload.days >= 14
                    ? 'easy'
                    : 'good';
            const { data } = await api.post<ApiResponse<Revision>>(
              `/revisions/${encoded}/review`,
              { rating }
            );
            return data;
          }
          throw patchErr;
        }
      }
      throw err;
    }
  },

  async removeRevision(revisionId: string): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(
      `/revisions/${encodeURIComponent(revisionId)}`
    );
    return data;
  },
};

/* -------------------- Bookmarks API -------------------- */

export const bookmarksApi = {
  async getBookmarks(params?: {
    itemType?: BookmarkItemType;
    targetType?: BookmarkItemType;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Bookmark> | Bookmark[]>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Bookmark> | Bookmark[]>>(
      '/bookmarks',
      {
        params,
      }
    );
    return data;
  },

  async toggleBookmark(payload: {
    itemType: BookmarkItemType;
    itemId: string;
    targetType?: BookmarkItemType;
    targetId?: string;
    notes?: string;
  }): Promise<ApiResponse<{ bookmarked: boolean; bookmark?: Bookmark }>> {
    const { data } = await api.post<ApiResponse<{ bookmarked: boolean; bookmark?: Bookmark }>>(
      '/bookmarks/toggle',
      {
        ...payload,
        targetType: payload.targetType ?? payload.itemType,
        targetId: payload.targetId ?? payload.itemId,
      }
    );
    return data;
  },

  async updateBookmark(
    bookmarkId: string,
    payload: { notes?: string; tags?: string[] }
  ): Promise<ApiResponse<Bookmark>> {
    const { data } = await api.put<ApiResponse<Bookmark>>(
      `/bookmarks/${encodeURIComponent(bookmarkId)}`,
      payload
    );
    return data;
  },

  async removeBookmark(bookmarkId: string): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(
      `/bookmarks/${encodeURIComponent(bookmarkId)}`
    );
    return data;
  },
};

/* -------------------- Progress, Analytics & Leaderboard API -------------------- */

export const progressApi = {
  async getDashboard(): Promise<ApiResponse<Record<string, unknown>>> {
    const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/progress/dashboard');
    return data;
  },

  async getUserProgress(): Promise<ApiResponse<UserProgress>> {
    const { data } = await api.get<ApiResponse<UserProgress>>('/progress');
    return data;
  },

  async getPerformanceStats(): Promise<ApiResponse<PerformanceStats>> {
    const { data } = await api.get<ApiResponse<PerformanceStats>>('/progress/performance');
    return data;
  },

  async getAchievements(): Promise<ApiResponse<Achievement[]>> {
    const { data } = await api.get<ApiResponse<Achievement[]>>('/progress/achievements');
    return data;
  },

  async getLeaderboard(params?: {
    timeframe?: 'weekly' | 'monthly' | 'all';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<LeaderboardEntry>>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<LeaderboardEntry>>>(
      '/leaderboard',
      { params }
    );
    return data;
  },
};

/* -------------------- Admin API -------------------- */

export const adminApi = {
  async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    const { data } = await api.get<ApiResponse<AdminDashboardStats>>('/admin/stats');
    return data;
  },

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<User>>>('/admin/users', {
      params,
    });
    return data;
  },

  async updateUser(
    userId: string,
    payload: { role?: UserRole; isActive?: boolean }
  ): Promise<ApiResponse<User>> {
    const { data } = await api.patch<ApiResponse<User>>(
      `/admin/users/${encodeURIComponent(userId)}`,
      payload
    );
    return data;
  },

  async createModule(payload: Partial<Module>): Promise<ApiResponse<Module>> {
    const { data } = await api.post<ApiResponse<Module>>('/admin/modules', payload);
    return data;
  },

  async updateModule(id: string, payload: Partial<Module>): Promise<ApiResponse<Module>> {
    const { data } = await api.put<ApiResponse<Module>>(
      `/admin/modules/${encodeURIComponent(id)}`,
      payload
    );
    return data;
  },

  async deleteModule(id: string): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(
      `/admin/modules/${encodeURIComponent(id)}`
    );
    return data;
  },

  async reorderModules(orderedIds: string[]): Promise<ApiResponse<Module[]>> {
    const { data } = await api.put<ApiResponse<Module[]>>('/admin/modules/reorder', {
      orderedIds,
    });
    return data;
  },

  async createTopic(payload: Partial<Topic>): Promise<ApiResponse<Topic>> {
    const { data } = await api.post<ApiResponse<Topic>>('/admin/topics', payload);
    return data;
  },

  async updateTopic(id: string, payload: Partial<Topic>): Promise<ApiResponse<Topic>> {
    const { data } = await api.put<ApiResponse<Topic>>(
      `/admin/topics/${encodeURIComponent(id)}`,
      payload
    );
    return data;
  },

  async deleteTopic(id: string): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(
      `/admin/topics/${encodeURIComponent(id)}`
    );
    return data;
  },

  async reorderTopics(moduleId: string, orderedIds: string[]): Promise<ApiResponse<Topic[]>> {
    const { data } = await api.put<ApiResponse<Topic[]>>('/admin/topics/reorder', {
      moduleId,
      orderedIds,
    });
    return data;
  },

  async getAllNotes(): Promise<ApiResponse<Note[]>> {
    const { data } = await api.get<ApiResponse<Note[]>>('/admin/notes');
    return data;
  },

  async getNoteByTopicId(topicId: string): Promise<ApiResponse<Note | null>> {
    const { data } = await api.get<ApiResponse<Note | null>>(
      `/admin/notes/${encodeURIComponent(topicId)}`
    );
    return data;
  },

  async upsertNote(payload: Partial<Note> & { topicId: string }): Promise<ApiResponse<Note>> {
    const { data } = await api.put<ApiResponse<Note>>(
      `/admin/notes/${encodeURIComponent(payload.topicId)}`,
      payload
    );
    return data;
  },

  async getProblems(
    params?: ProblemFilterParams & { isPublished?: boolean | string }
  ): Promise<ApiResponse<PaginatedResponse<Problem>>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Problem>>>('/admin/problems', {
      params,
    });
    return data;
  },

  async getProblemById(id: string): Promise<ApiResponse<Problem>> {
    const { data } = await api.get<ApiResponse<Problem>>(
      `/admin/problems/${encodeURIComponent(id)}`
    );
    return data;
  },

  async createProblem(payload: Partial<Problem>): Promise<ApiResponse<Problem>> {
    const { data } = await api.post<ApiResponse<Problem>>('/admin/problems', payload);
    return data;
  },

  async updateProblem(id: string, payload: Partial<Problem>): Promise<ApiResponse<Problem>> {
    const { data } = await api.put<ApiResponse<Problem>>(
      `/admin/problems/${encodeURIComponent(id)}`,
      payload
    );
    return data;
  },

  async archiveProblem(id: string, isPublished = false): Promise<ApiResponse<Problem>> {
    const { data } = await api.patch<ApiResponse<Problem>>(
      `/admin/problems/${encodeURIComponent(id)}/archive`,
      { isPublished }
    );
    return data;
  },

  async validateProblem(
    payload: ProblemValidationPayload
  ): Promise<ApiResponse<ProblemValidationResult>> {
    const { data } = await api.post<ApiResponse<ProblemValidationResult>>(
      '/admin/problems/validate',
      payload
    );
    return data;
  },

  async deleteProblem(id: string): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(
      `/admin/problems/${encodeURIComponent(id)}`
    );
    return data;
  },

  async getReports(params?: {
    range?: '7d' | '30d' | '90d' | 'all';
  }): Promise<ApiResponse<AdminReportsData>> {
    const { data } = await api.get<ApiResponse<AdminReportsData>>('/admin/reports', { params });
    return data;
  },

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    targetType?: string;
    action?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<AdminAuditLog>>> {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AdminAuditLog>>>(
      '/admin/audit-logs',
      { params }
    );
    return data;
  },

  async setDailyChallenge(payload: {
    date: string;
    problemId: string;
    xpBonus?: number;
  }): Promise<ApiResponse<DailyChallenge>> {
    const { data } = await api.post<ApiResponse<DailyChallenge>>(
      '/admin/daily-challenge',
      payload
    );
    return data;
  },
};

export default api;
