import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import type { Difficulty, ProgrammingLanguage, SubmissionStatus } from '@/types';

/**
 * Combine conditional class names cleanly.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Parse a Date, timestamp, or ISO string safely.
 */
function toValidDate(date: string | number | Date | null | undefined): Date | null {
  if (date === null || date === undefined || date === '') return null;
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  if (typeof date === 'number') {
    const parsed = new Date(date);
    return isValid(parsed) ? parsed : null;
  }
  const isoParsed = parseISO(date);
  if (isValid(isoParsed)) return isoParsed;
  const fallback = new Date(date);
  return isValid(fallback) ? fallback : null;
}

/**
 * Format a date string or Date object using date-fns.
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  pattern = 'MMM d, yyyy'
): string {
  const parsed = toValidDate(date);
  if (!parsed) return '—';
  return format(parsed, pattern);
}

/**
 * Format a date as a human-friendly relative time string (e.g., "3 hours ago").
 */
export function formatRelativeTime(date: string | number | Date | null | undefined): string {
  const parsed = toValidDate(date);
  if (!parsed) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Format a duration in milliseconds, seconds, or minutes into a compact readable string.
 */
export function formatDuration(
  value: number | null | undefined,
  unit: 'ms' | 's' | 'm' = 's'
): string {
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) {
    return '—';
  }

  if (unit === 'ms') {
    if (value < 1000) return `${Math.round(value)} ms`;
    const seconds = value / 1000;
    return seconds < 60 ? `${seconds.toFixed(2)} s` : formatDuration(seconds, 's');
  }

  const totalSeconds = unit === 'm' ? Math.round(value * 60) : Math.round(value);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/**
 * Truncate a string to maxLength, appending a suffix if truncated.
 */
export function truncateText(text: string | null | undefined, maxLength = 100, suffix = '...'): string {
  if (!text) return '';
  if (maxLength <= 0) return '';
  if (text.length <= maxLength) return text;
  const sliceLength = Math.max(0, maxLength - suffix.length);
  return `${text.slice(0, sliceLength).trimEnd()}${suffix}`;
}

/**
 * Extract up to two uppercase initials from a full name or username.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Format large numbers compactly (e.g., 1450 -> "1.5k").
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return value.toLocaleString();
}

/**
 * Compute acceptance percentage from accepted/total submission counts.
 */
export function calculateAcceptanceRate(accepted = 0, total = 0): number {
  if (!total || total <= 0) return 0;
  return Math.round((accepted / total) * 1000) / 10;
}

/**
 * Convert arbitrary text to a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Map a programming language key to its display label.
 */
export function getLanguageLabel(language: ProgrammingLanguage | string): string {
  const labels: Record<string, string> = {
    c: 'C',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python 3',
    cpp: 'C++ (GCC)',
    java: 'Java',
    go: 'Go',
  };
  return labels[language.toLowerCase()] ?? language;
}

/**
 * Map a problem difficulty to Tailwind text/bg/border classes.
 */
export function getDifficultyColorClass(difficulty: Difficulty | string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'text-easy bg-easy/10 border-easy/30';
    case 'medium':
      return 'text-medium bg-medium/10 border-medium/30';
    case 'hard':
      return 'text-hard bg-hard/10 border-hard/30';
    default:
      return 'text-text-muted bg-slate-500/10 border-slate-500/30';
  }
}

/**
 * Map a submission status to semantic Tailwind classes.
 */
export function getStatusColorClass(status: SubmissionStatus | string): string {
  switch (status) {
    case 'Accepted':
      return 'text-easy bg-easy/10 border-easy/30';
    case 'Time Limit Exceeded':
    case 'Memory Limit Exceeded':
      return 'text-medium bg-medium/10 border-medium/30';
    case 'Wrong Answer':
    case 'Runtime Error':
    case 'Compilation Error':
      return 'text-hard bg-hard/10 border-hard/30';
    default:
      return 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/30';
  }
}

/**
 * Copy text to clipboard safely, returning true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely without throwing.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
