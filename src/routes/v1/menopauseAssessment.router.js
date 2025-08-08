import express from 'express';
import validate from '../../middlewares/validate.js';
import auth from '../../middlewares/auth.js';
import * as menopauseAssessmentValidation from '../../validations/menopauseAssessment.validation.js';
import { menopauseAssessmentController } from '../../controllers/menopauseAssessment.controller.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/questions', menopauseAssessmentController.getAssessmentQuestions);
router.post('/calculate-risk', validate(menopauseAssessmentValidation.calculateRisk), menopauseAssessmentController.calculateRiskLevel);

// Protected routes (authentication required)
router.use(auth());

// Assessment management
router.post('/', validate(menopauseAssessmentValidation.createAssessment), menopauseAssessmentController.createAssessment);
router.get('/latest', menopauseAssessmentController.getLatestAssessment);
router.get('/history', menopauseAssessmentController.getAssessmentHistory);
router.get('/stats', menopauseAssessmentController.getAssessmentStats);
router.get('/:assessmentId', validate(menopauseAssessmentValidation.getAssessment), menopauseAssessmentController.getAssessmentById);
router.put('/:assessmentId', validate(menopauseAssessmentValidation.updateAssessment), menopauseAssessmentController.updateAssessment);
router.delete('/:assessmentId', validate(menopauseAssessmentValidation.deleteAssessment), menopauseAssessmentController.deleteAssessment);

// Reassessment route (smart route that creates or updates)
router.post('/reassessment', validate(menopauseAssessmentValidation.submitReassessment), menopauseAssessmentController.submitReassessment);

export default router;
