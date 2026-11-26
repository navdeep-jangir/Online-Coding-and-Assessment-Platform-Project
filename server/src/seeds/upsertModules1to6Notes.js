import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import modules1to6Notes from './notes/modules1to6Notes.js';
import sampleNotes from './notes/sampleNotes.js';

dotenv.config();

async function upsertModules1to6() {
  await connectDB();

  const combined = [...modules1to6Notes, ...sampleNotes];
  let updatedCount = 0;

  for (const item of combined) {
    const topic = await Topic.findOne({ slug: item.topicSlug }).select('_id title').lean();
    if (!topic) continue;

    let relatedIds = [];
    if (Array.isArray(item.relatedProblemSlugs) && item.relatedProblemSlugs.length > 0) {
      const probs = await Problem.find({ slug: { $in: item.relatedProblemSlugs } }).select('_id').lean();
      relatedIds = probs.map((p) => p._id);
    } else {
      const linked = await Problem.find({ topics: topic._id }).select('_id').limit(3).lean();
      relatedIds = linked.map((p) => p._id);
    }

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
    updatedCount++;
  }

  console.log(`Safely upserted ${updatedCount} complete original notes (Modules 1-6 + core samples).`);
  await mongoose.connection.close();
  process.exit(0);
}

upsertModules1to6().catch(async (err) => {
  console.error('Upsert failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
