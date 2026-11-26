/**
 * CodeClimb Core DSA Algorithms & Data Structures
 *
 * This module implements foundational data structures and algorithms used directly
 * across CodeClimb's recommendation engine, revision scheduler, leaderboard ranking,
 * progress analytics, and prerequisite validation.
 */

/**
 * Min-Heap Priority Queue for due revision recommendations and scheduling.
 *
 * Used by: `revisionService` to prioritize overdue and upcoming revisions.
 *
 * @template T
 */
export class PriorityQueue {
  /**
   * @param {(a: T, b: T) => number} [compareFn] - Comparator returning < 0 if a has higher priority than b.
   */
  constructor(compareFn = (a, b) => a - b) {
    this.heap = [];
    this.compare = compareFn;
  }

  /**
   * Number of elements in the queue.
   * @complexity Time: O(1), Space: O(1)
   * @returns {number}
   */
  size() {
    return this.heap.length;
  }

  /**
   * Check whether the queue is empty.
   * @complexity Time: O(1), Space: O(1)
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Return the highest-priority (minimum) element without removing it.
   * @complexity Time: O(1), Space: O(1)
   * @returns {T | null}
   */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Insert an element into the priority queue.
   * @complexity Time: O(log n), Space: O(1)
   * @param {T} value
   */
  insert(value) {
    this.heap.push(value);
    this._bubbleUp(this.heap.length - 1);
  }

  /**
   * Remove and return the highest-priority (minimum) element.
   * @complexity Time: O(log n), Space: O(1)
   * @returns {T | null}
   */
  extractMin() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIdx]) < 0) {
        [this.heap[index], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[index]];
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  _sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Kahn's Algorithm (BFS-based Topological Sort) for DAG learning path generation.
 *
 * Used by: `recommendationService` to order modules/topics respecting prerequisites.
 *
 * @param {Map<string, string[]> | Record<string, string[]>} adjacencyList - Directed edges: prereq -> dependents
 * @returns {string[] | null} Topologically sorted node IDs, or `null` if a cycle exists
 * @complexity Time: O(V + E), Space: O(V + E)
 */
export function topologicalSort(adjacencyList) {
  const graph = adjacencyList instanceof Map ? adjacencyList : new Map(Object.entries(adjacencyList));
  const inDegree = new Map();

  for (const [node, neighbors] of graph.entries()) {
    if (!inDegree.has(node)) inDegree.set(node, 0);
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
      if (!graph.has(neighbor)) {
        graph.set(neighbor, []);
      }
    }
  }

  // Queue-based BFS starting from nodes with zero prerequisites (in-degree 0)
  const queue = [];
  for (const [node, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(node);
  }

  const order = [];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    order.push(current);

    for (const neighbor of graph.get(current) || []) {
      const nextDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, nextDeg);
      if (nextDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== inDegree.size) {
    return null; // Cycle detected
  }

  return order;
}

/**
 * Binary Search on a sorted array.
 *
 * Used by: Problem discovery and leaderboard rank lookup.
 *
 * @template T, K
 * @param {T[]} sortedArray
 * @param {K} target
 * @param {(item: T, target: K) => number} [compareFn] - Returns < 0 if item < target, 0 if equal, > 0 if item > target
 * @returns {number} Index of target or -1 if not found
 * @complexity Time: O(log n), Space: O(1)
 */
export function binarySearch(sortedArray, target, compareFn = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const cmp = compareFn(sortedArray[mid], target);
    if (cmp === 0) return mid;
    if (cmp < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

/**
 * Stable Merge Sort for leaderboard rankings and ordered problem lists.
 *
 * Used by: `leaderboardController` for deterministic ranking.
 *
 * @template T
 * @param {T[]} array
 * @param {(a: T, b: T) => number} [compareFn]
 * @returns {T[]} New sorted array
 * @complexity Time: O(n log n), Space: O(n)
 */
export function mergeSort(array, compareFn = (a, b) => a - b) {
  if (array.length <= 1) return [...array];

  const mid = Math.floor(array.length / 2);
  const left = mergeSort(array.slice(0, mid), compareFn);
  const right = mergeSort(array.slice(mid), compareFn);

  const merged = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      merged.push(left[i++]);
    } else {
      merged.push(right[j++]);
    }
  }

  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);

  return merged;
}

