// assessmentRoutes.js
import express from 'express';
import {
  createAssessment,
  deleteAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
} from '../../controllers/assessment.controller.js';

const assessmentRouter = express.Router();

// Route for creating a new assessment
assessmentRouter.post('/', createAssessment);

// Route for getting all assessments
assessmentRouter.get('/', getAllAssessments);

// Route for getting an assessment by ID
assessmentRouter.get('/:assessmentId', getAssessmentById);

// Route for updating an assessment
assessmentRouter.put('/:assessmentId', updateAssessment);

// Route for deleting an assessment
assessmentRouter.delete('/:assessmentId', deleteAssessment);

// Additional routes for assessment-related functionalities can be added here

export default assessmentRouter;
