import axios from 'axios';
import ApiError from '../utils/ApiError.js';
import { JUDGE0_LANGUAGE_IDS, LANGUAGE_KEYS, VERDICTS } from '../config/constants.js';

const LANGUAGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_POLL_INTERVAL_MS = 400;
const DEFAULT_MAX_POLL_ATTEMPTS = 60; // ~24 seconds
const MAX_BATCH_SIZE = 20;

const LANGUAGE_ALIASES = Object.freeze({
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
  python: 'python',
  python3: 'python',
  py: 'python',
});

let languageCache = null; // { languages, mapping, fetchedAt }

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createUnavailableError = (message = 'Code execution service is currently unavailable. Please try again later.') => {
  const err = new ApiError(503, message);
  err.code = 'JUDGE0_UNAVAILABLE';
  return err;
};

/**
 * Resolve Judge0 API base URL, authentication mode (direct vs RapidAPI), and headers.
 */
export const getJudge0Config = () => {
  const rawUrl = (process.env.JUDGE0_API_URL || '').trim().replace(/\/+$/, '');
  const apiKey = (process.env.JUDGE0_API_KEY || '').trim();
  const explicitHost = (process.env.JUDGE0_API_HOST || '').trim();

  if (!rawUrl) {
    return {
      configured: false,
      baseUrl: '',
      isRapidApi: false,
      headers: { 'Content-Type': 'application/json' },
    };
  }

  let parsedHost = '';
  try {
    parsedHost = new URL(rawUrl).host;
  } catch {
    parsedHost = '';
  }

  const isRapidApi = Boolean(explicitHost) || parsedHost.toLowerCase().includes('rapidapi.com');
  const headers = { 'Content-Type': 'application/json' };

  if (isRapidApi) {
    if (apiKey) headers['X-RapidAPI-Key'] = apiKey;
    headers['X-RapidAPI-Host'] = explicitHost || parsedHost;
  } else if (apiKey) {
    headers['X-Auth-Token'] = apiKey;
  }

  return {
    configured: true,
    baseUrl: rawUrl,
    isRapidApi,
    headers,
  };
};

const createClient = (timeoutMs = 15000) => {
  const config = getJudge0Config();
  if (!config.configured) {
    throw createUnavailableError('Judge0 API URL is not configured.');
  }

  return axios.create({
    baseURL: config.baseUrl,
    headers: config.headers,
    timeout: timeoutMs,
  });
};

const isUnavailableAxiosError = (err) => {
  if (!err) return false;
  if (err.code === 'JUDGE0_UNAVAILABLE') return true;
  if (!err.response) {
    // Network / DNS / connection refused / timeout
    return true;
  }
  const status = err.response.status;
  return status >= 500 || status === 401 || status === 403 || status === 429;
};

const encodeBase64 = (value) => {
  if (value === undefined || value === null) return undefined;
  return Buffer.from(String(value), 'utf8').toString('base64');
};

const decodeMaybeBase64 = (value) => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (!str) return '';

  const trimmed = str.trim();
  // Base64 strings have length divisible by 4 and match base64 alphabet; fallback to raw if invalid
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length % 4 === 0) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      // Verify round-trip so normal plain-text words like "test" aren't corrupted
      if (Buffer.from(decoded, 'utf8').toString('base64') === trimmed) {
        return decoded;
      }
    } catch {
      // Return original string if decoding fails
    }
  }
  return str;
};

const normalizeLanguageKey = (lang) => {
  if (!lang || typeof lang !== 'string') {
    throw new ApiError(400, 'Programming language is required.');
  }
  const normalized = LANGUAGE_ALIASES[lang.trim().toLowerCase()];
  if (!normalized || !LANGUAGE_KEYS.includes(normalized)) {
    throw new ApiError(
      400,
      `Unsupported language '${lang}'. Supported languages: ${LANGUAGE_KEYS.join(', ')}`
    );
  }
  return normalized;
};

/**
 * Normalize time limit into seconds for Judge0's `cpu_time_limit`.
 * Values >= 100 are treated as milliseconds (e.g., Problem.timeLimit default 2000ms -> 2s).
 */
const normalizeTimeLimitSeconds = (timeLimit) => {
  if (timeLimit === undefined || timeLimit === null) return 2;
  const num = Number(timeLimit);
  if (!Number.isFinite(num) || num <= 0) return 2;
  const seconds = num >= 100 ? num / 1000 : num;
  return Math.min(20, Math.max(0.1, Number(seconds.toFixed(2))));
};

