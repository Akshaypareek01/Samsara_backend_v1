import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as questionMasterValidation from '../../validations/questionMaster.validation.js';
import * as questionMasterController from '../../controllers/questionMaster.controller.js';

const router = express.Router();

// Question Master Routes (Admin only)
router
  .route('/questions')
  .post(
    auth('manageQuestions'),
    validate(questionMasterValidation.createQuestion),
    questionMasterController.createQuestion
  )
  .get(
    auth('getQuestions'),
    validate(questionMasterValidation.getQuestions),
    questionMasterController.getQuestions
  );

router
  .route('/questions/:questionId')
  .get(
    auth('getQuestions'),
    validate(questionMasterValidation.getQuestion),
    questionMasterController.getQuestionById
  )
  .patch(
    auth('manageQuestions'),
    validate(questionMasterValidation.updateQuestion),
    questionMasterController.updateQuestion
  )
  .delete(
    auth('manageQuestions'),
    validate(questionMasterValidation.getQuestion),
    questionMasterController.deleteQuestion
  );

router
  .route('/questions/:questionId/toggle')
  .patch(
    auth('manageQuestions'),
    validate(questionMasterValidation.getQuestion),
    questionMasterController.toggleQuestionStatus
  );

// Assessment Routes (Users)
router
  .route('/assessments/start')
  .post(
    auth(),
    validate(questionMasterValidation.startAssessment),
    questionMasterController.startAssessment
  );

router
  .route('/assessments/submit-answer')
  .post(
    auth(),
    validate(questionMasterValidation.submitAnswer),
    questionMasterController.submitAnswer
  );

router
  .route('/assessments/:assessmentId/calculate')
  .post(
    auth(),
    validate(questionMasterValidation.getAssessment),
    questionMasterController.calculateDoshaScore
  );

router
  .route('/assessments')
  .get(
    auth(),
    validate(questionMasterValidation.getAssessmentResults),
    questionMasterController.getAssessmentResults
  );

router
  .route('/assessments/:assessmentId')
  .get(
    auth(),
    validate(questionMasterValidation.getAssessment),
    questionMasterController.getAssessmentById
  );

router
  .route('/questions/:assessmentType')
  .get(
    auth(),
    validate(questionMasterValidation.getAssessmentQuestions),
    questionMasterController.getAssessmentQuestions
  );

router
  .route('/assessments/stats')
  .get(
    auth(),
    questionMasterController.getAssessmentStats
  );

export default router; 