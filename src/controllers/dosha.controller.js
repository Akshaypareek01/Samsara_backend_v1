import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { AssessmentResult, QuestionMaster } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

// Helper function to calculate dosha scores and percentages
const calculateDoshaScores = async (answers, assessmentType) => {
  const doshaScore = { vata: 0, pitta: 0, kapha: 0 };

  for (const answer of answers) {
    if (answer.questionId && answer.selectedOptionIndex !== undefined) {
      let question;

      // Handle both populated and unpopulated questionId
      if (typeof answer.questionId === 'string' || answer.questionId._id) {
        // If questionId is a string (ObjectId) or has _id, fetch the question
        const questionId = typeof answer.questionId === 'string' ? answer.questionId : answer.questionId._id;
        question = await QuestionMaster.findById(questionId);
      } else {
        // If questionId is already populated
        question = answer.questionId;
      }

      if (question && question.options && question.options[answer.selectedOptionIndex]) {
        const selectedOption = question.options[answer.selectedOptionIndex];
        if (selectedOption && selectedOption.dosha) {
          const dosha = selectedOption.dosha.toLowerCase();
          
          // Different scoring logic based on assessment type
          if (assessmentType === 'Prakriti') {
            // Prakriti: Simple counting (constitutional assessment)
            doshaScore[dosha]++;
          } else if (assessmentType === 'Vikriti') {
            // Vikriti: Weighted scoring based on severity
            const severityWeight = selectedOption.severityWeight || 1;
            doshaScore[dosha] += severityWeight;
          }
        }
      }
    }
  }

  // Calculate percentages with proper rounding to ensure total = 100%
  const totalAnswers = answers.length;
  let doshaPercentages = { vata: 0, pitta: 0, kapha: 0 };

  if (totalAnswers > 0) {
    // Calculate raw percentages
    const rawPercentages = {
      vata: (doshaScore.vata / totalAnswers) * 100,
      pitta: (doshaScore.pitta / totalAnswers) * 100,
      kapha: (doshaScore.kapha / totalAnswers) * 100,
    };

    // Round to nearest integer
    const roundedPercentages = {
      vata: Math.round(rawPercentages.vata),
      pitta: Math.round(rawPercentages.pitta),
      kapha: Math.round(rawPercentages.kapha),
    };

    // Calculate the difference from 100%
    const totalRounded = roundedPercentages.vata + roundedPercentages.pitta + roundedPercentages.kapha;
    const difference = 100 - totalRounded;

    // If there's a difference, distribute it to the dosha with the largest decimal part
    if (difference !== 0) {
      const decimalParts = {
        vata: rawPercentages.vata - roundedPercentages.vata,
        pitta: rawPercentages.pitta - roundedPercentages.pitta,
        kapha: rawPercentages.kapha - roundedPercentages.kapha,
      };

      // Find the dosha with the largest decimal part (or smallest if difference is negative)
      let targetDosha = 'vata';
      let maxDecimal = decimalParts.vata;

      if (difference > 0) {
        // Need to add, so find largest decimal part
        if (decimalParts.pitta > maxDecimal) {
          maxDecimal = decimalParts.pitta;
          targetDosha = 'pitta';
        }
        if (decimalParts.kapha > maxDecimal) {
          maxDecimal = decimalParts.kapha;
          targetDosha = 'kapha';
        }
      } else {
        // Need to subtract, so find smallest decimal part (most negative)
        if (decimalParts.pitta < maxDecimal) {
          maxDecimal = decimalParts.pitta;
          targetDosha = 'pitta';
        }
        if (decimalParts.kapha < maxDecimal) {
          maxDecimal = decimalParts.kapha;
          targetDosha = 'kapha';
        }
      }

      // Apply the difference
      roundedPercentages[targetDosha] += difference;
    }

    doshaPercentages = roundedPercentages;
  }

  return { doshaScore, doshaPercentages };
};

// Start a new dosha assessment
export const startAssessment = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  const { assessmentType } = req.body;

  // Check for existing incomplete assessment
  const existing = await AssessmentResult.findOne({
    userId,
    assessmentType,
    isCompleted: false,
  });
  if (existing) return res.send(existing);

  const assessment = await AssessmentResult.create({
    userId,
    assessmentType,
    answers: [],
    doshaScore: { vata: 0, pitta: 0, kapha: 0 },
    doshaPercentages: { vata: 0, pitta: 0, kapha: 0 },
    isCompleted: false,
  });
  res.status(httpStatus.CREATED).send(assessment);
});

