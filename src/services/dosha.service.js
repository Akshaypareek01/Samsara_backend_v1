import { AssessmentResult, QuestionMaster } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

export const startAssessment = async (userId, assessmentType) => {
  const existing = await AssessmentResult.findOne({ userId, assessmentType, isCompleted: false });
  if (existing) return existing;
  return AssessmentResult.create({
    userId,
    assessmentType,
    answers: [],
    doshaScore: { vata: 0, pitta: 0, kapha: 0 },
    isCompleted: false
  });
};

export const getAssessmentQuestions = async (assessmentType) => {
  return QuestionMaster.find({ assessmentType, isActive: true }).sort({ order: 1 });
};

export const submitAnswer = async (assessmentId, userId, questionId, selectedOptionIndex) => {
  const assessment = await AssessmentResult.findOne({ _id: assessmentId, userId, isCompleted: false });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found or already completed');
  const idx = assessment.answers.findIndex(a => a.questionId.toString() === questionId);
  if (idx !== -1) {
    assessment.answers[idx].selectedOptionIndex = selectedOptionIndex;
  } else {
    assessment.answers.push({ questionId, selectedOptionIndex });
  }
  await assessment.save();
  return assessment;
};

export const calculateDoshaScore = async (assessmentId, userId) => {
  const assessment = await AssessmentResult.findOne({ _id: assessmentId, userId, isCompleted: false }).populate('answers.questionId');
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
  return assessment;
};

export const getAssessmentResults = async (userId, assessmentType) => {
  const filter = { userId };
  if (assessmentType) filter.assessmentType = assessmentType;
  return AssessmentResult.find(filter).populate('answers.questionId').sort({ submittedAt: -1 });
};

export const getAssessmentById = async (assessmentId, userId) => {
  const assessment = await AssessmentResult.findOne({ _id: assessmentId, userId }).populate('answers.questionId');
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
  return assessment;
}; 