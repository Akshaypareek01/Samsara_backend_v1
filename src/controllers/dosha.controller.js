import { AssessmentResult, QuestionMaster } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

// Start a new dosha assessment
export const startAssessment = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  const { assessmentType } = req.body;

  // Check for existing incomplete assessment
  const existing = await AssessmentResult.findOne({
    userId,
    assessmentType,
    isCompleted: false
  });
  if (existing) return res.send(existing);

  const assessment = await AssessmentResult.create({
    userId,
    assessmentType,
    answers: [],
    doshaScore: { vata: 0, pitta: 0, kapha: 0 },
    isCompleted: false
  });
  res.status(httpStatus.CREATED).send(assessment);
});

// Get questions for an assessment type (no userId needed)
export const getAssessmentQuestions = catchAsync(async (req, res) => {
  const { assessmentType } = req.params;
  const questions = await QuestionMaster.find({
    assessmentType,
    isActive: true
  }).sort({ order: 1 });
  res.send(questions);
});

// Submit multiple answers to an assessment
export const submitAnswer = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  const { assessmentId, answers } = req.body;
  
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'answers must be a non-empty array');
  }

  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId,
    isCompleted: false
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found or already completed');

  // Process each answer
  for (const answer of answers) {
    const { questionId, selectedOptionIndex } = answer;
    const idx = assessment.answers.findIndex(a => a.questionId.toString() === questionId);
    if (idx !== -1) {
      assessment.answers[idx].selectedOptionIndex = selectedOptionIndex;
    } else {
      assessment.answers.push({ questionId, selectedOptionIndex });
    }
  }
  
  await assessment.save();
  res.send(assessment);
});

// Calculate dosha score and complete assessment
export const calculateDoshaScore = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  const { assessmentId } = req.params;
  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId,
    isCompleted: false
  }).populate('answers.questionId');
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found or already completed');
  const doshaScore = { vata: 0, pitta: 0, kapha: 0 };
  for (const answer of assessment.answers) {
    if (answer.questionId && answer.selectedOptionIndex !== undefined) {
      const q = answer.questionId;
      const opt = q.options[answer.selectedOptionIndex];
      if (opt && opt.dosha) doshaScore[opt.dosha.toLowerCase()]++;
    }
  }
  assessment.doshaScore = doshaScore;
  assessment.isCompleted = true;
  assessment.submittedAt = new Date();
  await assessment.save();
  res.send(assessment);
});

// Get all assessment results for user
export const getAssessmentResults = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  const { assessmentType } = req.query;
  const filter = { userId };
  if (assessmentType) filter.assessmentType = assessmentType;
  const results = await AssessmentResult.find(filter)
    .populate('answers.questionId')
    .sort({ submittedAt: -1 });
  res.send(results);
});

// Get assessment by ID
export const getAssessmentById = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  const { assessmentId } = req.params;
  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId
  }).populate('answers.questionId');
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
  res.send(assessment);
}); 