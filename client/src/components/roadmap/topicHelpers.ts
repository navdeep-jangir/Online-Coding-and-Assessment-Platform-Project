import type { Topic } from '@/types';

export function resolveTopicProblemSlug(topic: Topic): string | undefined {
  if (topic.problemSlug && topic.problemSlug.trim()) {
    return topic.problemSlug.trim();
  }
  if (topic.problem && typeof topic.problem === 'object' && topic.problem.slug) {
    return topic.problem.slug;
  }
  return undefined;
}

export function resolveTopicProblemId(topic: Topic): string | undefined {
  if (topic.problemId && topic.problemId.trim()) {
    return topic.problemId.trim();
  }
  if (topic.problem) {
    if (typeof topic.problem === 'string' && topic.problem.trim()) {
      return topic.problem.trim();
    }
    if (typeof topic.problem === 'object' && topic.problem._id) {
      return topic.problem._id;
    }
  }
  return undefined;
}

export function isTopicVerified(topic: Topic): boolean {
  return Boolean(
    topic.isVerified ||
      topic.codeclimbVerified ||
      topic.verifiedOnCodeClimb ||
      (typeof topic.solvedProblemCount === 'number' && topic.solvedProblemCount > 0)
  );
}

export function isTopicSelfReportedExternal(topic: Topic): boolean {
  return Boolean(
    topic.selfReportedExternal?.codechef || topic.selfReportedExternal?.leetcode
  );
}

export function isTopicCompleted(topic: Topic): boolean {
  return Boolean(
    topic.isCompleted ||
      topic.status === 'completed' ||
      isTopicVerified(topic)
  );
}
