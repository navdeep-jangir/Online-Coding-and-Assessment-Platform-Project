export const XP_VALUES = Object.freeze({
  easy: 10,
  medium: 25,
  hard: 50,
  dailyChallenge: 20,
});

export const DIFFICULTIES = Object.freeze(['Easy', 'Medium', 'Hard']);

export const LANGUAGES = Object.freeze({
  c: { id: 'c', name: 'C', monacoId: 'c' },
  cpp: { id: 'cpp', name: 'C++', monacoId: 'cpp' },
  java: { id: 'java', name: 'Java', monacoId: 'java' },
  python: { id: 'python', name: 'Python', monacoId: 'python' },
});

export const LANGUAGE_KEYS = Object.freeze(Object.keys(LANGUAGES));

export const JUDGE0_LANGUAGE_IDS = Object.freeze({
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
});

export const VERDICTS = Object.freeze({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  COMPILATION_ERROR: 'Compilation Error',
  RUNTIME_ERROR: 'Runtime Error',
  INTERNAL_ERROR: 'Internal Error',
});

export const VERDICT_VALUES = Object.freeze(Object.values(VERDICTS));

export const REVISION_SCHEDULE = Object.freeze([1, 3, 7, 14]);

export const TIMEZONE = 'Asia/Kolkata';

export const ROLES = Object.freeze({
  STUDENT: 'student',
  ADMIN: 'admin',
});

export const CONCEPT_TYPES = Object.freeze(['theory', 'problem', 'both']);

export const BOOKMARK_TARGETS = Object.freeze(['problem', 'topic', 'note']);

export const REVISION_STATUSES = Object.freeze(['pending', 'due', 'completed']);

export const XP_SOURCES = Object.freeze(['problem', 'daily_challenge', 'achievement']);

export const COOKIE_NAME = 'token';

export default {
  XP_VALUES,
  DIFFICULTIES,
  LANGUAGES,
  LANGUAGE_KEYS,
  JUDGE0_LANGUAGE_IDS,
  VERDICTS,
  VERDICT_VALUES,
  REVISION_SCHEDULE,
  TIMEZONE,
  ROLES,
  CONCEPT_TYPES,
  BOOKMARK_TARGETS,
  REVISION_STATUSES,
  XP_SOURCES,
  COOKIE_NAME,
};
