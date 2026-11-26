import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Achievement from '../models/Achievement.js';
import DailyChallenge from '../models/DailyChallenge.js';
import Problem from '../models/Problem.js';
import achievementsData from './achievements.js';

dotenv.config();

export async function seedDemo({ disconnect = false } = {}) {
  await connectDB();

  // Seed achievements
  for (const ach of achievementsData) {
    await Achievement.findOneAndUpdate(
      { key: ach.key },
      { $set: ach },
      { new: true, upsert: true, runValidators: true }
    );
  }
  console.log(`Seeded ${achievementsData.length} achievements.`);

  // Seed admin account (require explicit env credentials in production)
  const adminEmail = (
    process.env.ADMIN_EMAIL ||
    (process.env.NODE_ENV !== 'production' ? 'admin@codeclimb.dev' : '')
  ).toLowerCase();
  const adminPassword =
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV !== 'production' ? 'Admin@123' : '');

  if (adminEmail && adminPassword) {
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: 'CodeClimb Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        collegeName: 'CodeClimb Platform',
        preferredLanguage: 'cpp',
        isActive: true,
      });
      console.log(`Created admin account: ${adminEmail}`);
    } else {
      console.log(`Admin account already exists: ${adminEmail}`);
    }
  } else {
    console.log('Skipping admin seed: ADMIN_EMAIL / ADMIN_PASSWORD not set in production.');
  }

  // Seed development-only demo student account
  if (process.env.NODE_ENV !== 'production') {
    const demoEmail = (process.env.DEMO_EMAIL || 'demo@codeclimb.dev').toLowerCase();
    const demoPassword = process.env.DEMO_PASSWORD || 'Demo@123';
    const existingDemo = await User.findOne({ email: demoEmail });
    if (!existingDemo) {
      const hashedPassword = await bcrypt.hash(demoPassword, 10);
      await User.create({
        name: 'Demo Student',
        email: demoEmail,
        password: hashedPassword,
        role: 'student',
        collegeName: 'CodeClimb Demo University',
        preferredLanguage: 'python',
        xp: 0,
        currentStreak: 0,
        longestStreak: 0,
        isActive: true,
      });
      console.log(`Created demo student account (dev only): ${demoEmail}`);
    } else {
      console.log(`Demo student account already exists: ${demoEmail}`);
    }
  }

  // Ensure a DailyChallenge exists for today (Asia/Kolkata)
  const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const todayUtc = new Date(Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate()));
  const existingDaily = await DailyChallenge.findOne({ date: todayUtc });
  if (!existingDaily) {
    const firstProblem = await Problem.findOne({ isPublished: true, isArchived: { $ne: true } }).sort({ order: 1 });
    if (firstProblem) {
      await DailyChallenge.create({
        date: todayUtc,
        problem: firstProblem._id,
        difficulty: firstProblem.difficulty,
      });
      console.log(`Assigned today's Daily Challenge: ${firstProblem.title}`);
    }
  }

  if (disconnect) {
    process.exit(0);
  }
}

if (process.argv[1]?.endsWith('seedDemo.js')) {
  seedDemo({ disconnect: true }).catch((err) => {
    console.error('Failed to seed demo data:', err);
    process.exit(1);
  });
}

export default seedDemo;
