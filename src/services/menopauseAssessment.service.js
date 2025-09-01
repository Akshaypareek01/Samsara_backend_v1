import { MenopauseAssessment } from '../models/menopause-assessment.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get menopause assessment questions and options
 */
const getAssessmentQuestions = () => {
  return {
    questions: [
      {
        id: 'irregularPeriods',
        question: 'Do you experience irregular periods?',
        options: ['Yes, frequently', 'Sometimes', 'Rarely', 'No, Never'],
      },
      {
        id: 'fatigue',
        question: 'How often do you feel tired or fatigued?',
        options: ['Always tired', 'Often tired', 'Sometimes tired', 'Rarely tired'],
      },
      {
        id: 'weightChanges',
        question: 'Have you noticed changes in your weight recently?',
        options: ['Significant weight gain', 'Slight weight gain', 'Weight remains stable', 'Weight loss'],
      },
      {
        id: 'sleepQuality',
        question: 'How is your sleep quality?',
        options: ['Very poor sleep', 'Poor sleep', 'Average sleep', 'Good sleep'],
      },
      {
        id: 'moodSwings',
        question: 'Do you experience mood swings or anxiety?',
        options: ['Very frequently', 'Frequently', 'Sometimes', 'Never'],
      },
    ],
    scoringInfo: {
      description: 'Each question has 4 options scored from 0-3. Higher scores indicate lower risk.',
      riskLevels: {
        'High Risk': 'Average score < 0.5 - Immediate consultation recommended',
        'Moderate Risk': 'Average score ≥ 0.5 - Healthcare consultation recommended',
        'Low-Moderate Risk': 'Average score ≥ 1.5 - Lifestyle adjustments suggested',
        'Low Risk': 'Average score ≥ 2.5 - Continue healthy lifestyle',
      },
    },
  };
};

/**
 * Create a new menopause assessment
 */
const createAssessment = async (userId, assessmentData) => {
  // Mark previous assessments as not latest
  await MenopauseAssessment.markPreviousAsNotLatest(userId);

  // Create new assessment
  const assessment = new MenopauseAssessment({
    userId,
    answers: assessmentData.answers,
  });

  await assessment.save();
  return assessment;
};

/**
 * Get latest assessment for a user
 */
const getLatestAssessment = async (userId) => {
  const assessment = await MenopauseAssessment.getLatestAssessment(userId);
  if (!assessment) {
    throw new ApiError(404, 'No assessment found for this user');
  }
  return assessment;
};

/**
 * Get assessment history for a user
 */
const getAssessmentHistory = async (userId, query) => {
  const { page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const assessments = await MenopauseAssessment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

  const total = await MenopauseAssessment.countDocuments({ userId });

  return {
    assessments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get assessment by ID
 */
const getAssessmentById = async (assessmentId, userId) => {
  const assessment = await MenopauseAssessment.findOne({
    _id: assessmentId,
    userId,
  });

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  return assessment;
};

/**
 * Update existing assessment (reassessment)
 */
const updateAssessment = async (assessmentId, userId, assessmentData) => {
  const assessment = await MenopauseAssessment.findOne({
    _id: assessmentId,
    userId,
  });

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Update answers
  assessment.answers = assessmentData.answers;
  assessment.assessmentDate = new Date();

  // The pre-save middleware will recalculate scores and risk level
  await assessment.save();

  return assessment;
};

/**
 * Delete assessment
 */
const deleteAssessment = async (assessmentId, userId) => {
  const assessment = await MenopauseAssessment.findOneAndDelete({
    _id: assessmentId,
    userId,
  });

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // If this was the latest assessment, make the previous one latest
  if (assessment.isLatest) {
    const previousAssessment = await MenopauseAssessment.findOne({ userId }).sort({ createdAt: -1 });

    if (previousAssessment) {
      previousAssessment.isLatest = true;
      await previousAssessment.save();
    }
  }

  return { message: 'Assessment deleted successfully' };
};

/**
 * Get assessment statistics for a user
 */
const getAssessmentStats = async (userId) => {
  const assessments = await MenopauseAssessment.find({ userId }).sort({ createdAt: -1 });

  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      latestRiskLevel: null,
      riskLevelHistory: [],
      averageScore: null,
      improvement: null,
    };
  }

  const latest = assessments[0];
  const riskLevelCounts = {};
  let totalScore = 0;

  assessments.forEach((assessment) => {
    riskLevelCounts[assessment.riskLevel] = (riskLevelCounts[assessment.riskLevel] || 0) + 1;
    totalScore += assessment.averageScore;
  });

  const averageScore = totalScore / assessments.length;

  // Calculate improvement (compare latest with previous)
  let improvement = null;
  if (assessments.length > 1) {
    const previous = assessments[1];
    const scoreDiff = latest.averageScore - previous.averageScore;
    improvement = {
      scoreChange: scoreDiff,
      riskLevelChange: latest.riskLevel !== previous.riskLevel,
      improved: scoreDiff > 0,
      percentageChange: ((scoreDiff / previous.averageScore) * 100).toFixed(1),
    };
  }

  return {
    totalAssessments: assessments.length,
    latestRiskLevel: latest.riskLevel,
    riskLevelHistory: Object.entries(riskLevelCounts).map(([level, count]) => ({
      riskLevel: level,
      count,
      percentage: ((count / assessments.length) * 100).toFixed(1),
    })),
    averageScore: averageScore.toFixed(2),
    improvement,
  };
};

export const menopauseAssessmentService = {
  getAssessmentQuestions,
  createAssessment,
  getLatestAssessment,
  getAssessmentHistory,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  getAssessmentStats,
};
