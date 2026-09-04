// assessmentRoutes.js
import express from 'express';
import {
  createAssessment,
  deleteAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
} from '../../controllers/assessment.controller.js';
import auth from '../../middlewares/auth.js';

const assessmentRouter = express.Router();

// Writes are admin-only. GETs stay public.
assessmentRouter.post('/', auth('admin'), createAssessment);

// Route for getting all assessments
assessmentRouter.get('/', getAllAssessments);

// Route for getting an assessment by ID
assessmentRouter.get('/:assessmentId', getAssessmentById);

// Route for updating an assessment
assessmentRouter.put('/:assessmentId', auth('admin'), updateAssessment);

// Route for deleting an assessment
assessmentRouter.delete('/:assessmentId', auth('admin'), deleteAssessment);

// Additional routes for assessment-related functionalities can be added here

export default assessmentRouter;
