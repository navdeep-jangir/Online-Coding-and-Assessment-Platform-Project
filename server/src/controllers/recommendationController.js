import {
  getNextRecommendation,
  getWeakTopics as findWeakTopics,
} from '../services/recommendationService.js';

/**
 * GET /api/recommendations/next
 * Returns the next recommended topic and problem for the authenticated user
 * based on the curriculum prerequisite DAG, completed topics, and difficulty progression.
 */
export async function getRecommendation(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const recommendation = await getNextRecommendation(userId);

    return res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to compute recommendation',
    });
  }
}

/**
 * GET /api/recommendations/weak-topics
 * Analyzes the authenticated user's submissions to identify weak topics
 * with low acceptance rates and suggests targeted practice problems.
 */
export async function getWeakTopics(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const threshold = req.query?.threshold !== undefined ? Number(req.query.threshold) : 60;
    const limit = req.query?.limit !== undefined ? Number(req.query.limit) : 10;

    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        message: 'threshold must be a number between 0 and 100',
      });
    }

    if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'limit must be a number between 1 and 50',
      });
    }

    const weakTopics = await findWeakTopics(userId, { threshold, limit });

    return res.status(200).json({
      success: true,
      count: weakTopics.length,
      data: weakTopics,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to analyze weak topics',
    });
  }
}

export default {
  getRecommendation,
  getWeakTopics,
};
