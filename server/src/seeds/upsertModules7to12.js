import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import modules7to9Notes from './notes/modules7to9Notes.js';
import modules10to12Notes from './notes/modules10to12Notes.js';
import sampleNotes from './notes/sampleNotes.js';
import modules7to12Resources from './notes/modules7to12Resources.js';

dotenv.config();

async function upsertModules7to12() {
  await connectDB();

  // Merge notes (sampleNotes already has merge-sort, valid-parentheses, etc.; combine without duplicates)
  const noteMap = new Map();
  for (const n of sampleNotes) noteMap.set(n.topicSlug, n);
  for (const n of [...modules7to9Notes, ...modules10to12Notes]) noteMap.set(n.topicSlug, n);

  let upsertedNotes = 0;
  let updatedResources = 0;

  for (const [slug, item] of noteMap.entries()) {
    const topic = await Topic.findOne({ slug }).select('_id title resources').lean();
    if (!topic) continue;

    const linked = await Problem.find({ topics: topic._id }).select('_id').limit(3).lean();
    const relatedIds = linked.map((p) => p._id);

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

  for (const [slug, resUpdate] of Object.entries(modules7to12Resources)) {
    const topic = await Topic.findOne({ slug });
    if (!topic) continue;

    if (resUpdate.codechef) topic.resources.codechef = resUpdate.codechef;
    if (resUpdate.leetcode) topic.resources.leetcode = resUpdate.leetcode;
    if (resUpdate.youtube) topic.resources.youtube = resUpdate.youtube;
    await topic.save();
    updatedResources++;
  }

  console.log(`Safely upserted ${upsertedNotes} notes and updated verified resources on ${updatedResources} topics in Modules 7-12.`);
  await mongoose.connection.close();
  process.exit(0);
}

upsertModules7to12().catch(async (err) => {
  console.error('Upsert Modules 7-12 failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
