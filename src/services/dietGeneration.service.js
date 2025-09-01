import { DietGeneration, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import axios from 'axios';
import config from '../config/config.js';

/**
 * Check if user can generate diet
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Can generate status and remaining days
 */
const checkDietGenerationEligibility = async (userId) => {
    const eligibility = await DietGeneration.canUserGenerateDiet(userId);
    return eligibility;
};

/**
 * Generate diet using AI model
 * @param {Object} userData - User information for diet generation
 * @returns {Promise<Object>} - Generated diet data and PDF URL
 */
const generateDietFromAI = async (userData) => {
    try {
        const dietUrl = config.dietModelUrl || 'http://localhost:3002/';
        const response = await axios.post(`${dietUrl}/generate-diet-from-node-data`, userData, {
            timeout: 300000, // 5 minutes timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status !== 200) {
            throw new ApiError(500, 'Failed to generate diet from AI model');
        }
         console.log("response.data from ai model =====> ",response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new ApiError(error.response.status, `AI Model Error: ${error.response.data?.message || 'Unknown error'}`);
        }
        throw new ApiError(500, `AI Model Connection Error: ${error.message}`);
    }
};

/**
 * Create diet generation record
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Created diet generation record
 */
const createDietGenerationRecord = async (userId) => {
    return await DietGeneration.createDietGeneration(userId);
};

/**
 * Update diet generation with results
 * @param {string} generationId - Diet generation record ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated record
 */
const updateDietGeneration = async (generationId, updateData) => {
    return await DietGeneration.findByIdAndUpdate(
        generationId,
        updateData,
        { new: true, runValidators: true }
    );
};

/**
 * Get user's diet generation history
 * @param {string} userId - User ID
 * @param {Object} filter - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated diet generation history
 */
const getDietGenerationHistory = async (userId, filter, options) => {
    const filterQuery = { userId, ...filter };
    return await DietGeneration.paginate(filterQuery, options);
};

/**
 * Get latest diet generation for user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Latest diet generation record
 */
const getLatestDietGeneration = async (userId) => {
    return await DietGeneration.findOne(
        { userId },
        {},
        { sort: { generatedAt: -1 } }
    );
};

/**
 * Process diet generation request
 * @param {string} userId - User ID
 * @param {Object} userData - User data for diet generation
 * @returns {Promise<Object>} - Generation result
 */
const processDietGeneration = async (userId, userData) => {
    // Check eligibility - COMMENTED OUT FOR TESTING
    // const eligibility = await checkDietGenerationEligibility(userId);
    
    // if (!eligibility.canGenerate) {
    //     throw new ApiError(429, `Diet generation not allowed yet. Please wait ${eligibility.remainingDays} more days.`);
    // }

    // Create generation record
    const generationRecord = await createDietGenerationRecord(userId);

    try {
        // Generate diet from AI model
        const aiResponse = await generateDietFromAI(userData);
        
        // Update record with success
        const updatedRecord = await updateDietGeneration(generationRecord._id, {
            status: 'generated',
            dietData: aiResponse.plan || aiResponse.dietData || aiResponse,
            pdfUrl: aiResponse.pdfUrl || aiResponse.downloadUrl,
            generationAttempts: generationRecord.generationAttempts + 1
        });

        return {
            success: true,
            message: 'Diet generated successfully',
            data: updatedRecord,
            nextGenerationDate: updatedRecord.nextGenerationDate
        };

    } catch (error) {
        // Update record with failure
        await updateDietGeneration(generationRecord._id, {
            status: 'failed',
            errorMessage: error.message,
            generationAttempts: generationRecord.generationAttempts + 1
        });

        throw error;
    }
};

/**
 * Get diet generation status for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Current generation status
 */
const getDietGenerationStatus = async (userId) => {
    const eligibility = await checkDietGenerationEligibility(userId);
    const latestGeneration = await getLatestDietGeneration(userId);

    return {
        canGenerate: eligibility.canGenerate,
        remainingDays: eligibility.remainingDays,
        lastGeneration: latestGeneration ? {
            generatedAt: latestGeneration.generatedAt,
            status: latestGeneration.status,
            pdfUrl: latestGeneration.pdfUrl
        } : null,
        nextGenerationDate: latestGeneration?.nextGenerationDate || null
    };
};

export const dietGenerationService = {
    checkDietGenerationEligibility,
    generateDietFromAI,
    createDietGenerationRecord,
    updateDietGeneration,
    getDietGenerationHistory,
    getLatestDietGeneration,
    processDietGeneration,
    getDietGenerationStatus
};
