import mongoose from 'mongoose';

/**
 * Recommendation Engine Service for CodeClimb
 *
 * DSA Architecture & Usage:
 * 1. Directed Acyclic Graph (DAG):
 *    Models curriculum modules and topics as vertices V and prerequisite
 *    relationships (prereq -> dependent topic) as directed edges E.
 *    Stored via adjacency list (`Map<string, string[]>`) and in-degree map
 *    (`Map<string, number>`). Space complexity: O(V + E).
 *
 * 2. Topological Sort (Kahn's Algorithm):
 *    Computes a valid curriculum learning order by iteratively dequeuing
 *    nodes whose in-degree (unmet prerequisite count) is 0 and relaxing
 *    outgoing edges. Detects prerequisite cycles when visited count < |V|.
 *    Time complexity: O((V + E) log V) with min-heap tie-breaking.
 *
 * 3. Min-Heap / Priority Queue (`MinPriorityQueue`):
 *    Selects the highest-priority next topic among unlocked candidates (all
 *    prerequisites satisfied) ordered by:
 *      1) Difficulty progression (easy -> medium -> hard)
 *      2) Module / topic order (ascending)
 *      3) Lexicographical title tie-breaker
 *    Heap push/pop operations run in O(log N) time.
 *
 * 4. Hash Map & Hash Set (`Map`, `Set`):
 *    Provides O(1) membership checks for completed topics and solved problems,
 *    and O(S) single-pass submission aggregation for weak-topic detection.
 */

const DIFFICULTY_RANK = Object.freeze({
  beginner: 1,
  easy: 1,
  medium: 2,
  intermediate: 2,
  hard: 3,
  advanced: 3,
});

/**
 * Safely resolve a Mongoose model either from the active registry or by
 * dynamically importing its module file when present.
 */
export async function resolveModel(modelNames, loaders) {
  for (const name of modelNames) {
    if (mongoose.models[name]) {
      return mongoose.models[name];
    }
  }
  for (const loader of loaders) {
    try {
      const mod = await loader();
      for (const name of modelNames) {
        if (mod?.[name]) return mod[name];
      }
      if (mod?.default) return mod.default;
      for (const name of modelNames) {
        if (mongoose.models[name]) return mongoose.models[name];
      }
    } catch {
      // Model file may not exist or may use an alternate model name; try next candidate.
    }
  }
  return null;
}

function normalizeDifficulty(difficulty) {
  if (!difficulty) return 'easy';
  return String(difficulty).trim().toLowerCase();
}

export function getDifficultyRank(difficulty) {
  const key = normalizeDifficulty(difficulty);
  return DIFFICULTY_RANK[key] ?? 2;
}

/**
 * Binary Min-Heap Priority Queue implementation.
 * Used both inside Kahn's topological sort (to break ties by difficulty and
 * curriculum order) and for selecting the best next recommendation.
 */
