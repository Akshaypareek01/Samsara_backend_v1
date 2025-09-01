import express from 'express';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import * as thyroidAssessmentValidation from '../../validations/thyroidAssessment.validation.js';
import { thyroidAssessmentController } from '../../controllers/thyroidAssessment.controller.js';

const router = express.Router();

// Public route - Get assessment questions (no auth required)
router.get('/questions', thyroidAssessmentController.getAssessmentQuestions);

// Protected routes - require authentication
router.use(auth());

// Create new assessment
router.post('/', validate(thyroidAssessmentValidation.createAssessment), thyroidAssessmentController.createAssessment);

// Get latest assessment for user
router.get('/latest', thyroidAssessmentController.getLatestAssessment);

// Get assessment history with pagination and filtering
router.get(
  '/history',
  validate(thyroidAssessmentValidation.getAssessmentHistory),
  thyroidAssessmentController.getAssessmentHistory
);

// Get assessment statistics
router.get('/stats', thyroidAssessmentController.getAssessmentStats);

// Calculate risk level without saving
router.post(
  '/calculate-risk',
  validate(thyroidAssessmentValidation.calculateRisk),
  thyroidAssessmentController.calculateRiskLevel
);

// Submit reassessment (creates new assessment)
router.post(
  '/reassessment',
  validate(thyroidAssessmentValidation.submitReassessment),
  thyroidAssessmentController.submitReassessment
);

// Get specific assessment by ID
router.get(
  '/:assessmentId',
  validate(thyroidAssessmentValidation.getAssessment),
  thyroidAssessmentController.getAssessmentById
);

// Update existing assessment
router.put(
  '/:assessmentId',
  validate(thyroidAssessmentValidation.updateAssessment),
  thyroidAssessmentController.updateAssessment
);

// Delete assessment
router.delete(
  '/:assessmentId',
  validate(thyroidAssessmentValidation.deleteAssessment),
  thyroidAssessmentController.deleteAssessment
);

export default router;
