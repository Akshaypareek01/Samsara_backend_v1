import express from 'express';
import { dietGenerationController } from '../../controllers/dietGeneration.controller.js';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { dietGenerationValidation } from '../../validations/dietGeneration.validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth());

/**
 * @route   POST /v1/diet-generation/generate
 * @desc    Generate diet for authenticated user
 * @access  Private
 */
router.post(
    '/generate',
    validate(dietGenerationValidation.generateDiet),
    dietGenerationController.generateDiet
);

/**
 * @route   GET /v1/diet-generation/status
 * @desc    Get current diet generation status for user
 * @access  Private
 */
router.get(
    '/status',
    dietGenerationController.getDietGenerationStatus
);

/**
 * @route   GET /v1/diet-generation/history
 * @desc    Get diet generation history for user
 * @access  Private
 */
router.get(
    '/history',
    validate(dietGenerationValidation.getHistory),
    dietGenerationController.getDietGenerationHistory
);

/**
 * @route   GET /v1/diet-generation/download
 * @desc    Download latest generated diet PDF
 * @access  Private
 */
router.get(
    '/download',
    dietGenerationController.downloadLatestDiet
);

/**
 * @route   GET /v1/diet-generation/eligibility
 * @desc    Check if user can generate diet
 * @access  Private
 */
router.get(
    '/eligibility',
    dietGenerationController.checkEligibility
);

export default router;
