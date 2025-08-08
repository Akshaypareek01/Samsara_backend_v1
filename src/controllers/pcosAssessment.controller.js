import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { pcosAssessmentService } from '../services/pcosAssessment.service.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get PCOS assessment questions and options
 */
const getAssessmentQuestions = catchAsync(async (req, res) => {
    const questions = pcosAssessmentService.getAssessmentQuestions();
    res.status(httpStatus.OK).json({
        status: 'success',
        data: questions
    });
});

/**
 * Create a new PCOS assessment
 */
const createAssessment = catchAsync(async (req, res) => {
    const { answers } = req.body;
    const userId = req.user.id;

    // Validate required answers
    const requiredFields = [
        'lastCycleDate', 'cycleRegularity', 'periodDuration', 'menstrualFlow',
        'bloodColor', 'facialHair', 'weightGain', 'foodCravings', 'hormonalMedications',
        'periodPain', 'facialAcne', 'lowLibido', 'hairLoss', 'darkSkinPatches', 'difficultyConceiving'
    ];
    
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    const assessment = await pcosAssessmentService.createAssessment(userId, answers);
    
    res.status(httpStatus.CREATED).json({
        status: 'success',
        message: 'PCOS assessment created successfully',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription,
                recommendations: assessment.recommendations,
                cycleLength: assessment.cycleLength
            }
        }
    });
});

/**
 * Get latest assessment for the authenticated user
 */
const getLatestAssessment = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const assessment = await pcosAssessmentService.getLatestAssessment(userId);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription,
                recommendations: assessment.recommendations,
                cycleLength: assessment.cycleLength
            }
        }
    });
});

/**
 * Get assessment history for the authenticated user
 */
const getAssessmentHistory = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, riskLevel } = req.query;
    
    const filter = {};
    if (riskLevel) {
        filter.riskLevel = riskLevel;
    }
    
    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
    };
    
    const results = await pcosAssessmentService.getAssessmentHistory(userId, filter, options);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: results
    });
});

/**
 * Get assessment by ID
 */
const getAssessmentById = catchAsync(async (req, res) => {
    const { assessmentId } = req.params;
    const userId = req.user.id;
    
    const assessment = await pcosAssessmentService.getAssessmentById(assessmentId, userId);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription,
                recommendations: assessment.recommendations,
                cycleLength: assessment.cycleLength
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
    const requiredFields = [
        'lastCycleDate', 'cycleRegularity', 'periodDuration', 'menstrualFlow',
        'bloodColor', 'facialHair', 'weightGain', 'foodCravings', 'hormonalMedications',
        'periodPain', 'facialAcne', 'lowLibido', 'hairLoss', 'darkSkinPatches', 'difficultyConceiving'
    ];
    
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    const assessment = await pcosAssessmentService.updateAssessment(assessmentId, userId, answers);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Assessment updated successfully',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription,
                recommendations: assessment.recommendations,
                cycleLength: assessment.cycleLength
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
    
    const result = await pcosAssessmentService.deleteAssessment(assessmentId, userId);
    
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
    const stats = await pcosAssessmentService.getAssessmentStats(userId);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: stats
    });
});

/**
 * Submit reassessment (creates new assessment)
 */
const submitReassessment = catchAsync(async (req, res) => {
    const { answers } = req.body;
    const userId = req.user.id;

    // Validate required answers
    const requiredFields = [
        'lastCycleDate', 'cycleRegularity', 'periodDuration', 'menstrualFlow',
        'bloodColor', 'facialHair', 'weightGain', 'foodCravings', 'hormonalMedications',
        'periodPain', 'facialAcne', 'lowLibido', 'hairLoss', 'darkSkinPatches', 'difficultyConceiving'
    ];
    
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    const assessment = await pcosAssessmentService.createAssessment(userId, answers);
    
    res.status(httpStatus.CREATED).json({
        status: 'success',
        message: 'Reassessment submitted successfully',
        data: {
            assessment,
            summary: {
                totalScore: assessment.totalScore,
                riskLevel: assessment.riskLevel,
                riskDescription: assessment.riskDescription,
                recommendations: assessment.recommendations,
                cycleLength: assessment.cycleLength
            }
        }
    });
});

/**
 * Calculate risk level from answers (without saving)
 */
const calculateRiskLevel = catchAsync(async (req, res) => {
    const { answers } = req.body;

    // Validate required answers
    const requiredFields = [
        'lastCycleDate', 'cycleRegularity', 'periodDuration', 'menstrualFlow',
        'bloodColor', 'facialHair', 'weightGain', 'foodCravings', 'hormonalMedications',
        'periodPain', 'facialAcne', 'lowLibido', 'hairLoss', 'darkSkinPatches', 'difficultyConceiving'
    ];
    
    const missingFields = requiredFields.filter(field => !answers[field]);
    
    if (missingFields.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Missing required answers: ${missingFields.join(', ')}`);
    }

    const riskAssessment = await pcosAssessmentService.calculateRiskFromAnswers(answers);
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: riskAssessment
    });
});

/**
 * Get risk level distribution for all users (admin only)
 */
const getRiskLevelDistribution = catchAsync(async (req, res) => {
    // This would require admin privileges - you can add auth middleware
    const distribution = await pcosAssessmentService.getRiskLevelDistribution();
    
    res.status(httpStatus.OK).json({
        status: 'success',
        data: distribution
    });
});

export const pcosAssessmentController = {
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
    getRiskLevelDistribution
};
