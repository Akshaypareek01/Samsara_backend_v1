import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as trackerController from '../../controllers/tracker.controller.js';
import * as trackerValidation from '../../validations/tracker.validation.js';

const router = express.Router();

// Apply authentication to all routes
// router.use(auth());

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
 * @route   GET /v1/trackers/water/history
 * @desc    Get water tracker history
 * @access  Private
 */
router.get('/water/history', validate(trackerValidation.getTrackerHistory), trackerController.getWaterHistory);

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
router.post('/water', validate(trackerValidation.createWaterTracker), trackerController.addWaterEntry);

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
router.delete('/:trackerType/:entryId', validate(trackerValidation.deleteTrackerEntry), trackerController.deleteTrackerEntry);

export default router; 