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
    
    validate(questionMasterValidation.createQuestion),
    questionMasterController.createQuestion
  )
  .get(
  
    validate(questionMasterValidation.getQuestions),
    questionMasterController.getQuestions
  );

router
  .route('/questions/bulk')
  .post(
    validate(questionMasterValidation.bulkCreateQuestions),
    questionMasterController.bulkCreateQuestions
  );

router
  .route('/questions/:questionId')
  .get(
    
    validate(questionMasterValidation.getQuestion),
    questionMasterController.getQuestionById
  )
  .patch(
    
    validate(questionMasterValidation.updateQuestion),
    questionMasterController.updateQuestion
  )
  .delete(
    
    validate(questionMasterValidation.getQuestion),
    questionMasterController.deleteQuestion
  );

router
  .route('/questions/:questionId/toggle')
  .patch(
  
    validate(questionMasterValidation.getQuestion),
    questionMasterController.toggleQuestionStatus
  );

// Assessment Routes (Users)
router
  .route('/assessments/start')
  .post(
  
    validate(questionMasterValidation.startAssessment),
    questionMasterController.startAssessment
  );

router
  .route('/assessments/submit-answer')
  .post(
    
    validate(questionMasterValidation.submitAnswer),
    questionMasterController.submitAnswer
  );

router
  .route('/assessments/:assessmentId/calculate')
  .post(
 
    validate(questionMasterValidation.getAssessment),
    questionMasterController.calculateDoshaScore
  );

router
  .route('/assessments')
  .get(
  
    validate(questionMasterValidation.getAssessmentResults),
    questionMasterController.getAssessmentResults
  );

router
  .route('/assessments/:assessmentId')
  .get(
  
    validate(questionMasterValidation.getAssessment),
    questionMasterController.getAssessmentById
  );

router
  .route('/questions/:assessmentType')
  .get(
   
    validate(questionMasterValidation.getAssessmentQuestions),
    questionMasterController.getAssessmentQuestions
  );

router
  .route('/assessments/stats')
  .get(
   
    questionMasterController.getAssessmentStats
  );

export default router; 