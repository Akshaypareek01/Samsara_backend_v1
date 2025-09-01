import catchAsync from '../utils/catchAsync.js';
import { dietGenerationService } from '../services/dietGeneration.service.js';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Generate diet for user
 * POST /v1/diet-generation/generate
 */
const generateDiet = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    // Get user data for diet generation
    const user = await User.findById(userId).select('name age gender height weight targetWeight bodyshape focusarea goal health_issues');
    
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Prepare user data for AI model
    const userData = {
        name: user.name,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        targetWeight: user.targetWeight,
        bodyShape: user.bodyshape,
        focusAreas: user.focusarea,
        goals: user.goal,
        healthIssues: user.health_issues,
        // Add any additional fields from request body
        ...req.body
    };

    const result = await dietGenerationService.processDietGeneration(userId, userData);
    
    res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
            generationId: result.data._id,
            nextGenerationDate: result.nextGenerationDate,
            pdfUrl: result.data.pdfUrl,
            status: result.data.status
        }
    });
});

/**
 * Get diet generation status for user
 * GET /v1/diet-generation/status
 */
const getDietGenerationStatus = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const status = await dietGenerationService.getDietGenerationStatus(userId);
    
    res.status(200).json({
        status: 'success',
        data: status
    });
});

/**
 * Get diet generation history for user
 * GET /v1/diet-generation/history
 */
const getDietGenerationHistory = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { generatedAt: -1 }
    };
    
    const history = await dietGenerationService.getDietGenerationHistory(userId, filter, options);
    
    res.status(200).json({
        status: 'success',
        data: history
    });
});

/**
 * Download latest diet PDF
 * GET /v1/diet-generation/download
 */
const downloadLatestDiet = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const latestGeneration = await dietGenerationService.getLatestDietGeneration(userId);
    
    if (!latestGeneration || latestGeneration.status !== 'generated') {
        throw new ApiError(404, 'No generated diet found for download');
    }
    
    if (!latestGeneration.pdfUrl) {
        throw new ApiError(404, 'PDF not available for this diet generation');
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            pdfUrl: latestGeneration.pdfUrl,
            generatedAt: latestGeneration.generatedAt,
            nextGenerationDate: latestGeneration.nextGenerationDate
        }
    });
});

/**
 * Check diet generation eligibility
 * GET /v1/diet-generation/eligibility
 */
const checkEligibility = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const eligibility = await dietGenerationService.checkDietGenerationEligibility(userId);
    
    res.status(200).json({
        status: 'success',
        data: {
            canGenerate: eligibility.canGenerate,
            remainingDays: eligibility.remainingDays,
            lastGeneration: eligibility.lastGeneration ? {
                generatedAt: eligibility.lastGeneration.generatedAt,
                status: eligibility.lastGeneration.status
            } : null
        }
    });
});

export const dietGenerationController = {
    generateDiet,
    getDietGenerationStatus,
    getDietGenerationHistory,
    downloadLatestDiet,
    checkEligibility
};
