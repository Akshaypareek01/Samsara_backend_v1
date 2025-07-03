import { QuestionMaster } from '../models/question-master.model.js';
import { AssessmentResult } from '../models/dosha.model.js';
import { ApiError } from '../utils/ApiError.js';
import httpStatus from 'http-status';

/**
 * Create a new question
 * @param {Object} questionBody
 * @returns {Promise<QuestionMaster>}
 */
export const createQuestion = async (questionBody) => {
  return QuestionMaster.create(questionBody);
};

/**
 * Get questions by filter
 * @param {Object} filter - Mongoose filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page
 * @param {number} [options.page] - Current page
 * @returns {Promise<QueryResult>}
 */
export const queryQuestions = async (filter, options) => {
  const questions = await QuestionMaster.paginate(filter, options);
  return questions;
};

/**
 * Get question by id
 * @param {ObjectId} id
 * @returns {Promise<QuestionMaster>}
 */
export const getQuestionById = async (id) => {
  return QuestionMaster.findById(id);
};

/**
 * Update question by id
 * @param {ObjectId} questionId
 * @param {Object} updateBody
 * @returns {Promise<QuestionMaster>}
 */
export const updateQuestionById = async (questionId, updateBody) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  Object.assign(question, updateBody);
  await question.save();
  return question;
};

/**
 * Delete question by id
 * @param {ObjectId} questionId
 * @returns {Promise<QuestionMaster>}
 */
export const deleteQuestionById = async (questionId) => {
  const question = await getQuestionById(questionId);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Question not found');
  }
  await question.remove();
  return question;
};

/**
 * Start a new assessment
 * @param {ObjectId} userId
 * @param {string} assessmentType
 * @returns {Promise<AssessmentResult>}
 */
export const startAssessment = async (userId, assessmentType) => {
  // Check if user already has an incomplete assessment of this type
  const existingAssessment = await AssessmentResult.findOne({
    userId,
    assessmentType,
    isCompleted: false
  });

  if (existingAssessment) {
    return existingAssessment;
  }

  return AssessmentResult.create({
    userId,
    assessmentType,
    answers: [],
    doshaScore: { vata: 0, pitta: 0, kapha: 0 },
    isCompleted: false
  });
};

/**
 * Submit an answer to an assessment
 * @param {ObjectId} assessmentId
 * @param {ObjectId} userId
 * @param {ObjectId} questionId
 * @param {number} selectedOptionIndex
 * @returns {Promise<AssessmentResult>}
 */
export const submitAnswer = async (assessmentId, userId, questionId, selectedOptionIndex) => {
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
    answer => answer.questionId.toString() === questionId.toString()
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
  return assessment;
};

/**
 * Calculate dosha scores and complete assessment
 * @param {ObjectId} assessmentId
 * @param {ObjectId} userId
 * @returns {Promise<AssessmentResult>}
 */
export const calculateDoshaScore = async (assessmentId, userId) => {
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
  return assessment;
};

/**
 * Get assessment results for a user
 * @param {ObjectId} userId
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
export const getAssessmentResults = async (userId, filter, options) => {
  const assessmentFilter = { userId, ...filter };
  const results = await AssessmentResult.paginate(assessmentFilter, {
    ...options,
    populate: 'answers.questionId',
    sortBy: 'submittedAt:desc'
  });
  return results;
};

/**
 * Get assessment by id
 * @param {ObjectId} assessmentId
 * @param {ObjectId} userId
 * @returns {Promise<AssessmentResult>}
 */
export const getAssessmentById = async (assessmentId, userId) => {
  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId
  }).populate('answers.questionId');

  if (!assessment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
  }

  return assessment;
};

/**
 * Get questions for a specific assessment type
 * @param {string} assessmentType
 * @returns {Promise<QuestionMaster[]>}
 */
export const getAssessmentQuestions = async (assessmentType) => {
  return QuestionMaster.find({
    assessmentType,
    isActive: true
  }).sort({ order: 1 });
};

/**
 * Get assessment statistics for a user
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
export const getAssessmentStats = async (userId) => {
  const stats = await AssessmentResult.aggregate([
    { $match: { userId } },
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

  return stats;
};

/**
 * Get dominant dosha from scores
 * @param {Object} doshaScore
 * @returns {string}
 */
export const getDominantDosha = (doshaScore) => {
  const scores = Object.entries(doshaScore);
  const maxScore = Math.max(...scores.map(([, score]) => score));
  const dominantDoshas = scores
    .filter(([, score]) => score === maxScore)
    .map(([dosha]) => dosha.charAt(0).toUpperCase() + dosha.slice(1));

  return dominantDoshas.length === 1 ? dominantDoshas[0] : dominantDoshas.join('-');
}; 