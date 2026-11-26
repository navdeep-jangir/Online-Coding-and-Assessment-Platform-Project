import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import module19GreedyNotes from './notes/module19GreedyNotes.js';
import module20GraphsNotes from './notes/module20GraphsNotes.js';
import module21DpNotes from './notes/module21DpNotes.js';
import modules22to24Notes from './notes/modules22to24Notes.js';
import modules19to24Resources from './notes/modules19to24Resources.js';

dotenv.config();

// Explicit mapping from Module 19-24 topic slugs to internal CodeClimb Problem slugs
const topicToProblemSlugs = {
  // Module 19: Greedy
  'activity-selection': ['activity-selection-problem'],
  'fractional-knapsack': ['fractional-knapsack'],
  'job-sequencing-with-deadlines': ['job-sequencing-with-deadlines'],
  'interval-merging': ['merge-overlapping-intervals'],
  'minimum-platforms': ['minimum-platforms-required'],
  'jump-game': ['jump-game-reachability'],

  // Module 20: Graphs
  'bfs-traversal': ['bfs-traversal'],
  'dfs-traversal': ['dfs-traversal'],
  'connected-components': ['connected-components-count'],
  'flood-fill': ['flood-fill-image'],
  'number-of-islands': ['number-of-islands'],
  'cycle-detection-undirected': ['detect-cycle-undirected-graph'],
  'cycle-detection-directed': ['detect-cycle-directed-graph'],
  'bipartite-graph': ['bipartite-graph-check'],
  'kahns-algorithm': ['topological-sort-kahn'],
  'dijkstras-algorithm': ['shortest-path-dijkstra'],
  'disjoint-set-union': ['dsu-connectivity-queries'],

  // Module 21: Dynamic Programming
  'fibonacci-dp': ['fibonacci-dp'],
  'climbing-stairs': ['climbing-stairs'],
  'house-robber': ['house-robber'],
  'unique-paths-in-grid': ['unique-paths-in-grid'],
  'minimum-path-sum': ['minimum-path-sum-grid'],
  'subset-sum': ['subset-sum-check'],
  'partition-equal-subset-sum': ['partition-equal-subset-sum'],
  'zero-one-knapsack': ['0-1-knapsack'],
  'coin-change': ['coin-change-min-coins'],
  'rod-cutting': ['rod-cutting-maximum-profit'],
  'longest-common-subsequence': ['longest-common-subsequence'],
  'edit-distance': ['edit-distance'],
  'longest-increasing-subsequence': ['longest-increasing-subsequence'],
  'matrix-chain-multiplication': ['matrix-chain-multiplication'],

  // Module 22: Tries
  'trie-insertion': ['implement-trie-operations'],
  'trie-search': ['implement-trie-operations'],
  'prefix-matching': ['count-words-with-prefix'],
  'longest-common-prefix-using-trie': ['longest-common-prefix-trie'],

  // Module 23: Advanced String Algorithms
  'kmp-algorithm': ['kmp-pattern-search'],
  'z-algorithm': ['z-algorithm-pattern-matching'],

  // Module 24: Advanced Data Structures
  'range-query-with-segment-tree': ['range-sum-query-mutable'],
  'segment-tree-point-update': ['range-sum-query-mutable'],
  'fenwick-tree-bit': ['fenwick-tree-prefix-sums', 'count-smaller-numbers-after-self'],
};

async function upsertModules19to24() {
  await connectDB();

  const targetMods = await Module.find({ order: { $gte: 19, $lte: 24 } }).select('_id').lean();
  const targetModIds = targetMods.map((m) => m._id);

  const allNotes = [
    ...module19GreedyNotes,
    ...module20GraphsNotes,
    ...module21DpNotes,
    ...modules22to24Notes,
  ];
  const allProblems = await Problem.find({}, '_id slug').lean();
  const problemIdBySlug = new Map(allProblems.map((p) => [p.slug, p._id]));

  let upsertedNotes = 0;
  let updatedResources = 0;

  for (const item of allNotes) {
    const topic = await Topic.findOne({ slug: item.topicSlug, module: { $in: targetModIds } })
      .select('_id title resources')
      .lean();
    if (!topic) {
      console.warn(`Topic slug not found in DB (M19-24): ${item.topicSlug}`);
      continue;
    }

    const mappedIds = (topicToProblemSlugs[item.topicSlug] || [])
      .map((ps) => problemIdBySlug.get(ps))
      .filter(Boolean);
    const linked = await Problem.find({ topics: topic._id }).select('_id').limit(3).lean();
    const relatedSet = new Set([...mappedIds.map(String), ...linked.map((p) => String(p._id))]);
    const relatedIds = Array.from(relatedSet).map((id) => new mongoose.Types.ObjectId(id));

    await Note.findOneAndUpdate(
      { topic: topic._id },
      {
        $set: {
          topic: topic._id,
          title: item.title,
          content: item.explanation || item.definition,
          definition: item.definition || '',
          explanation: item.explanation || '',
          realWorldAnalogy: item.realWorldAnalogy || '',
          algorithm: item.algorithm || '',
          pseudocode: item.pseudocode || '',
          dryRunExample: item.dryRunExample || '',
          timeComplexity: item.timeComplexity || '',
          spaceComplexity: item.spaceComplexity || '',
          commonMistakes: item.commonMistakes || [],
          interviewTips: item.interviewTips || [],
          implementations: item.implementations || {},
          relatedProblems: relatedIds,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
    await Topic.updateOne({ _id: topic._id }, { $set: { hasNotes: true } });
    upsertedNotes++;
  }

  for (const [slug, resUpdate] of Object.entries(modules19to24Resources)) {
    const topic = await Topic.findOne({ slug, module: { $in: targetModIds } });
    if (!topic) {
      console.warn(`Resource topic slug not found (M19-24): ${slug}`);
      continue;
    }

    if (resUpdate.codechef) topic.resources.codechef = resUpdate.codechef;
    if (resUpdate.leetcode) topic.resources.leetcode = resUpdate.leetcode;
    if (resUpdate.youtube) topic.resources.youtube = resUpdate.youtube;
    await topic.save();
    updatedResources++;
  }

  console.log(
    `Safely upserted ${upsertedNotes} notes and updated verified resources on ${updatedResources} topics in Modules 19-24.`
  );
  await mongoose.connection.close();
  process.exit(0);
}

upsertModules19to24().catch(async (err) => {
  console.error('Upsert Modules 19-24 failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
