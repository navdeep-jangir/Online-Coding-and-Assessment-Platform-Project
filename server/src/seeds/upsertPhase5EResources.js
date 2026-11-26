import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import phase5eExternalResources from './notes/phase5eResources.js';

dotenv.config();

// Comprehensive mapping of internal CodeClimb Problem slugs to Topic slugs across Modules 1–24
const topicToInternalProblemSlugs = {
  // Module 1: Programming Fundamentals
  'input-output-variables': ['sum-of-two-numbers', 'temperature-converter'],
  'arithmetic-operators': ['sum-of-two-numbers', 'simple-calculator'],
  'conditional-statements': ['even-or-odd', 'simple-calculator'],
  'switch-statements': ['simple-calculator'],
  'bitwise-operators-basics': ['swap-two-numbers'],

  // Module 3: Basic Mathematics
  'count-digits': ['count-digits'],
  'sum-of-digits': ['count-digits'],
  'reverse-number': ['reverse-number'],
  'palindrome-number': ['palindrome-number'],
  'armstrong-number': ['armstrong-number-check'],
  'factorial': ['factorial-recursive'],
  'prime-numbers': ['check-prime-number'],
  'divisors': ['find-all-divisors'],
  'gcd-and-lcm': ['gcd-of-two-numbers'],
  'euclidean-algorithm': ['gcd-of-two-numbers'],
  'sieve-of-eratosthenes': ['sieve-of-primes'],
  'fast-exponentiation': ['power-of-a-number'],

  // Module 4: Arrays
  'array-aggregates': ['find-maximum-element', 'find-second-largest'],
  'linear-search-sorted-check': ['check-if-array-is-sorted'],
  'array-reversal-rotation': ['reverse-an-array', 'left-rotate-array-by-k'],
  'array-duplicates-missing-zeros': ['remove-duplicates-from-sorted-array', 'missing-number-in-array', 'move-all-zeros-to-end', 'find-duplicate-in-array'],
  'union-intersection-arrays': ['union-of-two-sorted-arrays', 'intersection-of-two-sorted-arrays'],
  'prefix-sum': ['subarrays-with-sum-k'],
  'kadanes-algorithm': ['maximum-subarray-sum'],
  'majority-element-stocks': ['majority-element', 'stock-buy-and-sell'],
  '2d-arrays-matrices': ['spiral-matrix-traversal', 'matrix-transpose', 'search-in-2d-matrix'],

  // Module 5: Strings
  'string-frequency-duplicates': ['count-frequency-of-elements'],
  'string-reversal-palindrome': ['reverse-a-string'],
  'longest-common-prefix': ['longest-common-prefix-arr'],
  'string-compression-rotation': ['string-compression-rle', 'check-string-rotation'],
  'substring-subsequence-words': ['word-count-sentence'],
  'string-pattern-longest-substring': ['longest-unique-substring', 'longest-palindromic-substring-len'],

  // Module 6: Hashing
  'frequency-counting-hashing': ['count-distinct-elements', 'count-frequency-of-elements'],
  'two-sum-problem': ['pair-with-given-sum'],
  'longest-consecutive-sequence': ['longest-consecutive-sequence'],
  'subarray-sum-hashing': ['subarrays-with-sum-k'],

  // Module 7: Sorting
  'partition-algorithms-lomuto-hoare': ['sort-colors-dnf'],
  'count-inversions': ['count-inversions-array'],

  // Module 8: Searching
  'first-and-last-occurrence': ['first-and-last-occurrence'],
  'search-insert-position': ['search-insert-position'],
  'search-in-rotated-sorted-array': ['search-rotated-sorted-array'],
  'find-peak-element': ['find-peak-element'],
  'square-root-using-binary-search': ['sqrt-binary-search'],
  'search-a-2d-matrix': ['search-in-2d-matrix'],

  // Module 9: Recursion
  'factorial-recursive': ['factorial-recursive'],
  'fibonacci-recursive': ['fibonacci-number'],
  'reverse-array-recursive': ['reverse-an-array'],
  'print-subsequences': ['generate-all-subsets'],
  'print-subsets': ['generate-all-subsets', 'generate-subsets-lex'],
  'multiple-recursion-calls': ['tower-of-hanoi-move-count', 'tower-of-hanoi-moves'],

  // Module 10: Linked Lists
  'linked-list-insertion': ['insert-at-beginning-of-linked-list'],
  'reverse-linked-list': ['reverse-linked-list'],
  'find-middle-node': ['find-middle-element'],
  'detect-cycle-floyds': ['detect-cycle-in-linked-list'],
  'merge-two-sorted-lists': ['merge-two-sorted-lists'],
  'palindrome-linked-list': ['check-palindrome-list'],

  // Module 11: Stacks
  'valid-parentheses': ['valid-parentheses'],
  'infix-to-postfix': ['infix-to-postfix-conversion'],
  'postfix-evaluation': ['evaluate-postfix-expression'],
  'next-greater-element': ['next-greater-element'],
  'next-smaller-element': ['next-smaller-element'],
  'stock-span-problem': ['stock-span-problem'],
  'min-stack': ['min-stack-operations'],
  'largest-rectangle-in-histogram': ['largest-rectangle-in-histogram', 'largest-rectangle-histogram'],

  // Module 12: Queues
  'queue-array-implementation': ['queue-using-arrays'],
  'circular-queue': ['circular-queue-operations', 'circular-queue-simulation'],
  'queue-using-two-stacks': ['queue-using-two-stacks'],
  'sliding-window-maximum': ['sliding-window-maximum'],
};

