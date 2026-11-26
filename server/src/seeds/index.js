import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { seedCurriculum } from './seedCurriculum.js';
import { seedProblems } from './seedProblems.js';
import { seedDemo } from './seedDemo.js';

import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Problem from '../models/Problem.js';
import TestCase from '../models/TestCase.js';
import Achievement from '../models/Achievement.js';

dotenv.config();

async function runAllSeeds() {
  const isFresh = process.argv.includes('--fresh');
  await connectDB();

  if (isFresh) {
    console.log('Clearing existing curriculum, problems, test cases, notes, and achievements...');
    await Promise.all([
      Module.deleteMany({}),
      Topic.deleteMany({}),
      Note.deleteMany({}),
      Problem.deleteMany({}),
      TestCase.deleteMany({}),
      Achievement.deleteMany({}),
    ]);
  }

  await seedCurriculum({ disconnect: false });
  await seedProblems({ disconnect: false });
  await seedDemo({ disconnect: false });

  console.log('All CodeClimb seeds completed successfully!');
  await mongoose.connection.close();
  process.exit(0);
}

runAllSeeds().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