export class MinPriorityQueue {
  constructor(comparator) {
    this.heap = [];
    this.compare = comparator || ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap[0] ?? null;
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(index) {
    let idx = index;
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      if (this.compare(this.heap[idx], this.heap[parentIdx]) >= 0) {
        break;
      }
      [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
      idx = parentIdx;
    }
  }

  _sinkDown(index) {
    let idx = index;
    const length = this.heap.length;
    while (true) {
      const left = (idx << 1) + 1;
      const right = left + 1;
      let smallest = idx;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === idx) break;

      [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
      idx = smallest;
    }
  }
}

/**
 * Comparator implementing CodeClimb's curriculum recommendation priority:
 * 1. Difficulty progression (easy -> medium -> hard)
 * 2. Module order (ascending)
 * 3. Topic order (ascending)
 * 4. Title (alphabetical tie-breaker)
 */
function compareTopicPriority(a, b) {
  const diffDelta = getDifficultyRank(a.difficulty) - getDifficultyRank(b.difficulty);
  if (diffDelta !== 0) return diffDelta;

  const moduleDelta = (a.moduleOrder ?? 0) - (b.moduleOrder ?? 0);
  if (moduleDelta !== 0) return moduleDelta;

  const orderDelta =
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
  if (orderDelta !== 0) return orderDelta;

  return String(a.title || a.id).localeCompare(String(b.title || b.id));
}

function extractRefId(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (ref._id) return String(ref._id);
  if (ref.id) return String(ref.id);
  return String(ref);
}

/**
 * Load curriculum nodes from MongoDB when no explicit node list is passed.
 * Supports standalone Topic + Module models as well as embedded topics on Module.
 */
async function loadCurriculumNodes() {
  const TopicModel = await resolveModel(['Topic'], [() => import('../models/Topic.js')]);
  const ModuleModel = await resolveModel(
    ['Module', 'CurriculumModule'],
    [() => import('../models/Module.js'), () => import('../models/Curriculum.js')]
  );

  const modules = ModuleModel ? await ModuleModel.find({}).sort({ order: 1 }).lean() : [];
  const moduleMap = new Map();
  modules.forEach((mod, idx) => {
    const id = String(mod._id || mod.id || mod.slug);
    moduleMap.set(id, {
      ...mod,
      _resolvedId: id,
      order: mod.order ?? idx + 1,
    });
  });

  const topics = TopicModel ? await TopicModel.find({}).sort({ order: 1 }).lean() : [];

  if (topics.length > 0) {
    return topics.map((topic, idx) => {
      const modId = extractRefId(topic.module || topic.moduleId);
      const parentModule = modId ? moduleMap.get(modId) : null;
      return {
        ...topic,
        id: String(topic._id || topic.id || topic.slug),
        title: topic.title || topic.name || topic.slug || `Topic ${idx + 1}`,
        slug: topic.slug || null,
        difficulty: normalizeDifficulty(topic.difficulty || parentModule?.difficulty || 'easy'),
        order: topic.order ?? idx + 1,
        moduleId: modId,
        moduleTitle: parentModule?.title || parentModule?.name || null,
        moduleOrder: parentModule?.order ?? topic.moduleOrder ?? 0,
        prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : [],
        modulePrerequisites: Array.isArray(parentModule?.prerequisites)
          ? parentModule.prerequisites
          : [],
        problems: Array.isArray(topic.problems) ? topic.problems : [],
      };
    });
  }

  // Fallback: extract embedded topics from modules, or treat modules themselves as nodes
  const derivedNodes = [];
  modules.forEach((mod, mIdx) => {
    const modId = String(mod._id || mod.id || mod.slug);
    const modOrder = mod.order ?? mIdx + 1;
    if (Array.isArray(mod.topics) && mod.topics.length > 0 && typeof mod.topics[0] === 'object') {
      mod.topics.forEach((topic, tIdx) => {
        derivedNodes.push({
          ...topic,
          id: String(topic._id || topic.id || topic.slug || `${modId}:${tIdx}`),
          title: topic.title || topic.name || topic.slug || `Topic ${tIdx + 1}`,
          slug: topic.slug || null,
          difficulty: normalizeDifficulty(topic.difficulty || mod.difficulty || 'easy'),
          order: topic.order ?? tIdx + 1,
          moduleId: modId,
          moduleTitle: mod.title || mod.name || null,
          moduleOrder: modOrder,
          prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : [],
          modulePrerequisites: Array.isArray(mod.prerequisites) ? mod.prerequisites : [],
          problems: Array.isArray(topic.problems) ? topic.problems : [],
        });
      });
    } else {
      derivedNodes.push({
        ...mod,
        id: modId,
        title: mod.title || mod.name || mod.slug || `Module ${modOrder}`,
        slug: mod.slug || null,
        difficulty: normalizeDifficulty(mod.difficulty || 'easy'),
        order: modOrder,
        moduleId: modId,
        moduleTitle: mod.title || mod.name || null,
        moduleOrder: modOrder,
        prerequisites: Array.isArray(mod.prerequisites) ? mod.prerequisites : [],
        modulePrerequisites: [],
        problems: Array.isArray(mod.problems) ? mod.problems : [],
      });
    }
  });

  return derivedNodes;
}

/**
 * Build a Directed Acyclic Graph (DAG) from module/topic prerequisites.
 *
 * Directed edge semantics:
 *   prerequisite -> dependentTopic
 * Meaning `prerequisite` must be completed before `dependentTopic` is unlocked.
 *
 * @param {Array<Object>|null} inputNodes Optional array of topic/module objects (useful for testing)
 * @returns {Promise<{
 *   nodes: Map<string, Object>,
 *   adjacencyList: Map<string, string[]>,
 *   reverseDependencies: Map<string, string[]>,
 *   inDegree: Map<string, number>,
 *   slugToId: Map<string, string>
 * }>}
 */
export async function buildPrerequisiteGraph(inputNodes = null) {
  const rawNodes = Array.isArray(inputNodes) ? inputNodes : await loadCurriculumNodes();

  const nodes = new Map();
  const adjacencyList = new Map();
  const reverseDependencies = new Map();
  const inDegree = new Map();
  const slugToId = new Map();
  const moduleToTopicIds = new Map();

  rawNodes.forEach((raw, idx) => {
    const id = String(raw._id || raw.id || raw.slug || `node-${idx}`);
    const node = {
      ...raw,
      id,
      title: raw.title || raw.name || raw.slug || id,
      slug: raw.slug || null,
      difficulty: normalizeDifficulty(raw.difficulty || 'easy'),
      order: raw.order ?? idx + 1,
      moduleId: raw.moduleId ? String(raw.moduleId) : null,
      moduleOrder: raw.moduleOrder ?? 0,
      prerequisites: [],
    };
    nodes.set(id, node);
    adjacencyList.set(id, []);
    reverseDependencies.set(id, []);
    inDegree.set(id, 0);

    if (node.slug) {
      slugToId.set(String(node.slug), id);
    }
    if (node.moduleId) {
      if (!moduleToTopicIds.has(node.moduleId)) {
        moduleToTopicIds.set(node.moduleId, []);
      }
      moduleToTopicIds.get(node.moduleId).push(id);
    }
  });

  const addDirectedEdge = (prereqId, targetId) => {
    if (!prereqId || !targetId || prereqId === targetId) return;
    if (!nodes.has(prereqId) || !nodes.has(targetId)) return;

    const dependents = adjacencyList.get(prereqId);
    if (!dependents.includes(targetId)) {
      dependents.push(targetId);
      reverseDependencies.get(targetId).push(prereqId);
      nodes.get(targetId).prerequisites.push(prereqId);
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    }
  };

  rawNodes.forEach((raw, idx) => {
    const targetId = String(raw._id || raw.id || raw.slug || `node-${idx}`);
    const directPrereqs = Array.isArray(raw.prerequisites) ? raw.prerequisites : [];

    for (const prereqRef of directPrereqs) {
      const refStr = extractRefId(prereqRef);
      if (!refStr) continue;
      if (nodes.has(refStr)) {
        addDirectedEdge(refStr, targetId);
      } else if (slugToId.has(refStr)) {
        addDirectedEdge(slugToId.get(refStr), targetId);
      } else if (moduleToTopicIds.has(refStr)) {
        // Prerequisite pointed to a module ID: require all topics in that prerequisite module
        for (const topicId of moduleToTopicIds.get(refStr)) {
          addDirectedEdge(topicId, targetId);
        }
      }
    }

    // If a topic has no explicit topic-level prerequisites but belongs to a module with module-level prerequisites,
    // inherit the prerequisite module's topics to preserve module DAG ordering.
    if (directPrereqs.length === 0 && Array.isArray(raw.modulePrerequisites)) {
      for (const modPrereqRef of raw.modulePrerequisites) {
        const modPrereqId = extractRefId(modPrereqRef);
        const prereqTopics = moduleToTopicIds.get(modPrereqId) || [];
        for (const topicId of prereqTopics) {
          addDirectedEdge(topicId, targetId);
        }
      }
    }
  });

  return {
    nodes,
    adjacencyList,
    reverseDependencies,
    inDegree,
    slugToId,
  };
}

/**
 * Normalize various graph input shapes into adjacencyList, inDegree, and node metadata.
 */
function normalizeGraphInput(graph) {
  if (!graph) {
    return {
      nodes: new Map(),
      adjacencyList: new Map(),
      inDegree: new Map(),
    };
  }

  // Case 1: Rich graph object returned by buildPrerequisiteGraph()
  if (graph.adjacencyList instanceof Map) {
    const nodes = graph.nodes instanceof Map ? graph.nodes : new Map();
    const adjacencyList = new Map();
    const inDegree = new Map();

    for (const [key, neighbors] of graph.adjacencyList.entries()) {
      const k = String(key);
      adjacencyList.set(k, Array.isArray(neighbors) ? neighbors.map(String) : []);
      if (!inDegree.has(k)) inDegree.set(k, 0);
    }

    if (graph.inDegree instanceof Map) {
      for (const [key, deg] of graph.inDegree.entries()) {
        inDegree.set(String(key), deg);
      }
    } else {
      for (const neighbors of adjacencyList.values()) {
        for (const n of neighbors) {
          inDegree.set(n, (inDegree.get(n) || 0) + 1);
        }
      }
    }

    return { nodes, adjacencyList, inDegree };
  }

  // Case 2: Map<string, string[]> or Plain Object { nodeId: [dependentId, ...] }
  const entries = graph instanceof Map ? Array.from(graph.entries()) : Object.entries(graph);
  const adjacencyList = new Map();
  const inDegree = new Map();
  const nodes = new Map();

  for (const [rawKey, rawNeighbors] of entries) {
    const key = String(rawKey);
    const neighbors = Array.isArray(rawNeighbors) ? rawNeighbors.map(String) : [];
    adjacencyList.set(key, neighbors);
    if (!inDegree.has(key)) inDegree.set(key, 0);
    if (!nodes.has(key)) nodes.set(key, { id: key, title: key, difficulty: 'easy', order: 0 });

    for (const n of neighbors) {
      if (!adjacencyList.has(n)) adjacencyList.set(n, []);
      if (!nodes.has(n)) nodes.set(n, { id: n, title: n, difficulty: 'easy', order: 0 });
      inDegree.set(n, (inDegree.get(n) || 0) + 1);
    }
  }

  return { nodes, adjacencyList, inDegree };
}

/**
 * Topological Sort using Kahn's Algorithm + Min-Heap Priority Queue.
 *
 * Algorithm:
 * 1. Initialize a min-priority queue with all vertices having in-degree === 0.
 * 2. Pop the highest-priority vertex (easiest difficulty, lowest curriculum order),
 *    append it to `order`, and decrement in-degrees of all outgoing neighbors.
 * 3. Any neighbor whose in-degree drops to 0 is pushed into the priority queue.
 * 4. If `order.length < totalVertices`, a directed cycle exists in the prerequisite graph.
 *
 * @param {Object|Map} graph Directed graph from buildPrerequisiteGraph() or adjacency list
 * @param {{ allowPartialOnCycle?: boolean }} options
 * @returns {string[]} Topologically ordered array of topic/module IDs
 */
export function topologicalSort(graph, options = {}) {
  const { allowPartialOnCycle = false } = options;
  const { nodes, adjacencyList, inDegree } = normalizeGraphInput(graph);
  const workingInDegree = new Map(inDegree);

  const pq = new MinPriorityQueue((idA, idB) => {
    const nodeA = nodes.get(idA) || { id: idA, title: idA, difficulty: 'easy', order: 0 };
    const nodeB = nodes.get(idB) || { id: idB, title: idB, difficulty: 'easy', order: 0 };
    return compareTopicPriority(nodeA, nodeB);
  });

  for (const [nodeId, deg] of workingInDegree.entries()) {
    if (deg === 0) {
      pq.push(nodeId);
    }
  }

  const order = [];
  while (!pq.isEmpty()) {
    const current = pq.pop();
    order.push(current);

    const dependents = adjacencyList.get(current) || [];
    for (const nextNode of dependents) {
      const updatedDeg = (workingInDegree.get(nextNode) || 0) - 1;
      workingInDegree.set(nextNode, updatedDeg);
      if (updatedDeg === 0) {
        pq.push(nextNode);
      }
    }
  }

  if (order.length !== workingInDegree.size) {
    const cycleNodes = [];
    for (const [nodeId, deg] of workingInDegree.entries()) {
      if (deg > 0) cycleNodes.push(nodeId);
    }

    if (!allowPartialOnCycle) {
      const error = new Error(
        `Cycle detected in prerequisite DAG involving nodes: ${cycleNodes.join(', ')}`
      );
      error.code = 'CYCLE_DETECTED';
      error.cycleNodes = cycleNodes;
      error.partialOrder = order;
      throw error;
    }
  }

  return order;
}

/**
 * Collect completed topic IDs and solved problem IDs for a given user.
 */
async function getUserCompletionState(userId, graph) {
  const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
  const UserProgressModel = await resolveModel(
    ['UserProgress', 'Progress'],
    [() => import('../models/UserProgress.js'), () => import('../models/Progress.js')]
  );
  const SubmissionModel = await resolveModel(
    ['Submission'],
    [() => import('../models/Submission.js')]
  );

  const user = UserModel ? await UserModel.findById(userId).lean() : null;
  if (UserModel && !user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const progressDocs = UserProgressModel
    ? await UserProgressModel.find({
        $or: [{ user: userId }, { userId }],
      })
        .select('topic topicId isCompleted completedTopics solvedProblems')
        .lean()
    : [];

  const completedTopics = new Set();
  const addCompletedTopic = (entry) => {
    if (!entry) return;
    if (typeof entry === 'object' && entry.completed === false) return;
    if (typeof entry === 'object' && entry.isCompleted === false) return;
    const raw =
      typeof entry === 'object'
        ? extractRefId(entry.topic || entry.topicId || entry.module || entry._id || entry.id)
        : String(entry);
    if (!raw) return;

    if (graph.nodes.has(raw)) {
      completedTopics.add(raw);
    } else if (graph.slugToId.has(raw)) {
      completedTopics.add(graph.slugToId.get(raw));
    } else {
      completedTopics.add(raw);
    }
  };

  for (const doc of progressDocs) {
    if (doc.isCompleted && (doc.topic || doc.topicId)) {
      addCompletedTopic(doc.topic || doc.topicId);
    }
    if (Array.isArray(doc.completedTopics)) {
      doc.completedTopics.forEach(addCompletedTopic);
    }
  }

  const sources = [
    user?.completedTopics,
    user?.progress?.completedTopics,
  ];
  for (const list of sources) {
    if (Array.isArray(list)) {
      list.forEach(addCompletedTopic);
    }
  }

  // Collect solved & incorrect problem IDs using Hash Sets for O(1) lookups
  const solvedProblems = new Set();
  const incorrectProblems = new Set();
  if (Array.isArray(user?.solvedProblems)) {
    user.solvedProblems.forEach((p) => {
      const id = extractRefId(p);
      if (id) solvedProblems.add(id);
    });
  }
  for (const doc of progressDocs) {
    if (Array.isArray(doc.solvedProblems)) {
      doc.solvedProblems.forEach((p) => {
        const id = extractRefId(p);
        if (id) solvedProblems.add(id);
      });
    }
  }
  if (SubmissionModel) {
    const allSubs = await SubmissionModel.find({
      $or: [{ user: userId }, { userId }],
    })
      .select('problem problemId verdict status')
      .lean();
    for (const sub of allSubs) {
      const pId = extractRefId(sub.problem || sub.problemId);
      if (!pId) continue;
      const v = sub.verdict || sub.status;
      if (v === 'Accepted') {
        solvedProblems.add(pId);
      } else if (v && v !== 'Internal Error' && v !== 'Pending') {
        incorrectProblems.add(pId);
      }
    }
  }
  for (const pId of solvedProblems) {
    incorrectProblems.delete(pId);
  }

  // Infer topic completion when a topic lists required problems and all are solved
  for (const node of graph.nodes.values()) {
    if (!completedTopics.has(node.id) && Array.isArray(node.problems) && node.problems.length > 0) {
      const allSolved = node.problems.every((p) => solvedProblems.has(extractRefId(p)));
      if (allSolved) {
        completedTopics.add(node.id);
      }
    }
  }

  return {
    completedTopics,
    solvedProblems,
    incorrectProblems,
    preferredLanguage: user?.preferredLanguage || 'python',
    user,
  };
}

/**
 * Pick the best next unsolved problem(s) for a recommended topic, prioritizing
 * previously attempted/incorrect problems first, then easy-first difficulty order.
 */
async function pickRecommendedProblems(
  topicNode,
  solvedProblemsSet,
  incorrectProblemsSet = new Set(),
  preferredLanguage = 'python',
  limit = 4
) {
  const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
  if (!ProblemModel || !topicNode) return [];

  const queryFilters = [];
  if (mongoose.Types.ObjectId.isValid(topicNode.id)) {
    const oid = new mongoose.Types.ObjectId(topicNode.id);
    queryFilters.push({ topics: oid });
  }
  if (queryFilters.length === 0) return [];

  const problems = await ProblemModel.find({
    $or: queryFilters,
    isActive: { $ne: false },
    isArchived: { $ne: true },
  })
    .select('title slug difficulty order xp xpReward topic topics')
    .lean();

  if (!problems.length) return [];

  const unsolved = problems.filter((p) => !solvedProblemsSet.has(String(p._id)));
  const pool = unsolved.length > 0 ? unsolved : problems;

  const pq = new MinPriorityQueue((a, b) => {
    const aRetry = incorrectProblemsSet.has(String(a._id)) ? 0 : 1;
    const bRetry = incorrectProblemsSet.has(String(b._id)) ? 0 : 1;
    if (aRetry !== bRetry) return aRetry - bRetry;
    const diffDelta = getDifficultyRank(a.difficulty) - getDifficultyRank(b.difficulty);
    if (diffDelta !== 0) return diffDelta;
    return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
  });

  for (const problem of pool) {
    pq.push(problem);
  }

  const picked = [];
  while (!pq.isEmpty() && picked.length < limit) {
    const item = pq.pop();
    const idStr = String(item._id);
    picked.push({
      _id: item._id,
      title: item.title,
      slug: item.slug,
      difficulty: item.difficulty || 'Easy',
      xpReward: item.xpReward ?? item.xp ?? 10,
      alreadySolved: solvedProblemsSet.has(idStr),
      needsRetry: incorrectProblemsSet.has(idStr),
      preferredLanguage,
    });
  }

  return picked;
}

/**
 * Get the next personalized topic & problem recommendation for a user.
 *
 * Steps:
 * 1. Build curriculum prerequisite DAG.
 * 2. Compute user's completed topics and solved problems.
 * 3. Find uncompleted topics whose prerequisites are 100% satisfied.
 * 4. Rank candidates via MinPriorityQueue (easy difficulty first, then topic order).
 * 5. Return top recommendation with human-readable explanation and alternatives.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
export async function getNextRecommendation(userId) {
  if (!userId) {
    const err = new Error('User ID is required for recommendations');
    err.statusCode = 400;
    throw err;
  }

  // Step 2: Build prerequisite DAG & learning order
  const graph = await buildPrerequisiteGraph();
  const learningOrder = topologicalSort(graph, { allowPartialOnCycle: true });
  const topoPosition = new Map(learningOrder.map((id, idx) => [id, idx]));

  // Step 1: Get user's completed topics
  const { completedTopics, solvedProblems, incorrectProblems, preferredLanguage } =
    await getUserCompletionState(userId, graph);

  if (graph.nodes.size === 0) {
    return {
      topic: null,
      problem: null,
      completedAll: false,
      reason: 'No curriculum topics are currently configured.',
      alternatives: [],
      learningOrder: [],
      progress: { completedCount: completedTopics.size, totalTopics: 0 },
    };
  }

  // Step 3: Find uncompleted topics whose prerequisites are all met
  const eligibleCandidates = [];
  const allUncompleted = [];

  for (const node of graph.nodes.values()) {
    if (completedTopics.has(node.id)) continue;
    allUncompleted.push(node);

    const prereqs = graph.reverseDependencies.get(node.id) || [];
    const allPrereqsMet = prereqs.every((prereqId) => completedTopics.has(prereqId));
    if (allPrereqsMet) {
      eligibleCandidates.push(node);
    }
  }

  if (allUncompleted.length === 0) {
    return {
      topic: null,
      problem: null,
      completedAll: true,
      reason: 'Congratulations! You have completed every topic in the curriculum.',
      alternatives: [],
      learningOrder,
      progress: {
        completedCount: graph.nodes.size,
        totalTopics: graph.nodes.size,
      },
    };
  }

  // Step 4: Rank eligible candidates using Min-Heap Priority Queue
  // (difficulty progression: easy first, then module/topic order, then topological rank)
  const candidatePool = eligibleCandidates.length > 0 ? eligibleCandidates : allUncompleted;
  const pq = new MinPriorityQueue((a, b) => {
    const cmp = compareTopicPriority(a, b);
    if (cmp !== 0) return cmp;
    return (topoPosition.get(a.id) ?? 0) - (topoPosition.get(b.id) ?? 0);
  });

  for (const candidate of candidatePool) {
    pq.push(candidate);
  }

  const ranked = [];
  while (!pq.isEmpty()) {
    ranked.push(pq.pop());
  }

  const bestTopic = ranked[0];
  const seenProblemIds = new Set();
  const recommendedProblems = [];
  const pushUniqueProblems = (list) => {
    for (const p of list) {
      const idStr = String(p._id);
      if (seenProblemIds.has(idStr)) continue;
      seenProblemIds.add(idStr);
      recommendedProblems.push(p);
      if (recommendedProblems.length >= 4) break;
    }
  };

  pushUniqueProblems(
    await pickRecommendedProblems(
      bestTopic,
      solvedProblems,
      incorrectProblems,
      preferredLanguage,
      4
    )
  );

  // If the top topic has fewer than 4 problems, pull unique problems from the next ranked topics
  if (recommendedProblems.length < 4) {
    for (const alt of ranked.slice(1, 8)) {
      const more = await pickRecommendedProblems(
        alt,
        solvedProblems,
        incorrectProblems,
        preferredLanguage,
        4 - recommendedProblems.length
      );
      pushUniqueProblems(more);
      if (recommendedProblems.length >= 4) break;
    }
  }
  const recommendedProblem = recommendedProblems[0] ?? null;

  // Step 5: Construct descriptive prerequisite-aware reason string
  const prereqIds = graph.reverseDependencies.get(bestTopic.id) || [];
  const prereqModuleNames = Array.from(
    new Set(
      prereqIds
        .map((id) => graph.nodes.get(id)?.moduleTitle)
        .filter((m) => m && m !== bestTopic.moduleTitle)
    )
  );

  let reason;
  if (eligibleCandidates.length === 0) {
    reason = `Recommended "${bestTopic.title}" (${bestTopic.difficulty}) as the earliest incomplete concept in your topological learning order.`;
  } else if (prereqModuleNames.length > 0) {
    reason = `You completed prerequisite module ${prereqModuleNames.join(', ')}. "${bestTopic.title}" in ${bestTopic.moduleTitle} is now unlocked in your DAG learning path.`;
  } else {
    reason = `"${bestTopic.title}" (${bestTopic.moduleTitle || bestTopic.difficulty}) has all prerequisites satisfied and is prioritized next in your learning path.`;
  }

  const formatTopic = (node) => ({
    id: node.id,
    title: node.title,
    slug: node.slug,
    difficulty: node.difficulty,
    order: node.order,
    moduleId: node.moduleId,
    moduleTitle: node.moduleTitle,
    prerequisites: (graph.reverseDependencies.get(node.id) || []).map((pId) => ({
      id: pId,
      title: graph.nodes.get(pId)?.title || pId,
    })),
  });

  const totalTopicsCount = graph.nodes.size;
  const completedCount = completedTopics.size;

  return {
    topic: formatTopic(bestTopic),
    problem: recommendedProblem,
    recommendedProblems,
    preferredLanguage,
    completedAll: false,
    reason,
    alternatives: ranked.slice(1, 4).map(formatTopic),
    learningOrder,
    progress: {
      completedCount,
      totalTopics: totalTopicsCount,
      percentage: totalTopicsCount > 0 ? Math.round((completedCount / totalTopicsCount) * 100) : 0,
    },
  };
}

/**
 * Analyze user's submissions to identify weak topics (low acceptance rate).
 * Uses a Hash Map for O(S) submission aggregation and Min-Heap ordering to surface
 * the lowest-acceptance topics first.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ threshold?: number, limit?: number }} options
 */
export async function getWeakTopics(userId, options = {}) {
  if (!userId) {
    const err = new Error('User ID is required');
    err.statusCode = 400;
    throw err;
  }

  const threshold = Number.isFinite(Number(options.threshold)) ? Number(options.threshold) : 60;
  const limit = Number.isFinite(Number(options.limit)) ? Math.max(1, Number(options.limit)) : 10;

  const SubmissionModel = await resolveModel(
    ['Submission'],
    [() => import('../models/Submission.js')]
  );
  const TopicModel = await resolveModel(['Topic'], [() => import('../models/Topic.js')]);
  const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);

  if (!SubmissionModel) {
    return [];
  }

  const submissions = await SubmissionModel.find({
    $or: [{ user: userId }, { userId }],
  })
    .populate({
      path: 'problem',
      select: 'title slug difficulty topic topics tags',
    })
    .sort({ createdAt: -1 })
    .lean();

  if (!submissions.length) {
    return [];
  }

  // Optional topic metadata lookup map for resolving topic IDs to readable names
  const topicMetaMap = new Map();
  if (TopicModel) {
    const topics = await TopicModel.find({}).select('title name slug difficulty').lean();
    for (const t of topics) {
      const id = String(t._id);
      topicMetaMap.set(id, t.title || t.name || t.slug || id);
      if (t.slug) topicMetaMap.set(String(t.slug), t.title || t.name || t.slug);
    }
  }

  // Single-pass O(S) aggregation by topic using a Hash Map
  const topicStats = new Map();
  const solvedProblemIds = new Set();

  for (const sub of submissions) {
    const problem = sub.problem || {};
    const problemId = extractRefId(problem._id || sub.problem || sub.problemId);
    const isAccepted = (sub.verdict || sub.status) === 'Accepted';

    if (isAccepted && problemId) {
      solvedProblemIds.add(problemId);
    }

    // Derive topic keys from problem.topic, problem.topics, or tags
    const rawTopics = [];
    if (problem.topic) rawTopics.push(problem.topic);
    if (Array.isArray(problem.topics)) rawTopics.push(...problem.topics);
    if (rawTopics.length === 0 && Array.isArray(problem.tags) && problem.tags.length > 0) {
      rawTopics.push(problem.tags[0]);
    }
    if (rawTopics.length === 0 && sub.topic) {
      rawTopics.push(sub.topic);
    }

    const uniqueTopicKeys = new Set(
      rawTopics
        .map((t) => {
          if (typeof t === 'object' && t !== null) {
            return String(t._id || t.id || t.slug || t.name || t.title);
          }
          return String(t);
        })
        .filter(Boolean)
    );

    for (const topicKey of uniqueTopicKeys) {
      if (!topicStats.has(topicKey)) {
        const displayName =
          topicMetaMap.get(topicKey) ||
          (typeof problem.topic === 'object' && (problem.topic?.title || problem.topic?.name)) ||
          topicKey;

        topicStats.set(topicKey, {
          topicId: topicKey,
          topicName: displayName,
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          failedSubmissions: 0,
          attemptedProblems: new Set(),
          solvedProblems: new Set(),
          failedProblems: new Map(),
        });
      }

      const stats = topicStats.get(topicKey);
      stats.totalSubmissions += 1;
      if (problemId) stats.attemptedProblems.add(problemId);

      if (isAccepted) {
        stats.acceptedSubmissions += 1;
        if (problemId) stats.solvedProblems.add(problemId);
      } else {
        stats.failedSubmissions += 1;
        if (problemId && !stats.failedProblems.has(problemId)) {
          stats.failedProblems.set(problemId, {
            _id: problemId,
            title: problem.title || 'Untitled Problem',
            slug: problem.slug || null,
            difficulty: normalizeDifficulty(problem.difficulty),
          });
        }
      }
    }
  }

  // Min-Heap ordered by lowest acceptance rate first, then highest failure count
  const weakHeap = new MinPriorityQueue((a, b) => {
    if (a.acceptanceRate !== b.acceptanceRate) {
      return a.acceptanceRate - b.acceptanceRate;
    }
    return b.failedSubmissions - a.failedSubmissions;
  });

  for (const stats of topicStats.values()) {
    const acceptanceRate = Number(
      ((stats.acceptedSubmissions / stats.totalSubmissions) * 100).toFixed(2)
    );

    if (acceptanceRate < threshold && stats.failedSubmissions > 0) {
      const unsolvedFailed = [];
      for (const [pId, pMeta] of stats.failedProblems.entries()) {
        if (!solvedProblemIds.has(pId)) {
          unsolvedFailed.push(pMeta);
        }
      }

      weakHeap.push({
        topicId: stats.topicId,
        topicName: stats.topicName,
        totalSubmissions: stats.totalSubmissions,
        acceptedSubmissions: stats.acceptedSubmissions,
        failedSubmissions: stats.failedSubmissions,
        acceptanceRate,
        problemsAttempted: stats.attemptedProblems.size,
        problemsSolved: stats.solvedProblems.size,
        suggestedProblems: unsolvedFailed.slice(0, 3),
        reason: `Low acceptance rate of ${acceptanceRate}% (${stats.acceptedSubmissions}/${stats.totalSubmissions} accepted). Practice ${stats.topicName} fundamentals.`,
      });
    }
  }

  const weakTopics = [];
  while (!weakHeap.isEmpty() && weakTopics.length < limit) {
    const entry = weakHeap.pop();
    if (entry.suggestedProblems.length === 0 && ProblemModel) {
      // Supplement with an unsolved problem from this topic if available
      const topicQuery = mongoose.Types.ObjectId.isValid(entry.topicId)
        ? [{ topic: entry.topicId }, { topics: entry.topicId }]
        : [{ tags: entry.topicId }, { topic: entry.topicId }];
      const extraProblems = await ProblemModel.find({
        $or: topicQuery,
        isActive: { $ne: false },
      })
        .select('title slug difficulty')
        .limit(5)
        .lean();
      entry.suggestedProblems = extraProblems
        .filter((p) => !solvedProblemIds.has(String(p._id)))
        .slice(0, 3);
    }
    weakTopics.push(entry);
  }

  return weakTopics;
}

export default {
  buildPrerequisiteGraph,
  topologicalSort,
  getNextRecommendation,
  getWeakTopics,
  MinPriorityQueue,
  getDifficultyRank,
};
