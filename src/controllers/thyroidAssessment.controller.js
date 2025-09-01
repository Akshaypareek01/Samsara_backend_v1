import catchAsync from '../utils/catchAsync.js';
import { thyroidAssessmentService } from '../services/thyroidAssessment.service.js';

/**
 * Get all thyroid assessment questions and options
 */
const getAssessmentQuestions = catchAsync(async (req, res) => {
  const questions = thyroidAssessmentService.getAssessmentQuestions();
  res.status(200).json({
    status: 'success',
    data: questions,
  });
});

/**
 * Create a new thyroid assessment
 */
const createAssessment = catchAsync(async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!answers) {
    return res.status(400).json({
      status: 'error',
      message: 'Answers are required',
    });
  }

  const assessment = await thyroidAssessmentService.createAssessment(userId, answers);

  res.status(201).json({
    status: 'success',
    data: {
      assessment,
    },
  });
});

/**
 * Get latest assessment for user
 */
const getLatestAssessment = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const assessment = await thyroidAssessmentService.getLatestAssessment(userId);

  res.status(200).json({
    status: 'success',
    data: {
      assessment,
    },
  });
});

/**
 * Get assessment history with pagination and filtering
 */
const getAssessmentHistory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, riskLevel } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    riskLevel,
  };

  const result = await thyroidAssessmentService.getAssessmentHistory(userId, options);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Get assessment by ID
 */
const getAssessmentById = catchAsync(async (req, res) => {
  const { assessmentId } = req.params;
  const assessment = await thyroidAssessmentService.getAssessmentById(assessmentId);

  res.status(200).json({
    status: 'success',
    data: {
      assessment,
    },
  });
});

/**
 * Update assessment
 */
const updateAssessment = catchAsync(async (req, res) => {
  const { assessmentId } = req.params;
  const { answers } = req.body;

  if (!answers) {
    return res.status(400).json({
      status: 'error',
      message: 'Answers are required',
    });
  }

  const assessment = await thyroidAssessmentService.updateAssessment(assessmentId, answers);

  res.status(200).json({
    status: 'success',
    data: {
      assessment,
    },
  });
});

/**
 * Delete assessment
 */
const deleteAssessment = catchAsync(async (req, res) => {
  const { assessmentId } = req.params;
  await thyroidAssessmentService.deleteAssessment(assessmentId);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Get assessment statistics
 */
const getAssessmentStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const stats = await thyroidAssessmentService.getAssessmentStats(userId);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

/**
 * Submit reassessment (creates new assessment)
 */
const submitReassessment = catchAsync(async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;

  if (!answers) {
    return res.status(400).json({
      status: 'error',
      message: 'Answers are required',
    });
  }

  const assessment = await thyroidAssessmentService.createAssessment(userId, answers);

  res.status(201).json({
    status: 'success',
    data: {
      assessment,
    },
  });
});

/**
 * Calculate risk level without saving
 */
const calculateRiskLevel = catchAsync(async (req, res) => {
  const { answers } = req.body;

  if (!answers) {
    return res.status(400).json({
      status: 'error',
      message: 'Answers are required',
    });
  }

  const result = await thyroidAssessmentService.calculateRiskFromAnswers(answers);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Get risk level distribution for admin
 */
const getRiskLevelDistribution = catchAsync(async (req, res) => {
  const distribution = await thyroidAssessmentService.getRiskLevelDistribution();

  res.status(200).json({
    status: 'success',
    data: {
      distribution,
    },
  });
});

export const thyroidAssessmentController = {
  getAssessmentQuestions,
  createAssessment,
  getLatestAssessment,
  getAssessmentHistory,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  getAssessmentStats,
  submitReassessment,
  calculateRiskLevel,
  getRiskLevelDistribution,
};
