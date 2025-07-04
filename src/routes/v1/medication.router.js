import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as medicationController from '../../controllers/medication.controller.js';
import * as medicationValidation from '../../validations/medication.validation.js';

const router = express.Router();

// Apply authentication to all routes
// router.use(auth());

// Medication Tracker Management
router
  .route('/tracker')
  .post(validate(medicationValidation.createMedicationTracker), medicationController.createMedicationTracker)
  .get(medicationController.getMedicationTracker);

// Health Conditions Management
router
  .route('/health-conditions')
  .post(validate(medicationValidation.addHealthCondition), medicationController.addHealthCondition);

router
  .route('/health-conditions/:conditionId')
  .patch(validate(medicationValidation.updateHealthCondition), medicationController.updateHealthCondition)
  .delete(validate(medicationValidation.deleteHealthCondition), medicationController.deleteHealthCondition);

// Medications Management
router
  .route('/medications')
  .post(validate(medicationValidation.addMedication), medicationController.addMedication);

router
  .route('/medications/:medicationId')
  .patch(validate(medicationValidation.updateMedication), medicationController.updateMedication)
  .delete(validate(medicationValidation.deleteMedication), medicationController.deleteMedication);

router
  .route('/medications/:medicationId/refill')
  .post(validate(medicationValidation.refillMedication), medicationController.refillMedication);

// Daily Schedule Management
router
  .route('/schedules')
  .post(validate(medicationValidation.createDailySchedule), medicationController.createDailySchedule);

router
  .route('/schedules/:scheduleId')
  .patch(validate(medicationValidation.updateDailySchedule), medicationController.updateDailySchedule);

router
  .route('/schedules/:scheduleId/mark-taken/:timeSlot')
  .post(validate(medicationValidation.markMedicationTaken), medicationController.markMedicationTaken);

// Schedule Queries
router
  .route('/schedules/by-date')
  .get(validate(medicationValidation.getScheduleByDate), medicationController.getScheduleByDate);

router
  .route('/schedules/by-date-range')
  .get(validate(medicationValidation.getScheduleByDateRange), medicationController.getScheduleByDateRange);

// Medication History and Analytics
router
  .route('/history')
  .get(validate(medicationValidation.getMedicationHistory), medicationController.getMedicationHistory);

router
  .route('/reminders')
  .get(validate(medicationValidation.getMedicationReminders), medicationController.getMedicationReminders);

router
  .route('/generate-schedule')
  .get(medicationController.generateDailySchedule);

router
  .route('/low-stock')
  .get(medicationController.getLowStockMedications);

router
  .route('/adherence-stats')
  .get(medicationController.getAdherenceStats);

export default router; 