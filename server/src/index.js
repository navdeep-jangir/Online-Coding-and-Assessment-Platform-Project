import fs from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security and core middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(hpp());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check
app.get('/api/v1/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting for API endpoints
app.use('/api/v1', apiLimiter);

// Fail fast with clear 503 if MongoDB is disconnected (instead of buffering/timing out with 500)
app.use('/api/v1', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please configure MONGODB_URI in server/.env and ensure MongoDB is running.',
    });
  }
  next();
});

// API v1 routes
const API_ROUTES = [
  { path: 'auth', candidates: ['auth.js', 'authRoutes.js', 'auth.routes.js'] },
  { path: 'users', candidates: ['users.js', 'user.js', 'userRoutes.js', 'usersRoutes.js', 'users.routes.js'] },
  { path: 'modules', candidates: ['modules.js', 'module.js', 'moduleRoutes.js', 'modulesRoutes.js', 'modules.routes.js'] },
  { path: 'topics', candidates: ['topics.js', 'topic.js', 'topicRoutes.js', 'topicsRoutes.js', 'topics.routes.js'] },
  { path: 'notes', candidates: ['notes.js', 'note.js', 'noteRoutes.js', 'notesRoutes.js', 'notes.routes.js'] },
  { path: 'problems', candidates: ['problems.js', 'problem.js', 'problemRoutes.js', 'problemsRoutes.js', 'problems.routes.js'] },
  { path: 'test-cases', candidates: ['testCases.js', 'testCaseRoutes.js', 'test-cases.js'] },
  { path: 'submissions', candidates: ['submissions.js', 'submission.js', 'submissionRoutes.js', 'submissionsRoutes.js', 'submissions.routes.js'] },
  { path: 'drafts', candidates: ['codeDrafts.js', 'codeDraftRoutes.js', 'drafts.js'] },
  { path: 'code-drafts', candidates: ['codeDrafts.js', 'codeDraftRoutes.js'] },
  { path: 'progress', candidates: ['progress.js', 'progressRoutes.js', 'progress.routes.js'] },
  { path: 'bookmarks', candidates: ['bookmarks.js', 'bookmark.js', 'bookmarkRoutes.js', 'bookmarksRoutes.js', 'bookmarks.routes.js'] },
  { path: 'revisions', candidates: ['revisions.js', 'revision.js', 'revisionRoutes.js', 'revisionsRoutes.js', 'revisions.routes.js'] },
  {
    path: 'recommendations',
    candidates: [
      'recommendations.js',
      'recommendation.js',
      'recommendationRoutes.js',
      'recommendationsRoutes.js',
      'recommendations.routes.js',
    ],
  },
  {
    path: 'daily-challenges',
    candidates: [
      'daily-challenges.js',
      'dailyChallenges.js',
      'dailyChallenge.js',
      'dailyChallengeRoutes.js',
      'dailyChallengesRoutes.js',
      'daily-challenges.routes.js',
    ],
  },
  { path: 'leaderboard', candidates: ['leaderboard.js', 'leaderboardRoutes.js', 'leaderboard.routes.js'] },
  { path: 'reports', candidates: ['reports.js', 'report.js', 'reportRoutes.js', 'reportsRoutes.js', 'reports.routes.js'] },
  { path: 'admin', candidates: ['admin.js', 'adminRoutes.js', 'admin.routes.js'] },
];

for (const { path: routePath, candidates } of API_ROUTES) {
  let router = null;

  for (const file of candidates) {
    const fileUrl = new URL(`./routes/${file}`, import.meta.url);
    if (fs.existsSync(fileUrl)) {
      const mod = await import(`./routes/${file}`);
      router = mod.default || mod.router || mod;
      break;
    }
  }

  if (router) {
    app.use(`/api/v1/${routePath}`, router);
  } else {
    app.use(`/api/v1/${routePath}`, (req, res) => {
      res.status(501).json({
        success: false,
        message: `Route /api/v1/${routePath} is not implemented yet`,
      });
    });
  }
}

// 404 & global error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

export const startServer = async () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MONGODB_URI) {
      throw new Error('Missing required environment variable: MONGODB_URI');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('Missing required environment variable: JWT_SECRET');
    }
  }
  await connectDB();
  return app.listen(PORT, () => {
    console.log(
      `CodeClimb server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app };
export default app;
