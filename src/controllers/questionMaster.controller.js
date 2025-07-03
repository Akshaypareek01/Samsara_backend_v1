import { QuestionMaster } from '../models/questionMaster.model.js';
import { AssessmentResult } from '../models/dosha.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

// Question Master Controllers
export const createQuestion = catchAsync(async (req, res) => {
  const question = await QuestionMaster.create(req.body);
  res.status(httpStatus.CREATED).send(question);
});

export const getQuestions = catchAsync(async (req, res) => {
  const { assessmentType, isActive } = req.query;
  const filter = {};
  
  if (assessmentType) filter.assessmentType = assessmentType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  
  const questions = await QuestionMaster.find(filter).sort({ order: 1 });
  res.send(questions);
});

export const getQuestionById = catchAsync(async (req, res) => {
  const question = await QuestionMaster.findById(req.params.questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  res.send(question);
});

export const updateQuestion = catchAsync(async (req, res) => {
  const question = await QuestionMaster.findByIdAndUpdate(
    req.params.questionId,
    req.body,
    { new: true, runValidators: true }
  );
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  res.send(question);
});

export const deleteQuestion = catchAsync(async (req, res) => {
  const question = await QuestionMaster.findByIdAndDelete(req.params.questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  res.status(httpStatus.NO_CONTENT).send();
});

export const toggleQuestionStatus = catchAsync(async (req, res) => {
  const question = await QuestionMaster.findById(req.params.questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  
  question.isActive = !question.isActive;
  await question.save();
  res.send(question);
});

// Assessment Result Controllers
export const startAssessment = catchAsync(async (req, res) => {
  const { assessmentType } = req.body;
  const userId = req.user.id;
  
  // Check if user already has an incomplete assessment of this type
  const existingAssessment = await AssessmentResult.findOne({
    userId,
    assessmentType,
    isCompleted: false
  });
  
  if (existingAssessment) {
    return res.send(existingAssessment);
  }
  
  const assessment = await AssessmentResult.create({
    userId,
    assessmentType,
    answers: [],
    doshaScore: { vata: 0, pitta: 0, kapha: 0 },
    isCompleted: false
  });
  
  res.status(httpStatus.CREATED).send(assessment);
});

export const submitAnswer = catchAsync(async (req, res) => {
  const { assessmentId, questionId, selectedOptionIndex } = req.body;
  const userId = req.user.id;
  
  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId,
    isCompleted: false
  });
  
  if (!assessment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found or already completed');
  }
  
  // Check if answer already exists for this question
  const existingAnswerIndex = assessment.answers.findIndex(
    answer => answer.questionId.toString() === questionId
  );
  
  if (existingAnswerIndex !== -1) {
    // Update existing answer
    assessment.answers[existingAnswerIndex].selectedOptionIndex = selectedOptionIndex;
  } else {
    // Add new answer
    assessment.answers.push({
      questionId,
      selectedOptionIndex
    });
  }
  
  await assessment.save();
  res.send(assessment);
});

export const calculateDoshaScore = catchAsync(async (req, res) => {
  const { assessmentId } = req.params;
  const userId = req.user.id;
  
  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId,
    isCompleted: false
  }).populate('answers.questionId');
  
  if (!assessment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found or already completed');
  }
  
  // Calculate dosha scores
  const doshaScore = { vata: 0, pitta: 0, kapha: 0 };
  
  for (const answer of assessment.answers) {
    if (answer.questionId && answer.selectedOptionIndex !== undefined) {
      const question = answer.questionId;
      const selectedOption = question.options[answer.selectedOptionIndex];
      
      if (selectedOption && selectedOption.dosha) {
        doshaScore[selectedOption.dosha.toLowerCase()]++;
      }
    }
  }
  
  // Update assessment with scores and mark as completed
  assessment.doshaScore = doshaScore;
  assessment.isCompleted = true;
  assessment.submittedAt = new Date();
  
  await assessment.save();
  res.send(assessment);
});

export const getAssessmentResults = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { assessmentType } = req.query;
  
  const filter = { userId };
  if (assessmentType) filter.assessmentType = assessmentType;
  
  const results = await AssessmentResult.find(filter)
    .populate('answers.questionId')
    .sort({ submittedAt: -1 });
  
  res.send(results);
});

export const getAssessmentById = catchAsync(async (req, res) => {
  const { assessmentId } = req.params;
  const userId = req.user.id;
  
  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId
  }).populate('answers.questionId');
  
  if (!assessment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
  }
  
  res.send(assessment);
});

export const getAssessmentQuestions = catchAsync(async (req, res) => {
  const { assessmentType } = req.params;
  
  const questions = await QuestionMaster.find({
    assessmentType,
    isActive: true
  }).sort({ order: 1 });
  
  res.send(questions);
});

export const getAssessmentStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const stats = await AssessmentResult.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$assessmentType',
        count: { $sum: 1 },
        completedCount: {
          $sum: { $cond: ['$isCompleted', 1, 0] }
        },
        latestAssessment: { $max: '$submittedAt' }
      }
    }
  ]);
  
  res.send(stats);
}); 