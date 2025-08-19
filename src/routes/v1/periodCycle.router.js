import express from 'express';
import { periodCycleController } from '../../controllers/periodCycle.controller.js';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { periodCycleValidation } from '../../validations/periodCycle.validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(auth());

/**
 * @route   POST /api/v1/period-cycles/start
 * @desc    Start a new period cycle
 * @access  Private
 */
router.post('/start', periodCycleController.startNewCycle);

/**
 * @route   GET /api/v1/period-cycles/current
 * @desc    Get current active cycle
 * @access  Private
 */
router.get('/current', periodCycleController.getCurrentCycle);

/**
 * @route   GET /api/v1/period-cycles/history
 * @desc    Get cycle history
 * @access  Private
 */
router.get('/history', periodCycleController.getCycleHistory);

/**
 * @route   GET /api/v1/period-cycles/predictions
 * @desc    Get upcoming cycle predictions
 * @access  Private
 */
router.get('/predictions', periodCycleController.getPredictions);

/**
 * @route   GET /api/v1/period-cycles/analytics
 * @desc    Get cycle analytics
 * @access  Private
 */
router.get('/analytics', periodCycleController.getAnalytics);

/**
 * @route   GET /api/v1/period-cycles/:cycleId
 * @desc    Get specific cycle by ID
 * @access  Private
 */
router.get('/:cycleId', periodCycleController.getCycleById);

/**
 * @route   POST /api/v1/period-cycles/:cycleId/daily-log
 * @desc    Add or update daily log
 * @access  Private
 */
router.post('/:cycleId/daily-log', 
  validate(periodCycleValidation.updateDailyLog), 
  periodCycleController.updateDailyLog
);

/**
 * @route   PUT /api/v1/period-cycles/:cycleId/complete
 * @desc    Complete an active cycle
 * @access  Private
 */
router.put('/:cycleId/complete', periodCycleController.completeCycle);

/**
 * @route   PUT /api/v1/period-cycles/:cycleId/notes
 * @desc    Update cycle notes
 * @access  Private
 */
router.put('/:cycleId/notes', 
  validate(periodCycleValidation.updateNotes), 
  periodCycleController.updateCycleNotes
);

/**
 * @route   DELETE /api/v1/period-cycles/:cycleId
 * @desc    Delete a cycle
 * @access  Private
 */
router.delete('/:cycleId', periodCycleController.deleteCycle);

export default router;
