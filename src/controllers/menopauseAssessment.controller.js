import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { menopauseAssessmentService } from '../services/menopauseAssessment.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get menopause assessment questions and options
 */
const getAssessmentQuestions = catchAsync(async (req, res) => {
    const questions = menopauseAssessmentService.getAssessmentQuestions();
    res.status(httpStatus.OK).json({
        status: 'success',
        data: questions
    });
});

/**
 * Create a new menopause assessment
 */
const createAssessment = catchAsync(async (req, res) => {
    const { answers } = req.body;
    const userId = req.user.id;

    // Validate required answers
    const requiredFields = ['irregularPeriods', 'fatigue', 'weightChanges', 'sleepQuality', 'moodSwings'];
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    const assessment = await menopauseAssessmentService.createAssessment(userId, { answers });
    
    res.status(httpStatus.CREATED).json({
        status: 'success',
        message: 'Assessment created successfully',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                averageScore: assessment.averageScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription
            }
        }
    });
});

/**
 * Get latest assessment for the authenticated user
 */
const getLatestAssessment = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const assessment = await menopauseAssessmentService.getLatestAssessment(userId);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                averageScore: assessment.averageScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription
            }
        }
    });
});

/**
 * Get assessment history for the authenticated user
 */
const getAssessmentHistory = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.query;
    
    const result = await menopauseAssessmentService.getAssessmentHistory(userId, { page, limit });
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: {
            assessments: result.assessments,
            pagination: result.pagination
        }
    });
});

/**
 * Get specific assessment by ID
 */
const getAssessmentById = catchAsync(async (req, res) => {
    const { assessmentId } = req.params;
    const userId = req.user.id;
    
    const assessment = await menopauseAssessmentService.getAssessmentById(assessmentId, userId);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                averageScore: assessment.averageScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription
            }
        }
    });
});

/**
 * Update existing assessment (reassessment)
 */
const updateAssessment = catchAsync(async (req, res) => {
    const { assessmentId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    // Validate required answers
    const requiredFields = ['irregularPeriods', 'fatigue', 'weightChanges', 'sleepQuality', 'moodSwings'];
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    const assessment = await menopauseAssessmentService.updateAssessment(assessmentId, userId, { answers });
    
    res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Assessment updated successfully',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                averageScore: assessment.averageScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription
            }
        }
    });
});

/**
 * Delete assessment
 */
const deleteAssessment = catchAsync(async (req, res) => {
    const { assessmentId } = req.params;
    const userId = req.user.id;
    
    const result = await menopauseAssessmentService.deleteAssessment(assessmentId, userId);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        message: result.message
    });
});

/**
 * Get assessment statistics for the authenticated user
 */
const getAssessmentStats = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const stats = await menopauseAssessmentService.getAssessmentStats(userId);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: stats
    });
});

/**
 * Submit reassessment (creates new assessment or updates latest)
 */
const submitReassessment = catchAsync(async (req, res) => {
    const { answers } = req.body;
    const userId = req.user.id;

    // Validate required answers
    const requiredFields = ['irregularPeriods', 'fatigue', 'weightChanges', 'sleepQuality', 'moodSwings'];
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    // Check if user has existing assessment
    try {
        const existingAssessment = await menopauseAssessmentService.getLatestAssessment(userId);
        
        // Update existing assessment
        const assessment = await menopauseAssessmentService.updateAssessment(
            existingAssessment._id, 
            userId, 
            { answers }
        );
        
        res.status(httpStatus.OK).json({
            status: 'success',
            message: 'Reassessment submitted successfully',
            data: {
                assessment,
                summary: {
                    totalScore: assessment.totalScore,
                    averageScore: assessment.averageScore,
                    riskLevel: assessment.riskLevel,
                    riskDescription: assessment.riskDescription
                }
            }
        });
    } catch (error) {
        if (error.statusCode === 404) {
            // No existing assessment, create new one
            const assessment = await menopauseAssessmentService.createAssessment(userId, { answers });
            
            res.status(httpStatus.CREATED).json({
                status: 'success',
                message: 'Assessment created successfully',
                data: {
                    assessment,
                    summary: {
                        totalScore: assessment.totalScore,
                        averageScore: assessment.averageScore,
                        riskLevel: assessment.riskLevel,
                        riskDescription: assessment.riskDescription
                    }
                }
            });
        } else {
            throw error;
        }
    }
});

/**
 * Get risk level directly from answers (without saving)
 */
const calculateRiskLevel = catchAsync(async (req, res) => {
    const { answers } = req.body;

    // Validate required answers
    const requiredFields = ['irregularPeriods', 'fatigue', 'weightChanges', 'sleepQuality', 'moodSwings'];
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    // Create temporary assessment to calculate scores
    const tempAssessment = new (await import('../models/menopause-assessment.model.js')).MenopauseAssessment({
        userId: 'temp',
        answers
    });

    // Calculate scores manually
    const scores = {
        irregularPeriodsScore: tempAssessment.getScoreForAnswer(answers.irregularPeriods),
        fatigueScore: tempAssessment.getScoreForAnswer(answers.fatigue),
        weightChangesScore: tempAssessment.getScoreForAnswer(answers.weightChanges),
        sleepQualityScore: tempAssessment.getScoreForAnswer(answers.sleepQuality),
        moodSwingsScore: tempAssessment.getScoreForAnswer(answers.moodSwings)
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / 5;
    const { riskLevel, riskDescription } = tempAssessment.calculateRiskLevel(averageScore);

    res.status(httpStatus.OK).json({
        status: 'success',
        data: {
            scores,
            totalScore,
            averageScore,
            riskLevel,
            riskDescription
        }
    });
});

export const menopauseAssessmentController = {
    getAssessmentQuestions,
    createAssessment,
    getLatestAssessment,
    getAssessmentHistory,
    getAssessmentById,
    updateAssessment,
    deleteAssessment,
    getAssessmentStats,
    submitReassessment,
    calculateRiskLevel
};
