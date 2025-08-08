import express from 'express';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import * as pcosAssessmentValidation from '../../validations/pcosAssessment.validation.js';
import { pcosAssessmentController } from '../../controllers/pcosAssessment.controller.js';

const router = express.Router();

// Public route - Get assessment questions (no auth required)
router.get('/questions', pcosAssessmentController.getAssessmentQuestions);

// Protected routes - require authentication
router.use(auth());

// Create new assessment
router.post(
    '/',
    validate(pcosAssessmentValidation.createAssessment),
    pcosAssessmentController.createAssessment
);

// Get latest assessment for user
router.get('/latest', pcosAssessmentController.getLatestAssessment);

// Get assessment history with pagination and filtering
router.get(
    '/history',
    validate(pcosAssessmentValidation.getAssessmentHistory),
    pcosAssessmentController.getAssessmentHistory
);

// Get assessment statistics
router.get('/stats', pcosAssessmentController.getAssessmentStats);

// Calculate risk level without saving
router.post(
    '/calculate-risk',
    validate(pcosAssessmentValidation.calculateRisk),
    pcosAssessmentController.calculateRiskLevel
);

// Submit reassessment (creates new assessment)
router.post(
    '/reassessment',
    validate(pcosAssessmentValidation.submitReassessment),
    pcosAssessmentController.submitReassessment
);

// Get specific assessment by ID
router.get(
    '/:assessmentId',
    validate(pcosAssessmentValidation.getAssessment),
    pcosAssessmentController.getAssessmentById
);

// Update existing assessment
router.put(
    '/:assessmentId',
    validate(pcosAssessmentValidation.updateAssessment),
    pcosAssessmentController.updateAssessment
);

// Delete assessment
router.delete(
    '/:assessmentId',
    validate(pcosAssessmentValidation.deleteAssessment),
    pcosAssessmentController.deleteAssessment
);

export default router;
