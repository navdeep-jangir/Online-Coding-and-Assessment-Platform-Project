import { describe, it, expect } from 'vitest';
import {
  PriorityQueue,
  topologicalSort,
  binarySearch,
  mergeSort,
  hashMapCounter,
  buildDAG,
  detectCycle,
  bfsShortestPath,
} from '../../src/utils/dsaAlgorithms.js';

describe('DSA Algorithms Unit Tests', () => {
  describe('topologicalSort', () => {
    it('orders a valid DAG respecting prerequisites', () => {
      const graph = new Map([
        ['fundamentals', ['complexity', 'arrays']],
        ['complexity', ['arrays']],
        ['arrays', ['strings', 'hashing']],
        ['strings', []],
        ['hashing', []],
      ]);

      const order = topologicalSort(graph);
      expect(order).not.toBeNull();
      expect(order.length).toBe(5);
      expect(order.indexOf('fundamentals')).toBeLessThan(order.indexOf('complexity'));
      expect(order.indexOf('complexity')).toBeLessThan(order.indexOf('arrays'));
      expect(order.indexOf('arrays')).toBeLessThan(order.indexOf('strings'));
      expect(order.indexOf('arrays')).toBeLessThan(order.indexOf('hashing'));
    });

    it('handles an empty graph', () => {
      expect(topologicalSort(new Map())).toEqual([]);
    });

    it('returns null when a cycle exists', () => {
      const cyclic = new Map([
        ['a', ['b']],
        ['b', ['c']],
        ['c', ['a']],
      ]);
      expect(topologicalSort(cyclic)).toBeNull();
    });
  });

  describe('binarySearch', () => {
    it('finds an existing element in a sorted array', () => {
      const arr = [2, 5, 8, 12, 16, 23, 38, 56];
      expect(binarySearch(arr, 23)).toBe(5);
      expect(binarySearch(arr, 2)).toBe(0);
      expect(binarySearch(arr, 56)).toBe(7);
    });

    it('returns -1 when element is absent', () => {
      expect(binarySearch([1, 3, 5, 7], 4)).toBe(-1);
    });

    it('returns -1 for an empty array', () => {
      expect(binarySearch([], 10)).toBe(-1);
    });
  });

  describe('mergeSort', () => {
    it('sorts an unsorted array', () => {
      expect(mergeSort([38, 27, 43, 3, 9, 82, 10])).toEqual([3, 9, 10, 27, 38, 43, 82]);
    });

    it('handles already sorted, reverse sorted, and single element arrays', () => {
      expect(mergeSort([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
      expect(mergeSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
      expect(mergeSort([42])).toEqual([42]);
      expect(mergeSort([])).toEqual([]);
    });

    it('supports custom comparators (e.g., leaderboard descending XP)', () => {
      const users = [
        { name: 'A', xp: 100 },
        { name: 'B', xp: 300 },
        { name: 'C', xp: 200 },
      ];
      const sorted = mergeSort(users, (a, b) => b.xp - a.xp);
      expect(sorted.map((u) => u.name)).toEqual(['B', 'C', 'A']);
    });
  });

  describe('PriorityQueue', () => {
    it('inserts and extracts elements in priority order', () => {
      const pq = new PriorityQueue((a, b) => a.due - b.due);
      pq.insert({ id: 'p3', due: 30 });
      pq.insert({ id: 'p1', due: 10 });
      pq.insert({ id: 'p2', due: 20 });

      expect(pq.size()).toBe(3);
      expect(pq.peek().id).toBe('p1');
      expect(pq.extractMin().id).toBe('p1');
      expect(pq.extractMin().id).toBe('p2');
      expect(pq.extractMin().id).toBe('p3');
      expect(pq.isEmpty()).toBe(true);
      expect(pq.extractMin()).toBeNull();
    });
  });

  describe('hashMapCounter', () => {
    it('counts element frequencies accurately', () => {
      const counts = hashMapCounter(['cpp', 'python', 'cpp', 'java', 'python', 'cpp']);
      expect(counts.get('cpp')).toBe(3);
      expect(counts.get('python')).toBe(2);
      expect(counts.get('java')).toBe(1);
    });
  });

  describe('buildDAG, detectCycle & bfsShortestPath', () => {
    it('builds DAG from prerequisites and detects cycles', () => {
      const nodes = [
        { _id: 'm1', prerequisites: [] },
        { _id: 'm2', prerequisites: ['m1'] },
        { _id: 'm3', prerequisites: ['m2'] },
      ];
      const dag = buildDAG(nodes);
      expect(dag.get('m1')).toEqual(['m2']);
      expect(dag.get('m2')).toEqual(['m3']);
      expect(detectCycle(dag)).toBe(false);
      expect(bfsShortestPath(dag, 'm1', 'm3')).toEqual(['m1', 'm2', 'm3']);

      // Introduce cycle
      dag.get('m3').push('m1');
      expect(detectCycle(dag)).toBe(true);
    });
  });
});
