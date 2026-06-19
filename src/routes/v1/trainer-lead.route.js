import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as trainerLeadValidation from '../../validations/trainer-lead.validation.js';
import * as trainerLeadController from '../../controllers/trainer-lead.controller.js';

const router = express.Router();

// Create a trainer lead (Public - no authentication required; quick/partial registration form)
router.post(
  '/',
  validate(trainerLeadValidation.createTrainerLead),
  trainerLeadController.createTrainerLead
);

// Get all trainer leads with pagination and filtering (Admin only)
router.get(
  '/',
  auth('admin'),
  validate(trainerLeadValidation.getTrainerLeads),
  trainerLeadController.getAllTrainerLeads
);

// Export trainer leads matching the given filter as .xlsx (Admin only) — must be before '/:id'
router.get(
  '/export',
  auth('admin'),
  validate(trainerLeadValidation.exportTrainerLeads),
  trainerLeadController.exportTrainerLeads
);

// Update a trainer lead's triage status (Admin only)
router.patch(
  '/:id',
  auth('admin'),
  validate(trainerLeadValidation.updateTrainerLead),
  trainerLeadController.updateTrainerLead
);

// Delete a trainer lead (Admin only)
router.delete(
  '/:id',
  auth('admin'),
  validate(trainerLeadValidation.deleteTrainerLead),
  trainerLeadController.deleteTrainerLead
);

export default router;
