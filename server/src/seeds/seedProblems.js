import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Problem from '../models/Problem.js';
import TestCase from '../models/TestCase.js';
import Topic from '../models/Topic.js';

import { problems1to50 } from './problems/problems1to50.js';
import problems51to100 from './problems/problems51to100.js';
import { problems101to150 } from './problems/problems101to150.js';
import { problemsExtra41 } from './problems/problemsExtra41.js';

dotenv.config();

export async function seedProblems({ disconnect = false } = {}) {
  await connectDB();

  const allProblems = [...problems1to50, ...problems51to100, ...problems101to150, ...problemsExtra41];
  const topics = await Topic.find().select('_id slug').lean();
  const topicIdBySlug = new Map(topics.map((t) => [t.slug, t._id]));

  let problemCount = 0;
  let testCaseCount = 0;

  for (let idx = 0; idx < allProblems.length; idx++) {
    const item = allProblems[idx];
    const { topicSlugs = [], testCases = [], ...problemFields } = item;

    const topicIds = topicSlugs
      .map((slug) => topicIdBySlug.get(slug))
      .filter(Boolean);

    const problemDoc = await Problem.findOneAndUpdate(
      { slug: problemFields.slug },
      {
        $set: {
          ...problemFields,
          topics: topicIds,
          order: problemFields.order ?? idx + 1,
          isPublished: true,
          isArchived: false,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    problemCount++;

    // Replace test cases cleanly for idempotent re-seeding
    await TestCase.deleteMany({ problem: problemDoc._id });
    if (testCases.length > 0) {
      const tcDocs = testCases.map((tc, tcIdx) => ({
        problem: problemDoc._id,
        input: tc.input ?? '',
        expectedOutput: tc.expectedOutput ?? '',
        isSample: Boolean(tc.isSample),
        order: tc.order ?? tcIdx,
        explanation: tc.explanation || '',
      }));
      await TestCase.insertMany(tcDocs);
      testCaseCount += tcDocs.length;
    }
  }

  console.log(`Seeded ${problemCount} problems and ${testCaseCount} test cases.`);

  if (disconnect) {
    process.exit(0);
  }
}

if (process.argv[1]?.endsWith('seedProblems.js')) {
  seedProblems({ disconnect: true }).catch((err) => {
    console.error('Failed to seed problems:', err);
    process.exit(1);
  });
}

export default seedProblems;
