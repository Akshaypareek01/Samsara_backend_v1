import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as doshaValidation from '../../validations/dosha.validation.js';
import * as doshaController from '../../controllers/dosha.controller.js';

const router = express.Router();

// Start assessment
router.post('/start', auth(), validate(doshaValidation.startAssessment), doshaController.startAssessment);

// Get questions for assessment type
router.get(
  '/questions/:assessmentType',
  validate(doshaValidation.getAssessmentQuestions),
  doshaController.getAssessmentQuestions
);

// Submit answer
router.post('/submit-answer', auth(), validate(doshaValidation.submitAnswer), doshaController.submitAnswer);

// Calculate dosha score
router.post(
  '/:assessmentId/calculate',
  auth(),
  validate(doshaValidation.calculateDoshaScore),
  doshaController.calculateDoshaScore
);

// Get all assessment results
router.get('/', auth(), validate(doshaValidation.getAssessmentResults), doshaController.getAssessmentResults);

// Get assessment by ID
router.get('/:assessmentId', auth(), validate(doshaValidation.getAssessmentById), doshaController.getAssessmentById);

export default router;
