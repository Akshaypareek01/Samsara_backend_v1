import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as trackerController from '../../controllers/tracker.controller.js';
import * as trackerValidation from '../../validations/tracker.validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth());

/**
 * @route   GET /v1/trackers/dashboard
 * @desc    Get dashboard data (latest entries from all trackers)
 * @access  Private
 */
router.get('/dashboard', trackerController.getDashboardData);

/**
 * @route   GET /v1/trackers/status
 * @desc    Get tracker status for debugging
 * @access  Private
 */
router.get('/status', trackerController.getTrackerStatus);

/**
 * @route   GET /v1/trackers/weight/history
 * @desc    Get weight tracker history
 * @access  Private
 */
router.get('/weight/history', validate(trackerValidation.getTrackerHistory), trackerController.getWeightHistory);

/**
 * @route   GET /v1/trackers/weight/:entryId
 * @desc    Get weight tracker entry by ID
 * @access  Private
 */
router.get('/weight/:entryId', validate(trackerValidation.getTrackerEntryById), trackerController.getWeightById);

/**
 * @route   GET /v1/trackers/water/history
 * @desc    Get water tracker history
 * @access  Private
 */
router.get('/water/history', validate(trackerValidation.getTrackerHistory), trackerController.getWaterHistory);

/**
 * @route   GET /v1/trackers/water/today
 * @desc    Get today's water data
 * @access  Private
 */
router.get('/water/today', trackerController.getTodayWaterData);

/**
 * @route   GET /v1/trackers/water/hydration-status
 * @desc    Get hydration status based on current intake and target
 * @access  Private
 */
router.get('/water/hydration-status', trackerController.getHydrationStatus);

/**
 * @route   GET /v1/trackers/water/weekly-summary
 * @desc    Get weekly water summary
 * @access  Private
 */
router.get('/water/weekly-summary', trackerController.getWeeklyWaterSummary);

/**
 * @route   GET /v1/trackers/water/:entryId
 * @desc    Get water tracker entry by ID
 * @access  Private
 */
router.get('/water/:entryId', validate(trackerValidation.getTrackerEntryById), trackerController.getWaterById);

/**
 * @route   PUT /v1/trackers/water/target
 * @desc    Update water target/goal
 * @access  Private
 */
router.put('/water/target', validate(trackerValidation.updateWaterTarget), trackerController.updateWaterTarget);

/**
 * @route   DELETE /v1/trackers/water/intake/:trackerId
 * @desc    Delete water intake entry
 * @access  Private
 */
router.delete('/water/intake/:trackerId', validate(trackerValidation.deleteWaterIntake), trackerController.deleteWaterIntake);

/**
 * @route   GET /v1/trackers/mood/history
 * @desc    Get mood history
 * @access  Private
 */
router.get('/mood/history', validate(trackerValidation.getTrackerHistory), trackerController.getMoodHistory);

/**
 * @route   GET /v1/trackers/temperature/history
 * @desc    Get temperature tracker history
 * @access  Private
 */
router.get('/temperature/history', validate(trackerValidation.getTrackerHistory), trackerController.getTemperatureHistory);

/**
 * @route   GET /v1/trackers/fat/history
 * @desc    Get fat tracker history
 * @access  Private
 */
router.get('/fat/history', validate(trackerValidation.getTrackerHistory), trackerController.getFatHistory);

/**
 * @route   GET /v1/trackers/bmi/history
 * @desc    Get BMI tracker history
 * @access  Private
 */
router.get('/bmi/history', validate(trackerValidation.getTrackerHistory), trackerController.getBmiHistory);

/**
 * @route   GET /v1/trackers/body-status/history
 * @desc    Get body status history
 * @access  Private
 */
router.get('/body-status/history', validate(trackerValidation.getTrackerHistory), trackerController.getBodyStatusHistory);

/**
 * @route   GET /v1/trackers/body-status/:entryId
 * @desc    Get body status entry by ID
 * @access  Private
 */
router.get('/body-status/:entryId', validate(trackerValidation.getTrackerEntryById), trackerController.getBodyStatusById);

/**
 * @route   GET /v1/trackers/step/history
 * @desc    Get step tracker history
 * @access  Private
 */
router.get('/step/history', validate(trackerValidation.getTrackerHistory), trackerController.getStepHistory);

/**
 * @route   GET /v1/trackers/sleep/history
 * @desc    Get sleep tracker history
 * @access  Private
 */
