import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import modules13to15Notes from './notes/modules13to15Notes.js';
import modules16to17Notes from './notes/modules16to17Notes.js';
import modules17bto18Notes from './notes/modules17bto18Notes.js';
import modules13to18Resources from './notes/modules13to18Resources.js';

dotenv.config();

// Explicit mapping from Module 13-18 topic slugs to internal CodeClimb Problem slugs
const topicToProblemSlugs = {
  // Module 13: Two Pointers
  'opposite-direction-pointers': ['reverse-an-array', 'reverse-a-string'],
  'same-direction-pointers': ['move-all-zeros-to-end'],
  'pair-sum-sorted-array': ['pair-with-given-sum'],
  'remove-duplicates-from-sorted': ['remove-duplicates-from-sorted-array'],
  'merge-sorted-arrays': ['merge-two-sorted-lists', 'union-of-two-sorted-arrays', 'intersection-of-two-sorted-arrays'],
  'three-sum': ['three-sum-count'],
  'container-with-most-water': ['container-with-most-water'],
  'partitioning-techniques': ['sort-colors-dnf', 'rearrange-positive-and-negative'],
  'trapping-rain-water': ['trapping-rain-water'],

  // Module 14: Sliding Window
  'maximum-sum-subarray-of-size-k': ['max-sum-subarray-k'],
  'longest-substring-without-repeating': ['longest-unique-substring'],
  'minimum-size-subarray-sum': ['min-size-subarray-sum'],

  // Module 15: Bit Manipulation
  'and-or-xor-not': ['swap-two-numbers'],
  'power-of-two': ['check-power-of-two'],
  'count-set-bits-brian-kernighan': ['count-set-bits'],
  'xor-properties': ['missing-number-in-array'],
  'single-number': ['single-number-xor', 'two-non-repeating-xor'],
  'subset-generation-using-bits': ['generate-all-subsets'],

  // Module 16: Backtracking
  'generate-subsets': ['generate-subsets-lex', 'generate-all-subsets'],
  'generate-permutations': ['all-permutations-count'],
  'combination-sum': ['combination-sum-ways'],
  'rat-in-a-maze': ['rat-in-maze-count'],
  'word-search': ['word-search-grid'],
  'n-queens-problem': ['n-queens-count'],

  // Module 17: Trees
  'inorder-traversal': ['inorder-traversal'],
  'level-order-traversal': ['level-order-traversal'],
  'height-of-tree': ['tree-height-calculation'],
  'diameter-of-tree': ['diameter-of-binary-tree'],
  'balanced-binary-tree': ['check-balanced-tree'],
  'lowest-common-ancestor': ['lowest-common-ancestor'],
  'validate-bst': ['validate-bst'],
  'kth-smallest-in-bst': ['kth-smallest-in-bst'],

  // Module 18: Heaps and Priority Queues
  'kth-largest-element': ['kth-largest-element-in-array'],
  'top-k-frequent-elements': ['top-k-frequent-elements'],
  'merge-k-sorted-lists': ['merge-k-sorted-arrays'],
  'median-from-data-stream': ['running-median-of-stream'],
};

async function upsertModules13to18() {
  await connectDB();

  const targetMods = await Module.find({ order: { $gte: 13, $lte: 18 } }).select('_id').lean();
  const targetModIds = targetMods.map((m) => m._id);

  const allNotes = [...modules13to15Notes, ...modules16to17Notes, ...modules17bto18Notes];
  const allProblems = await Problem.find({}, '_id slug').lean();
  const problemIdBySlug = new Map(allProblems.map((p) => [p.slug, p._id]));

  let upsertedNotes = 0;
  let updatedResources = 0;

  for (const item of allNotes) {
    const topic = await Topic.findOne({ slug: item.topicSlug, module: { $in: targetModIds } })
      .select('_id title resources')
      .lean();
    if (!topic) {
      console.warn(`Topic slug not found in DB: ${item.topicSlug}`);
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

  for (const [slug, resUpdate] of Object.entries(modules13to18Resources)) {
    const topic = await Topic.findOne({ slug, module: { $in: targetModIds } });
    if (!topic) {
      console.warn(`Resource topic slug not found: ${slug}`);
      continue;
    }

    if (resUpdate.codechef) topic.resources.codechef = resUpdate.codechef;
    if (resUpdate.leetcode) topic.resources.leetcode = resUpdate.leetcode;
    if (resUpdate.youtube) topic.resources.youtube = resUpdate.youtube;
    await topic.save();
    updatedResources++;
  }

  console.log(
    `Safely upserted ${upsertedNotes} notes and updated verified resources on ${updatedResources} topics in Modules 13-18.`
  );
  await mongoose.connection.close();
  process.exit(0);
}

upsertModules13to18().catch(async (err) => {
  console.error('Upsert Modules 13-18 failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