async function upsertPhase5EResources() {
  await connectDB();

  let updatedExternal = 0;
  let updatedInternal = 0;

  for (const [slug, resUpdate] of Object.entries(phase5eExternalResources)) {
    const topics = await Topic.find({ slug });
    for (const topic of topics) {
      if (resUpdate.codechef) topic.resources.codechef = resUpdate.codechef;
      if (resUpdate.codechefLinks) topic.resources.codechefLinks = resUpdate.codechefLinks;
      if (resUpdate.leetcode) topic.resources.leetcode = resUpdate.leetcode;
      if (resUpdate.leetcodeLinks) topic.resources.leetcodeLinks = resUpdate.leetcodeLinks;
      if (resUpdate.youtube) topic.resources.youtube = resUpdate.youtube;
      await topic.save();
      updatedExternal++;
    }
  }

  const allProblems = await Problem.find({}, '_id slug topics').lean();
  const problemBySlug = new Map(allProblems.map((p) => [p.slug, p]));

  for (const [topicSlug, probSlugs] of Object.entries(topicToInternalProblemSlugs)) {
    const topic = await Topic.findOne({ slug: topicSlug }).select('_id').lean();
    if (!topic) continue;

    const probIds = probSlugs.map((s) => problemBySlug.get(s)?._id).filter(Boolean);
    if (probIds.length === 0) continue;

    // Link in Note.relatedProblems (preserving any existing links)
    await Note.updateOne(
      { topic: topic._id },
      { $addToSet: { relatedProblems: { $each: probIds } } }
    );

    // Link in Problem.topics so RoadmapPage TopicRow Practice button activates
    await Problem.updateMany(
      { _id: { $in: probIds } },
      { $addToSet: { topics: topic._id } }
    );
    updatedInternal++;
  }

  // Sync Problem.topics from all Note.relatedProblems so Roadmap Practice buttons match Notes Reader
  const notesWithProblems = await Note.find({ relatedProblems: { $exists: true, $ne: [] } })
    .select('topic relatedProblems')
    .lean();
  for (const n of notesWithProblems) {
    await Problem.updateMany(
      { _id: { $in: n.relatedProblems } },
      { $addToSet: { topics: n.topic } }
    );
  }

  console.log(
    `Phase 5E upsert complete: updated external resources on ${updatedExternal} topic records and mapped internal practice problems on ${updatedInternal} topics.`
  );
  await mongoose.connection.close();
  process.exit(0);
}

upsertPhase5EResources().catch(async (err) => {
  console.error('Phase 5E upsert failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