/**
 * Frequency counter using a Hash Map (`Map`).
 *
 * Used by: Progress tracking, topic-wise analytics, and language distribution.
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} [keyFn]
 * @returns {Map<string, number>}
 * @complexity Time: O(n), Space: O(k) where k is unique keys
 */
export function hashMapCounter(items, keyFn = (item) => String(item)) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/**
 * Build a Directed Acyclic Graph (adjacency list) from modules or topics and their prerequisites.
 * Edge direction: prerequisiteId -> dependentId.
 *
 * Used by: `recommendationService` to model curriculum dependencies.
 *
 * @param {Array<{ _id: any, prerequisites?: any[] }>} nodes
 * @returns {Map<string, string[]>}
 * @complexity Time: O(V + E), Space: O(V + E)
 */
export function buildDAG(nodes) {
  const graph = new Map();

  for (const node of nodes) {
    const id = String(node._id);
    if (!graph.has(id)) {
      graph.set(id, []);
    }
  }

  for (const node of nodes) {
    const id = String(node._id);
    const prereqs = node.prerequisites || [];
    for (const prereq of prereqs) {
      const prereqId = String(prereq?._id || prereq);
      if (!graph.has(prereqId)) {
        graph.set(prereqId, []);
      }
      graph.get(prereqId).push(id);
    }
  }

  return graph;
}

/**
 * Detect cycles in a directed graph using 3-color DFS (0 = unvisited, 1 = visiting, 2 = visited).
 *
 * Used by: Admin prerequisite validation to prevent circular dependencies.
 *
 * @param {Map<string, string[]> | Record<string, string[]>} adjacencyList
 * @returns {boolean} True if a cycle exists
 * @complexity Time: O(V + E), Space: O(V)
 */
export function detectCycle(adjacencyList) {
  const graph = adjacencyList instanceof Map ? adjacencyList : new Map(Object.entries(adjacencyList));
  const state = new Map(); // 0/undefined: unvisited, 1: visiting, 2: visited

  const dfs = (node) => {
    state.set(node, 1);
    for (const neighbor of graph.get(node) || []) {
      const neighborState = state.get(neighbor) || 0;
      if (neighborState === 1) return true;
      if (neighborState === 0 && dfs(neighbor)) return true;
    }
    state.set(node, 2);
    return false;
  };

  for (const node of graph.keys()) {
    if ((state.get(node) || 0) === 0) {
      if (dfs(node)) return true;
    }
  }

  return false;
}

/**
 * Breadth-First Search for finding the shortest prerequisite path between two concepts.
 *
 * Used by: Recommendation engine to explain learning path steps.
 *
 * @param {Map<string, string[]> | Record<string, string[]>} adjacencyList
 * @param {string} start
 * @param {string} end
 * @returns {string[] | null} Shortest path array or null if unreachable
 * @complexity Time: O(V + E), Space: O(V)
 */
export function bfsShortestPath(adjacencyList, start, end) {
  const graph = adjacencyList instanceof Map ? adjacencyList : new Map(Object.entries(adjacencyList));
  if (start === end) return graph.has(start) ? [start] : null;

  const visited = new Set([start]);
  const parent = new Map();
  const queue = [start];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    for (const neighbor of graph.get(current) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        if (neighbor === end) {
          const path = [end];
          let step = end;
          while (parent.has(step)) {
            step = parent.get(step);
            path.unshift(step);
          }
          return path;
        }
        queue.push(neighbor);
      }
    }
  }

  return null;
}

export default {
  PriorityQueue,
  topologicalSort,
  binarySearch,
  mergeSort,
  hashMapCounter,
  buildDAG,
  detectCycle,
  bfsShortestPath,
};