const normalizeMemoryLimitKB = (memoryLimit) => {
  if (memoryLimit === undefined || memoryLimit === null) return 262144;
  const num = Number(memoryLimit);
  if (!Number.isFinite(num) || num <= 0) return 262144;
  return Math.min(524288, Math.max(2048, Math.round(num)));
};

/**
 * Ensure Java submissions compile and run cleanly in Judge0 (`Main.java`).
 * Handles:
 *  - `public class Main` (preserved)
 *  - `public class Solution` / other public class (converted to package-private + `public class Main` entry)
 *  - `class Main` (promoted to `public class Main`)
 *  - Bare methods or code snippets without a class wrapper
 */
export const wrapJavaCode = (rawCode) => {
  if (typeof rawCode !== 'string') return '';

  // Judge0 compiles in the default package; package declarations break Main.java lookup
  const cleaned = rawCode.replace(/^\s*package\s+[\w.]+\s*;\s*/gm, '').trim();
  if (!cleaned) return '';

  if (/\bpublic\s+class\s+Main\b/.test(cleaned)) {
    return cleaned;
  }

  const publicClassMatch = /\bpublic\s+class\s+([A-Za-z_$][\w$]*)\b/.exec(cleaned);
  if (publicClassMatch) {
    const className = publicClassMatch[1];
    const withoutPublic = cleaned.replace(
      new RegExp(`\\bpublic\\s+class\\s+${className}\\b`),
      `class ${className}`
    );
    if (/\bclass\s+Main\b/.test(withoutPublic)) {
      return withoutPublic.replace(/\bclass\s+Main\b/, 'public class Main');
    }
    const hasMainMethod = /\bstatic\s+void\s+main\s*\(/.test(withoutPublic);
    const entryBody = hasMainMethod
      ? `    ${className}.main(args);`
      : `    // Entry point added automatically for Judge0 Main.java`;
    return `${withoutPublic}\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n${entryBody}\n  }\n}`;
  }

  if (/\bclass\s+Main\b/.test(cleaned)) {
    return cleaned.replace(/\bclass\s+Main\b/, 'public class Main');
  }

  const anyClassMatch = /\bclass\s+([A-Za-z_$][\w$]*)\b/.exec(cleaned);
  if (anyClassMatch) {
    const className = anyClassMatch[1];
    const hasMainMethod = /\bstatic\s+void\s+main\s*\(/.test(cleaned);
    const entryBody = hasMainMethod
      ? `    ${className}.main(args);`
      : `    // Entry point added automatically for Judge0 Main.java`;
    return `${cleaned}\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n${entryBody}\n  }\n}`;
  }

  // No class declaration found: separate top-level imports and wrap snippet inside Main
  const importLines = [];
  const bodyLines = [];
  for (const line of cleaned.split('\n')) {
    if (/^\s*import\s+[\w.*]+\s*;\s*$/.test(line)) {
      importLines.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  const importsBlock = importLines.length > 0 ? `${importLines.join('\n')}\n\n` : '';
  const body = bodyLines.join('\n').trim();
  const hasMainMethod = /\bstatic\s+void\s+main\s*\(/.test(body);

  if (hasMainMethod) {
    return `${importsBlock}public class Main {\n${body}\n}`;
  }

  return `${importsBlock}public class Main {\n  public static void main(String[] args) throws Exception {\n${body}\n  }\n}`;
};

const prepareSourceCode = (code, normalizedLanguage) => {
  if (typeof code !== 'string' || !code.trim()) {
    throw new ApiError(400, 'Source code cannot be empty.');
  }
  return normalizedLanguage === 'java' ? wrapJavaCode(code) : code;
};

/**
 * Derive dynamic Judge0 language ID mapping from Judge0 `/languages` payload.
 */
const buildLanguageMapping = (languages = []) => {
  const mapping = { ...JUDGE0_LANGUAGE_IDS };
  if (!Array.isArray(languages) || languages.length === 0) {
    return mapping;
  }

  const pickHighestId = (predicate) => {
    const matches = languages.filter((item) => item && typeof item.name === 'string' && predicate(item.name));
    if (matches.length === 0) return null;
    matches.sort((a, b) => Number(b.id) - Number(a.id));
    return Number(matches[0].id);
  };

  const cId =
    pickHighestId((name) => /^C\s*\(GCC/i.test(name)) ??
    pickHighestId((name) => /^C\s*\(/i.test(name));
  const cppId =
    pickHighestId((name) => /^C\+\+\s*\(GCC/i.test(name)) ??
    pickHighestId((name) => /^C\+\+\s*\(/i.test(name));
  const javaId =
    pickHighestId((name) => /^Java\s*\(OpenJDK/i.test(name)) ??
    pickHighestId((name) => /^Java\s*\(/i.test(name));
  const pythonId =
    pickHighestId((name) => /^Python\s*3/i.test(name)) ??
    pickHighestId((name) => /^Python\s*\(/i.test(name));

  if (cId) mapping.c = cId;
  if (cppId) mapping.cpp = cppId;
  if (javaId) mapping.java = javaId;
  if (pythonId) mapping.python = pythonId;

  return mapping;
};

export const clearLanguageCache = () => {
  languageCache = null;
};

/**
 * Fetch supported languages from Judge0 and cache the dynamic language mapping.
 * Falls back gracefully to cached or default Judge0 CE language IDs if Judge0 is unreachable.
 */
export const getLanguages = async ({ forceRefresh = false } = {}) => {
  const now = Date.now();
  if (!forceRefresh && languageCache && now - languageCache.fetchedAt < LANGUAGE_CACHE_TTL_MS) {
    return {
      languages: languageCache.languages,
      mapping: { ...languageCache.mapping },
      fromCache: true,
      isFallback: false,
      available: true,
    };
  }

  try {
    const client = createClient(8000);
    const response = await client.get('/languages');
    const languages = Array.isArray(response.data) ? response.data : [];
    const mapping = buildLanguageMapping(languages);

    languageCache = {
      languages,
      mapping,
      fetchedAt: now,
    };

    return {
      languages,
      mapping: { ...mapping },
      fromCache: false,
      isFallback: false,
      available: true,
    };
  } catch (err) {
    if (languageCache) {
      return {
        languages: languageCache.languages,
        mapping: { ...languageCache.mapping },
        fromCache: true,
        isFallback: true,
        available: false,
      };
    }

    if (isUnavailableAxiosError(err)) {
      return {
        languages: [],
        mapping: { ...JUDGE0_LANGUAGE_IDS },
        fromCache: false,
        isFallback: true,
        available: false,
      };
    }
    throw err;
  }
};

/**
 * Map 'c', 'cpp', 'java', 'python' to Judge0 language IDs dynamically.
 */
export const mapLanguage = async (lang) => {
  const normalized = normalizeLanguageKey(lang);
  const { mapping } = await getLanguages();
  const id = mapping[normalized] || JUDGE0_LANGUAGE_IDS[normalized];
  if (!id) {
    throw new ApiError(400, `Unable to resolve Judge0 language ID for '${lang}'`);
  }
  return id;
};

/**
 * Map Judge0 status ID and metadata to CodeClimb verdict strings.
 */
export const mapStatusToVerdict = (statusId, statusDescription = '', memoryUsed = 0, memoryLimit = 0) => {
  const id = Number(statusId);
  if (id === 1 || id === 2) return VERDICTS.PENDING;
  if (id === 3) {
    if (memoryLimit > 0 && memoryUsed > memoryLimit) {
      return VERDICTS.MEMORY_LIMIT_EXCEEDED;
    }
    return VERDICTS.ACCEPTED;
  }
  if (id === 4) return VERDICTS.WRONG_ANSWER;
  if (id === 5) return VERDICTS.TIME_LIMIT_EXCEEDED;
  if (id === 6) return VERDICTS.COMPILATION_ERROR;
  if (id >= 7 && id <= 12) {
    const desc = String(statusDescription || '').toLowerCase();
    if (desc.includes('memory') || (memoryLimit > 0 && memoryUsed > memoryLimit)) {
      return VERDICTS.MEMORY_LIMIT_EXCEEDED;
    }
    return VERDICTS.RUNTIME_ERROR;
  }
  if (id === 13 || id === 14) return VERDICTS.INTERNAL_ERROR;
  return VERDICTS.INTERNAL_ERROR;
};

const normalizeSubmissionResult = (raw, memoryLimit = 0) => {
  const statusId = Number(raw?.status?.id ?? raw?.status_id ?? 0);
  const statusDescription = raw?.status?.description || '';
  const stdout = decodeMaybeBase64(raw?.stdout);
  const stderr = decodeMaybeBase64(raw?.stderr);
  const compileOutput = decodeMaybeBase64(raw?.compile_output);
  const message = decodeMaybeBase64(raw?.message);
  const timeSeconds = raw?.time !== undefined && raw?.time !== null ? Number(raw.time) : 0;
  const runtimeMs = Number.isFinite(timeSeconds) ? Math.round(timeSeconds * 1000) : 0;
  const memory = raw?.memory !== undefined && raw?.memory !== null ? Number(raw.memory) : 0;

  return {
    token: raw?.token || null,
    statusId,
    statusDescription,
    verdict: mapStatusToVerdict(statusId, statusDescription, memory, memoryLimit),
    isDone: statusId > 2,
    stdout,
    stderr,
    compileOutput,
    message,
    time: Number.isFinite(timeSeconds) ? timeSeconds : 0,
    runtimeMs,
    memory: Number.isFinite(memory) ? memory : 0,
    exitCode: raw?.exit_code ?? null,
  };
};

const buildSubmissionPayload = async ({
  code,
  language,
  stdin = '',
  expectedOutput = undefined,
  timeLimit = 2,
  memoryLimit = 262144,
}) => {
  const normalizedLang = normalizeLanguageKey(language);
  const languageId = await mapLanguage(normalizedLang);
  const sourceCode = prepareSourceCode(code, normalizedLang);

  const payload = {
    source_code: encodeBase64(sourceCode),
    language_id: languageId,
    stdin: encodeBase64(stdin ?? ''),
    cpu_time_limit: normalizeTimeLimitSeconds(timeLimit),
    memory_limit: normalizeMemoryLimitKB(memoryLimit),
  };

  if (expectedOutput !== undefined && expectedOutput !== null) {
    payload.expected_output = encodeBase64(expectedOutput);
  }

  return payload;
};

/**
 * Submit code to Judge0 and return the submission token (or immediate result if returned).
 */
export const createSubmission = async (
  code,
  language,
  stdin = '',
  expectedOutput = undefined,
  timeLimit = 2,
  memoryLimit = 262144
) => {
  const payload = await buildSubmissionPayload({
    code,
    language,
    stdin,
    expectedOutput,
    timeLimit,
    memoryLimit,
  });

  try {
    const client = createClient(15000);
    const response = await client.post('/submissions?base64_encoded=true&wait=false', payload);
    const data = response.data || {};
    if (data.status && Number(data.status.id) > 2) {
      return normalizeSubmissionResult(data, normalizeMemoryLimitKB(memoryLimit));
    }
    if (!data.token) {
      throw createUnavailableError('Judge0 did not return a submission token.');
    }
    return { token: data.token, isDone: false };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (isUnavailableAxiosError(err)) {
      throw createUnavailableError();
    }
    const status = err.response?.status || 502;
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Judge0 rejected the submission request.';
    throw new ApiError(status >= 500 ? 503 : status, msg);
  }
};

/**
 * Fetch / poll a single Judge0 submission result by token.
 */
export const getSubmission = async (token, memoryLimit = 0) => {
  if (!token) {
    throw new ApiError(400, 'Submission token is required.');
  }

  try {
    const client = createClient(15000);
    const fields = 'token,stdout,stderr,compile_output,message,status,time,memory,exit_code';
    const response = await client.get(
      `/submissions/${encodeURIComponent(token)}?base64_encoded=true&fields=${fields}`
    );
    return normalizeSubmissionResult(response.data, memoryLimit);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (isUnavailableAxiosError(err)) {
      throw createUnavailableError();
    }
    if (err.response?.status === 404) {
      throw new ApiError(404, `Judge0 submission token '${token}' not found.`);
    }
    throw createUnavailableError('Failed to retrieve submission result from Judge0.');
  }
};

/**
 * Submit code to Judge0 and poll until execution completes.
 */
export const executeCode = async (
  code,
  language,
  stdin = '',
  timeLimit = 2,
  memoryLimit = 262144,
  expectedOutput = undefined,
  options = {}
) => {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxPollAttempts = options.maxPollAttempts ?? DEFAULT_MAX_POLL_ATTEMPTS;
  const normalizedMemory = normalizeMemoryLimitKB(memoryLimit);

  const created = await createSubmission(
    code,
    language,
    stdin,
    expectedOutput,
    timeLimit,
    normalizedMemory
  );

  if (created.isDone) {
    return created;
  }

  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    await sleep(pollIntervalMs);
    const result = await getSubmission(created.token, normalizedMemory);
    if (result.isDone) {
      return result;
    }
  }

  const timeoutErr = new ApiError(504, 'Code execution timed out while waiting for Judge0.');
  timeoutErr.code = 'JUDGE0_TIMEOUT';
  throw timeoutErr;
};

/**
 * Submit multiple test cases in batches to Judge0 and poll until all complete.
 * Falls back to individual `executeCode` calls if Judge0 disables `/submissions/batch`.
 */
export const batchSubmit = async (submissions = [], options = {}) => {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return [];
  }

  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxPollAttempts = options.maxPollAttempts ?? DEFAULT_MAX_POLL_ATTEMPTS;
  const results = [];

  for (let i = 0; i < submissions.length; i += MAX_BATCH_SIZE) {
    const chunk = submissions.slice(i, i + MAX_BATCH_SIZE);
    const payloads = await Promise.all(chunk.map((item) => buildSubmissionPayload(item)));
    const memLimits = chunk.map((item) => normalizeMemoryLimitKB(item.memoryLimit));

    let tokens;
    try {
      const client = createClient(20000);
      const submitRes = await client.post('/submissions/batch?base64_encoded=true', {
        submissions: payloads,
      });

      const batchCreated = Array.isArray(submitRes.data)
        ? submitRes.data
        : submitRes.data?.submissions || [];

      if (batchCreated.length !== chunk.length) {
        throw createUnavailableError('Unexpected batch submission response from Judge0.');
      }

      // Some mock/custom setups may return completed statuses inline
      if (batchCreated.every((item) => item?.status && Number(item.status.id) > 2)) {
        batchCreated.forEach((raw, idx) => {
          results.push(normalizeSubmissionResult(raw, memLimits[idx]));
        });
        continue;
      }

      tokens = batchCreated.map((item) => item.token);
      if (tokens.some((t) => !t)) {
        throw createUnavailableError('Missing token in Judge0 batch submission response.');
      }
    } catch (err) {
      // Fallback if batch endpoint is unsupported (404/405/501) on a minimal Judge0 instance
      const httpStatus = err.response?.status;
      if (httpStatus === 404 || httpStatus === 405 || httpStatus === 501) {
        const fallbackChunk = await Promise.all(
          chunk.map((item) =>
            executeCode(
              item.code,
              item.language,
              item.stdin ?? '',
              item.timeLimit,
              item.memoryLimit,
              item.expectedOutput,
              options
            )
          )
        );
        results.push(...fallbackChunk);
        continue;
      }

      if (err instanceof ApiError) throw err;
      if (isUnavailableAxiosError(err)) throw createUnavailableError();
      throw createUnavailableError('Failed to submit batch to Judge0.');
    }

    // Poll batch tokens until every item finishes
    const resolvedMap = new Map();
    const fields = 'token,stdout,stderr,compile_output,message,status,time,memory,exit_code';

    for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
      await sleep(pollIntervalMs);
      const pendingTokens = tokens.filter((t) => !resolvedMap.has(t));
      if (pendingTokens.length === 0) break;

      try {
        const client = createClient(15000);
        const pollRes = await client.get(
          `/submissions/batch?tokens=${pendingTokens.map(encodeURIComponent).join(',')}&base64_encoded=true&fields=${fields}`
        );
        const rawList = Array.isArray(pollRes.data)
          ? pollRes.data
          : pollRes.data?.submissions || [];

        for (let j = 0; j < rawList.length; j += 1) {
          const rawItem = rawList[j];
          const itemToken = rawItem?.token || pendingTokens[j];
          const tokenIndex = tokens.indexOf(itemToken);
          const memLimit = tokenIndex >= 0 ? memLimits[tokenIndex] : 0;
          const normalized = normalizeSubmissionResult(rawItem, memLimit);
          if (normalized.isDone && itemToken) {
            resolvedMap.set(itemToken, normalized);
          }
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
        if (isUnavailableAxiosError(err)) throw createUnavailableError();
        throw createUnavailableError('Failed while polling Judge0 batch results.');
      }

      if (resolvedMap.size === tokens.length) break;
    }

    if (resolvedMap.size !== tokens.length) {
      const timeoutErr = new ApiError(504, 'Batch code execution timed out while waiting for Judge0.');
      timeoutErr.code = 'JUDGE0_TIMEOUT';
      throw timeoutErr;
    }

    for (const token of tokens) {
      results.push(resolvedMap.get(token));
    }
  }

  return results;
};

export default {
  getLanguages,
  mapLanguage,
  createSubmission,
  getSubmission,
  executeCode,
  batchSubmit,
  wrapJavaCode,
  clearLanguageCache,
  mapStatusToVerdict,
  getJudge0Config,
};