// Get questions for an assessment type (no userId needed)
export const getAssessmentQuestions = catchAsync(async (req, res) => {
  const { assessmentType } = req.params;
  const questions = await QuestionMaster.find({
    assessmentType,
    isActive: true,
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
    isCompleted: false,
  });

  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found or already completed');

  // Process each answer
  for (const answer of answers) {
    const { questionId, selectedOptionIndex } = answer;
    const idx = assessment.answers.findIndex((a) => a.questionId.toString() === questionId);
    if (idx !== -1) {
      assessment.answers[idx].selectedOptionIndex = selectedOptionIndex;
    } else {
      assessment.answers.push({ questionId, selectedOptionIndex });
    }
  }

  // Populate questionId before calculating scores
  await assessment.populate('answers.questionId');

  // Calculate dosha scores and percentages
  const { doshaScore, doshaPercentages } = await calculateDoshaScores(assessment.answers, assessment.assessmentType);
  assessment.doshaScore = doshaScore;
  assessment.doshaPercentages = doshaPercentages;

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
    isCompleted: false,
  }).populate('answers.questionId');
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found or already completed');

  // Calculate final dosha scores and percentages
  const { doshaScore, doshaPercentages } = await calculateDoshaScores(assessment.answers, assessment.assessmentType);
  assessment.doshaScore = doshaScore;
  assessment.doshaPercentages = doshaPercentages;
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
  const results = await AssessmentResult.find(filter).populate('answers.questionId').sort({ submittedAt: -1 });
  res.send(results);
});

// Get assessment by ID
export const getAssessmentById = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  const { assessmentId } = req.params;
  const assessment = await AssessmentResult.findOne({
    _id: assessmentId,
    userId,
  }).populate('answers.questionId');
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
  res.send(assessment);
});

// Get latest Prakriti and Vikriti assessment results for user
export const getLatestAssessmentResults = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');

  try {
    // Get latest Prakriti assessment
    const latestPrakriti = await AssessmentResult.findOne({
      userId,
      assessmentType: 'Prakriti',
      isCompleted: true
    })
      .populate('answers.questionId')
      .sort({ submittedAt: -1 });

    // Get latest Vikriti assessment
    const latestVikriti = await AssessmentResult.findOne({
      userId,
      assessmentType: 'Vikriti',
      isCompleted: true
    })
      .populate('answers.questionId')
      .sort({ submittedAt: -1 });

    // Prepare response
    const response = {
      prakriti: latestPrakriti ? {
        id: latestPrakriti._id,
        assessmentType: latestPrakriti.assessmentType,
        doshaScore: latestPrakriti.doshaScore,
        doshaPercentages: latestPrakriti.doshaPercentages,
        submittedAt: latestPrakriti.submittedAt,
        isCompleted: latestPrakriti.isCompleted,
        dominantDosha: getDominantDosha(latestPrakriti.doshaScore),
        explanation: "Your natural constitutional type (Prakriti) - shows your inherent body-mind nature"
      } : null,
      vikriti: latestVikriti ? {
        id: latestVikriti._id,
        assessmentType: latestVikriti.assessmentType,
        doshaScore: latestVikriti.doshaScore,
        doshaPercentages: latestVikriti.doshaPercentages,
        submittedAt: latestVikriti.submittedAt,
        isCompleted: latestVikriti.isCompleted,
        dominantDosha: getDominantDosha(latestVikriti.doshaScore),
        explanation: "Your current imbalances (Vikriti) - shows what's wrong now, weighted by severity"
      } : null,
      summary: {
        hasPrakriti: !!latestPrakriti,
        hasVikriti: !!latestVikriti,
        totalAssessments: (latestPrakriti ? 1 : 0) + (latestVikriti ? 1 : 0)
      }
    };

    res.send(response);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch latest assessment results');
  }
});

// Helper function to get dominant dosha
const getDominantDosha = (doshaScore) => {
  if (!doshaScore) return null;
  
  const scores = Object.entries(doshaScore);
  const dominant = scores.reduce((a, b) => a[1] > b[1] ? a : b);
  
  return {
    dosha: dominant[0],
    score: dominant[1],
    percentage: Math.round((dominant[1] / scores.reduce((sum, [, score]) => sum + score, 0)) * 100)
  };
};