router.get('/sleep/history', validate(trackerValidation.getTrackerHistory), trackerController.getSleepHistory);

/**
 * @route   GET /v1/trackers/sleep/:entryId
 * @desc    Get sleep tracker entry by ID
 * @access  Private
 */
router.get('/sleep/:entryId', validate(trackerValidation.getTrackerEntryById), trackerController.getSleepById);

/**
 * @route   POST /v1/trackers/weight
 * @desc    Add weight entry
 * @access  Private
 */
router.post('/weight', validate(trackerValidation.createWeightTracker), trackerController.addWeightEntry);

/**
 * @route   POST /v1/trackers/water
 * @desc    Add water entry
 * @access  Private
 */
router.post('/water', validate(trackerValidation.addWaterIntake), trackerController.addWaterEntry);

/**
 * @route   POST /v1/trackers/mood
 * @desc    Add mood entry
 * @access  Private
 */
router.post('/mood', validate(trackerValidation.createMoodTracker), trackerController.addMoodEntry);

/**
 * @route   POST /v1/trackers/temperature
 * @desc    Add temperature entry
 * @access  Private
 */
router.post('/temperature', validate(trackerValidation.createTemperatureTracker), trackerController.addTemperatureEntry);

/**
 * @route   POST /v1/trackers/fat
 * @desc    Add fat entry
 * @access  Private
 */
router.post('/fat', validate(trackerValidation.createFatTracker), trackerController.addFatEntry);

/**
 * @route   POST /v1/trackers/bmi
 * @desc    Add BMI entry
 * @access  Private
 */
router.post('/bmi', validate(trackerValidation.createBmiTracker), trackerController.addBmiEntry);

/**
 * @route   POST /v1/trackers/body-status
 * @desc    Add body status entry
 * @access  Private
 */
router.post('/body-status', validate(trackerValidation.createBodyStatusTracker), trackerController.addBodyStatusEntry);

/**
 * @route   POST /v1/trackers/step
 * @desc    Add step entry
 * @access  Private
 */
router.post('/step', validate(trackerValidation.createStepTracker), trackerController.addStepEntry);

/**
 * @route   POST /v1/trackers/sleep
 * @desc    Add sleep entry
 * @access  Private
 */
router.post('/sleep', validate(trackerValidation.createSleepTracker), trackerController.addSleepEntry);

/**
 * @route   POST /v1/trackers/workout
 * @desc    Add workout entry
 * @access  Private
 */
router.post('/workout', validate(trackerValidation.addWorkoutEntry), trackerController.addWorkoutEntry);

/**
 * @route   GET /v1/trackers/workout/history
 * @desc    Get workout history
 * @access  Private
 */
router.get('/workout/history', validate(trackerValidation.getWorkoutByType), trackerController.getWorkoutHistory);

/**
 * @route   GET /v1/trackers/workout/by-type
 * @desc    Get workout by type
 * @access  Private
 */
router.get('/workout/by-type', validate(trackerValidation.getWorkoutByType), trackerController.getWorkoutByType);

/**
 * @route   GET /v1/trackers/workout/summary
 * @desc    Get workout summary
 * @access  Private
 */
router.get('/workout/summary', validate(trackerValidation.getWorkoutSummary), trackerController.getWorkoutSummary);

/**
 * @route   PUT /v1/trackers/workout/:entryId
 * @desc    Update workout entry
 * @access  Private
 */
router.put('/workout/:entryId', validate(trackerValidation.updateWorkoutEntry), trackerController.updateWorkoutEntry);

/**
 * @route   DELETE /v1/trackers/workout/:entryId
 * @desc    Delete workout entry
 * @access  Private
 */
router.delete('/workout/:entryId', validate(trackerValidation.deleteWorkoutEntry), trackerController.deleteWorkoutEntry);

/**
 * @route   PUT /v1/trackers/:trackerType/:entryId
 * @desc    Update tracker entry
 * @access  Private
 */
router.put('/:trackerType/:entryId', validate(trackerValidation.updateTrackerEntry), trackerController.updateTrackerEntry);

/**
 * @route   DELETE /v1/trackers/:trackerType/:entryId
 * @desc    Delete tracker entry
 * @access  Private
 */
router.delete(
  '/:trackerType/:entryId',
  validate(trackerValidation.deleteTrackerEntry),
  trackerController.deleteTrackerEntry
);

export default router; 