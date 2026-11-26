import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';

import modules1to6 from './curriculum/modules1to6.js';
import modules7to12 from './curriculum/modules7to12.js';
import modules13to18 from './curriculum/modules13to18.js';
import modules19to24 from './curriculum/modules19to24.js';
import sampleNotes from './notes/sampleNotes.js';

dotenv.config();

const normalizeResourceLink = (link) => {
  if (!link || typeof link !== 'object' || !link.url) {
    return { url: '', title: '' };
  }
  return { url: String(link.url).trim(), title: String(link.title || '').trim() };
};

const buildFallbackNote = (topicDoc, moduleDoc) => ({
  topic: topicDoc._id,
  title: topicDoc.title,
  content: `# ${topicDoc.title}\n\n${topicDoc.description || `Core concept in ${moduleDoc.title}.`}`,
  definition: topicDoc.description || `${topicDoc.title} is an essential concept in ${moduleDoc.title}.`,
  explanation: `Understanding ${topicDoc.title} helps build strong problem-solving intuition in ${moduleDoc.title}. Focus on the underlying invariants, edge cases, and time/space trade-offs before jumping to code.`,
  realWorldAnalogy: `Think of ${topicDoc.title} as organizing a structured workflow where each step narrows down possibilities or maintains an invariant cleanly.`,
  algorithm: `1. Identify the input constraints and edge cases for ${topicDoc.title}.\n2. Choose the appropriate data structure or invariant.\n3. Implement the core logic cleanly and verify complexity.`,
  pseudocode: `// ${topicDoc.title}\nfunction solve(input):\n    // Validate edge cases\n    // Apply ${topicDoc.title} logic\n    return result`,
  dryRunExample: `Trace a small 3–5 element input step-by-step to verify boundary conditions and off-by-one indices.`,
  timeComplexity: 'Depends on problem size N; aim for optimal asymptotic complexity.',
  spaceComplexity: 'Track auxiliary data structures and recursion stack depth.',
  commonMistakes: [
    'Ignoring empty or single-element edge cases.',
    'Off-by-one errors in loop boundaries or indices.',
    'Not checking integer overflow constraints.',
  ],
  interviewTips: [
    'State the brute-force approach and its complexity first before optimizing.',
    'Walk through a dry run on a small example out loud.',
  ],
  implementations: {
    c: `// ${topicDoc.title} template in C\n#include <stdio.h>\n\nint main() {\n    // Practice ${topicDoc.title}\n    return 0;\n}`,
    cpp: `// ${topicDoc.title} template in C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Practice ${topicDoc.title}\n    return 0;\n}`,
    java: `// ${topicDoc.title} template in Java\npublic class Main {\n    public static void main(String[] args) {\n        // Practice ${topicDoc.title}\n    }\n}`,
    python: `# ${topicDoc.title} template in Python\ndef solve():\n    pass\n`,
  },
  relatedProblems: [],
});

export async function seedCurriculum({ disconnect = false } = {}) {
  await connectDB();

  const allModules = [
    ...modules1to6,
    ...modules7to12,
    ...modules13to18,
    ...modules19to24,
  ];

  const noteBySlug = new Map(sampleNotes.map((n) => [n.topicSlug, n]));
  const topicDocsBySlug = new Map();
  let previousModuleId = null;
  let totalTopics = 0;
  let totalNotes = 0;

  for (const modData of allModules) {
    const { topics = [], ...moduleFields } = modData;

    const moduleDoc = await Module.findOneAndUpdate(
      { slug: moduleFields.slug },
      {
        $set: {
          ...moduleFields,
          totalConcepts: topics.length,
          prerequisites: previousModuleId ? [previousModuleId] : [],
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    previousModuleId = moduleDoc._id;

    for (const topicData of topics) {
      const normalizedResources = {
        codechef: normalizeResourceLink(topicData.resources?.codechef),
        leetcode: normalizeResourceLink(topicData.resources?.leetcode),
        youtube: Array.isArray(topicData.resources?.youtube)
          ? topicData.resources.youtube.map(normalizeResourceLink).filter((r) => r.url)
          : [],
      };

      const topicDoc = await Topic.findOneAndUpdate(
        { module: moduleDoc._id, slug: topicData.slug },
        {
          $set: {
            module: moduleDoc._id,
            title: topicData.title,
            slug: topicData.slug,
            description: topicData.description || '',
            order: topicData.order,
            difficulty: topicData.difficulty || 'Easy',
            conceptType: topicData.conceptType || 'both',
            resources: normalizedResources,
            hasNotes: true,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      topicDocsBySlug.set(topicDoc.slug, topicDoc);
      totalTopics++;

      const richNote = noteBySlug.get(topicDoc.slug);
      const notePayload = richNote
        ? {
            topic: topicDoc._id,
            title: richNote.title,
            content: richNote.explanation,
            definition: richNote.definition,
            explanation: richNote.explanation,
            realWorldAnalogy: richNote.realWorldAnalogy,
            algorithm: richNote.algorithm,
            pseudocode: richNote.pseudocode,
            dryRunExample: richNote.dryRunExample,
            timeComplexity: richNote.timeComplexity,
            spaceComplexity: richNote.spaceComplexity,
            commonMistakes: richNote.commonMistakes || [],
            interviewTips: richNote.interviewTips || [],
            implementations: richNote.implementations || {},
          }
        : buildFallbackNote(topicDoc, moduleDoc);

      await Note.findOneAndUpdate(
        { topic: topicDoc._id },
        { $set: notePayload },
        { new: true, upsert: true, runValidators: true }
      );
      totalNotes++;
    }
  }

  // Link related problems if problems already exist
  for (const n of sampleNotes) {
    const topicDoc = topicDocsBySlug.get(n.topicSlug);
    if (!topicDoc || !n.relatedProblemSlugs?.length) continue;
    const related = await Problem.find({ slug: { $in: n.relatedProblemSlugs } }).select('_id');
    if (related.length > 0) {
      await Note.updateOne(
        { topic: topicDoc._id },
        { $set: { relatedProblems: related.map((p) => p._id) } }
      );
    }
  }

  console.log(`Seeded ${allModules.length} modules, ${totalTopics} topics, and ${totalNotes} notes.`);

  if (disconnect) {
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('seedCurriculum.js')) {
  seedCurriculum({ disconnect: true }).catch((err) => {
    console.error('Failed to seed curriculum:', err);
    process.exit(1);
  });
}

export default seedCurriculum;
