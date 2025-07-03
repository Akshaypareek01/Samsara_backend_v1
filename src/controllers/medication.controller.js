import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as medicationService from '../services/medication.service.js';

/**
 * Create medication tracker
 */
const createMedicationTracker = catchAsync(async (req, res) => {
  const tracker = await medicationService.createMedicationTracker(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(tracker);
});

/**
 * Get medication tracker
 */
const getMedicationTracker = catchAsync(async (req, res) => {
  const tracker = await medicationService.getMedicationTracker(req.user.id);
  res.send(tracker);
});

/**
 * Add health condition
 */
const addHealthCondition = catchAsync(async (req, res) => {
  const condition = await medicationService.addHealthCondition(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(condition);
});

/**
 * Update health condition
 */
const updateHealthCondition = catchAsync(async (req, res) => {
  const condition = await medicationService.updateHealthCondition(
    req.user.id,
    req.params.conditionId,
    req.body
  );
  res.send(condition);
});

/**
 * Delete health condition
 */
const deleteHealthCondition = catchAsync(async (req, res) => {
  const result = await medicationService.deleteHealthCondition(
    req.user.id,
    req.params.conditionId
  );
  res.send(result);
});

/**
 * Add medication
 */
const addMedication = catchAsync(async (req, res) => {
  const medication = await medicationService.addMedication(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(medication);
});

/**
 * Update medication
 */
const updateMedication = catchAsync(async (req, res) => {
  const medication = await medicationService.updateMedication(
    req.user.id,
    req.params.medicationId,
    req.body
  );
  res.send(medication);
});

/**
 * Delete medication
 */
const deleteMedication = catchAsync(async (req, res) => {
  const result = await medicationService.deleteMedication(
    req.user.id,
    req.params.medicationId
  );
  res.send(result);
});

/**
 * Refill medication
 */
const refillMedication = catchAsync(async (req, res) => {
  const medication = await medicationService.refillMedication(
    req.user.id,
    req.params.medicationId,
    req.body
  );
  res.send(medication);
});

/**
 * Create daily schedule
 */
const createDailySchedule = catchAsync(async (req, res) => {
  const schedule = await medicationService.createDailySchedule(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(schedule);
});

/**
 * Update daily schedule
 */
const updateDailySchedule = catchAsync(async (req, res) => {
  const schedule = await medicationService.updateDailySchedule(
    req.user.id,
    req.params.scheduleId,
    req.body
  );
  res.send(schedule);
});

/**
 * Mark medication as taken
 */
const markMedicationTaken = catchAsync(async (req, res) => {
  const result = await medicationService.markMedicationTaken(
    req.user.id,
    req.params.scheduleId,
    req.params.timeSlot
  );
  res.send(result);
});

/**
 * Get medication history
 */
const getMedicationHistory = catchAsync(async (req, res) => {
  const history = await medicationService.getMedicationHistory(req.user.id, {
    days: parseInt(req.query.days) || 30,
    medicationId: req.query.medicationId,
    type: req.query.type
  });
  res.send(history);
});

/**
 * Get schedule by date
 */
const getScheduleByDate = catchAsync(async (req, res) => {
  const schedule = await medicationService.getScheduleByDate(
    req.user.id,
    new Date(req.query.date)
  );
  res.send(schedule);
});

/**
 * Get schedule by date range
 */
const getScheduleByDateRange = catchAsync(async (req, res) => {
  const schedules = await medicationService.getScheduleByDateRange(
    req.user.id,
    new Date(req.query.startDate),
    new Date(req.query.endDate)
  );
  res.send(schedules);
});

/**
 * Get medication reminders
 */
const getMedicationReminders = catchAsync(async (req, res) => {
  const reminders = await medicationService.getMedicationReminders(
    req.user.id,
    new Date(req.query.date || new Date()),
    req.query.includeCompleted === 'true'
  );
  res.send(reminders);
});

/**
 * Generate daily schedule
 */
const generateDailySchedule = catchAsync(async (req, res) => {
  const schedule = await medicationService.generateDailySchedule(
    req.user.id,
    new Date(req.query.date || new Date())
  );
  res.send(schedule);
});

/**
 * Get low stock medications
 */
const getLowStockMedications = catchAsync(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 7;
  const medications = await medicationService.getLowStockMedications(req.user.id, threshold);
  res.send(medications);
});

/**
 * Get adherence statistics
 */
const getAdherenceStats = catchAsync(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const stats = await medicationService.getAdherenceStats(req.user.id, days);
  res.send(stats);
});

export {
  createMedicationTracker,
  getMedicationTracker,
  addHealthCondition,
  updateHealthCondition,
  deleteHealthCondition,
  addMedication,
  updateMedication,
  deleteMedication,
  refillMedication,
  createDailySchedule,
  updateDailySchedule,
  markMedicationTaken,
  getMedicationHistory,
  getScheduleByDate,
  getScheduleByDateRange,
  getMedicationReminders,
  generateDailySchedule,
  getLowStockMedications,
  getAdherenceStats
}; 